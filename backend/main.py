import time
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Initialize FastAPI app
app = FastAPI(title="GradPipe Showoff API")

# 2. Set up CORS (Cross-Origin Resource Sharing)
# This is CRITICAL to allow our React frontend (on localhost:5173)
# to talk to our backend (on localhost:8000).
origins = [
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],
)

# 3. Pydantic model for our mock response
class ProfileScore(BaseModel):
    resume_score: int
    github_score: int
    showoff_score: int
    rank: int

# 4. The "Mock" Endpoint
@app.post("/rank_profile", response_model=ProfileScore)
async def rank_profile(
    resume: UploadFile = File(...), 
    github_username: str = Form(...)
):
    """
    This is our "Wizard of Oz" mock endpoint.
    It accepts the real data, prints it to the console to prove
    it arrived, waits 1.5 seconds, and returns a hard-coded score.
    """
    
    print("--- MOCK ENGINE: DATA RECEIVED ---")
    print(f"Resume Filename: {resume.filename}")
    print(f"GitHub Username: {github_username}")
    print("-----------------------------------")
    
    # Simulate the "AI thinking"
    time.sleep(1.5)
    
    # The hard-coded "mock" response
    mock_scores = {
        "resume_score": 88,
        "github_score": 92,
        "showoff_score": 90,
        "rank": 142
    }
    
    return mock_scores

# 5. Root endpoint for testing
@app.get("/")
def read_root():
    return {"status": "GradPipe Showoff API is running."}

# 6. (This part is for running with `python main.py`, but we'll use uvicorn)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
