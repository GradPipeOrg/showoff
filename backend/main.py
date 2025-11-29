import uvicorn
import os
import json
import random
import string
import smtplib
import ssl
import redis
from email.message import EmailMessage
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from celery import Celery
from supabase import create_client, Client
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv

# --- 1. CONFIGURATION ---
load_dotenv() # This loads the .env file

REDIS_URL = os.environ.get("REDIS_URL")
if REDIS_URL and REDIS_URL.startswith("rediss://"):
    REDIS_URL = f"{REDIS_URL}?ssl_cert_reqs=none"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") # This MUST be your Service Role Key

if not SUPABASE_URL or not SUPABASE_KEY:
    print("--- CRITICAL ERROR: SUPABASE_URL or SUPABASE_KEY not set in .env file ---")
    exit(1)

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
EMAIL_FROM = os.environ.get("EMAIL_FROM")

# Redis client for OTP storage
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True) if REDIS_URL else None
OTP_TTL_SECONDS = int(os.environ.get("OTP_TTL_SECONDS", "600"))
OTP_PREFIX = "college_otp:"

COLLEGE_DOMAINS = {
    'iitb.ac.in': 'IIT Bombay',
    'iitd.ac.in': 'IIT Delhi',
    'iitm.ac.in': 'IIT Madras',
    'iitk.ac.in': 'IIT Kanpur',
    'iitkgp.ac.in': 'IIT Kharagpur',
    'iitr.ac.in': 'IIT Roorkee',
    'iitg.ac.in': 'IIT Guwahati',
    'iitbhu.ac.in': 'IIT BHU',
    'iith.ac.in': 'IIT Hyderabad',
    'nitt.edu': 'NIT Trichy',
    'nitk.edu.in': 'NIT Surathkal',
    'nitw.ac.in': 'NIT Warangal',
    'nitc.ac.in': 'NIT Calicut'
}

# --- 2. SETUP: FASTAPI, CELERY, SUPABASE ---
app = FastAPI(title="GradPipe Showoff API (v3.1 - Job Submitter)")

# Connect to Celery (Redis)
celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

# Connect to Supabase (with Service Key)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 3. Set up CORS
# Allow multiple origins from environment variable, fallback to localhost for dev
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
# Split by comma if multiple origins are provided
origins = [origin.strip() for origin in cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Pydantic model for our *new* response
class JobStatus(BaseModel):
    status: str
    message: str

class CollegeSendOtpRequest(BaseModel):
    email: EmailStr

class CollegeVerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    user_id: str

class CollegeResetRequest(BaseModel):
    user_id: str

def _ensure_email_service_configured():
    if not all([SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, EMAIL_FROM]):
        raise HTTPException(status_code=500, detail="Email service is not configured. Please set SMTP credentials.")

def _ensure_redis_configured():
    if not redis_client:
        raise HTTPException(status_code=500, detail="OTP storage is not configured. Please set REDIS_URL.")

def send_verification_email(recipient: str, otp: str, college_name: str):
    _ensure_email_service_configured()
    message = EmailMessage()
    message["Subject"] = "GradPipe Showoff - College Verification Code"
    message["From"] = EMAIL_FROM
    message["To"] = recipient
    body = f"""
Hi there,

Use the verification code below to confirm your enrollment at {college_name}:

Verification Code: {otp}

This code expires in {OTP_TTL_SECONDS // 60} minutes.

If you did not initiate this verification, please ignore this email.

— Team GradPipe Showoff
"""
    message.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)

def _store_otp(email: str, otp: str, college_name: str):
    _ensure_redis_configured()
    key = f"{OTP_PREFIX}{email.lower()}"
    payload = json.dumps({"otp": otp, "college_name": college_name})
    redis_client.setex(key, OTP_TTL_SECONDS, payload)

def _retrieve_otp(email: str):
    _ensure_redis_configured()
    key = f"{OTP_PREFIX}{email.lower()}"
    value = redis_client.get(key)
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None

def _delete_otp(email: str):
    if redis_client:
        redis_client.delete(f"{OTP_PREFIX}{email.lower()}")

