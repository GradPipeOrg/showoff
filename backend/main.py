import uvicorn
import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from celery import Celery
from supabase import create_client, Client
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv

# --- 1. CONFIGURATION ---
load_dotenv() # This loads the .env file

REDIS_URL = os.environ.get("REDIS_URL")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") # This MUST be your Service Role Key

if not SUPABASE_URL or not SUPABASE_KEY:
    print("--- CRITICAL ERROR: SUPABASE_URL or SUPABASE_KEY not set in .env file ---")
    exit(1)

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

@app.get("/")
def read_root():
    return {"status": "GradPipe Showoff API is running (v3.1 - Job Submitter)"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)