# --- 5. SYNCHRONOUS HELPER FOR UPLOADS ---
def upload_to_storage_sync(path: str, file_bytes: bytes):
    """
    This is a blocking function. We will run it in a threadpool.
    """
    try:
        # The supabase-python client's storage is synchronous
        supabase.storage.from_("resumes").upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )
        print(f"--- [API] File uploaded to: {path} ---")
    except Exception as e:
        # We'll let the main thread handle the exception
        raise e

# --- 6. THE NEW "JOB SUBMITTER" ENDPOINT ---
@app.post("/rank_profile", response_model=JobStatus)
async def rank_profile(
    resume: UploadFile = File(...), 
    github_username: str = Form(...),
    user_id: str = Form(...) # We will get this from the frontend
):
    """
    This endpoint NO LONGER does analysis.
    It saves the file, creates a job, and returns instantly.
    """
    print(f"--- [API] Job Received for user: {user_id} ---")
    
    # 1. Read the file into memory (async)
    try:
        pdf_bytes = await resume.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {e}")

    # 2. Save Resume to Supabase Storage (in a thread)
    # The RLS policy we wrote requires the path to start with the user's ID
    resume_path = f"{user_id}/{resume.filename}"
    try:
        # Run the blocking 'upload' in a separate thread
        await run_in_threadpool(upload_to_storage_sync, resume_path, pdf_bytes)
    except Exception as e:
        print(f"--- [API] ERROR uploading file: {e} ---")
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")

    # 3. Create Celery Job
    try:
        celery_app.send_task(
            "run_deep_analysis", # This task name must match our future worker.py
            args=[user_id, github_username, resume_path]
        )
        print(f"--- [API] Job sent to Celery/Redis for user: {user_id} ---")
    except Exception as e:
        print(f"--- [API] ERROR sending to Celery: {e} ---")
        # This usually means Redis isn't running
        raise HTTPException(status_code=500, detail=f"Error queueing job: {e}")

    # 4. Return Instant Success
    return {
        "status": "processing",
        "message": "Your profile analysis has started. Scores will appear on your dashboard."
    }

@app.post("/college/send_otp")
def send_college_otp(payload: CollegeSendOtpRequest):
    email = payload.email.lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    domain = email.split("@")[-1]
    college_name = COLLEGE_DOMAINS.get(domain)
    if not college_name:
        raise HTTPException(status_code=400, detail="Sorry, this college is not yet supported.")

    otp = ''.join(random.choices(string.digits, k=6))
    _store_otp(email, otp, college_name)

    try:
        send_verification_email(email, otp, college_name)
    except Exception as exc:
        _delete_otp(email)
        print(f"--- [OTP] ERROR sending email: {exc}")
        raise HTTPException(status_code=500, detail="Failed to send verification email.")

    return {"status": "otp_sent", "college_name": college_name}

@app.post("/college/verify_otp")
def verify_college_otp(payload: CollegeVerifyOtpRequest):
    email = payload.email.lower()
    otp_record = _retrieve_otp(email)
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP expired or not found.")

    if payload.otp != otp_record.get("otp"):
        raise HTTPException(status_code=400, detail="Incorrect verification code.")

    college_name = otp_record.get("college_name")
    _delete_otp(email)

    try:
        update_response = supabase.from_("profiles").update({"verified_college": college_name}).eq("user_id", payload.user_id).execute()
        if update_response.get("error"):
            raise Exception(update_response["error"])
    except Exception as exc:
        print(f"--- [OTP] ERROR updating profile: {exc}")
        raise HTTPException(status_code=500, detail="Failed to update profile with verified college.")

    return {"college_name": college_name}

@app.post("/college/reset_verification")
def reset_college_verification(payload: CollegeResetRequest):
    try:
        update_response = supabase.from_("profiles").update({"verified_college": None}).eq("user_id", payload.user_id).execute()
        if update_response.get("error"):
            raise Exception(update_response["error"])
    except Exception as exc:
        print(f"--- [OTP] ERROR resetting profile: {exc}")
        raise HTTPException(status_code=500, detail="Failed to reset college verification status.")
    return {"status": "reset"}

@app.get("/")
def read_root():
    return {"status": "GradPipe Showoff API is running (v3.1 - Job Submitter)"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)