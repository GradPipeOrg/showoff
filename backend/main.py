import uvicorn
import asyncio  # For running tasks in parallel
import fitz       # PyMuPDF library
import httpx      # Async HTTP client
import os
import re
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.concurrency import run_in_threadpool # 1. IMPORT THIS

# --- START: CRITICAL CONFIGURATION ---
# PASTE YOUR GITHUB TOKEN HERE (for MVP)
# In production, we will move this to an environment variable.
GITHUB_PAT = "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"
# -------------------------------------

# 1. Initialize FastAPI app
app = FastAPI(title="GradPipe Showoff API")

# 2. Set up CORS
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Pydantic model for our response
class ProfileScore(BaseModel):
    resume_score: int
    github_score: int
    showoff_score: int
    rank: int

# --- 4. ENGINE v1: Heuristic Resume Parser ---

# 2. CREATE NEW SYNC HELPER FUNCTION
def score_resume_sync(pdf_bytes: bytes) -> int:
    """
    This is the SYNCHRONOUS, blocking function that runs the 
    CPU-bound PyMuPDF (fitz) logic.
    """
    print("--- Resume Parser (Sync): Starting ---")
    score = 0
    doc = None
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        full_text = ""
        for page in doc:
            full_text += page.get_text().lower()
        
        # --- Start Scoring Logic ---
        if "experience" in full_text: score += 10
        if "education" in full_text: score += 10
        if "projects" in full_text: score += 10
        if "skills" in full_text: score += 10
            
        action_verbs = ["led", "developed", "managed", "built", "created", "implemented", "designed"]
        if any(verb in full_text for verb in action_verbs):
            score += 15
            
        if re.search(r"\d+%", full_text) or re.search(r"\d+x", full_text):
            score += 15
            
        tech_keywords = {"python", "react", "node.js", "fastapi", "typescript", "java", "c++", "aws", "docker"}
        keyword_count = sum(1 for keyword in tech_keywords if keyword in full_text)
        score += min(keyword_count * 2, 20)
            
        # Access page_count BEFORE closing the document
        if doc.page_count == 1:
            score += 10
        elif doc.page_count > 2:
            score -= 10
            
        if "iit" in full_text:
             score += 5

        print(f"--- Resume Parser (Sync): Score = {score} ---")
        return max(0, min(score, 100))
        
    except Exception as e:
        print(f"--- Resume Parser (Sync): ERROR --- {e}")
        return 0
    finally:
        # Close the document in the finally block to ensure it's always closed
        if doc is not None:
            doc.close()

# 3. UPDATE THE ASYNC WRAPPER
async def parse_resume_score(file: UploadFile) -> int:
    """
    This is now a thin ASYNC wrapper. It reads the file bytes
    and then calls the blocking 'score_resume_sync' function
    in a separate thread pool.
    """
    print("--- Resume Parser (Async): Reading file... ---")
    
    # Read file into memory (this part is async and safe)
    pdf_bytes = await file.read()
    
    # Run the blocking function in the thread pool
    score = await run_in_threadpool(score_resume_sync, pdf_bytes)
    
    return score

# --- 5. ENGINE v2: GitHub Scorer ---

async def get_github_score(username: str) -> int:
    """
    Fetches GitHub data and scores it based on a heuristic algorithm.
    Runs asynchronously.
    """
    print("--- GitHub Scorer: Starting ---")
    score = 0
    headers = {"Authorization": f"token {GITHUB_PAT}"}
    
    try:
        async with httpx.AsyncClient() as client:
            # Task 1: Get User Data (Followers, Repos)
            user_url = f"https://api.github.com/users/{username}"
            user_response = await client.get(user_url, headers=headers)
            user_response.raise_for_status() # Raises error on 404, 403, etc.
            user_data = user_response.json()
            
            # Rule 1: Followers (+1 per 5 followers, max 20)
            score += min((user_data.get("followers", 0) // 5), 20)
            
            # Rule 2: Public Repos (+1 per repo, max 20)
            score += min(user_data.get("public_repos", 0), 20)
            
            # Task 2: Get Repo Data (Stars, Forks)
            repos_url = f"https://api.github.com/users/{username}/repos?per_page=100"
            repos_response = await client.get(repos_url, headers=headers)
            repos_response.raise_for_status()
            repos_data = repos_response.json()
            
            if repos_data:
                total_stars = sum(repo["stargazers_count"] for repo in repos_data)
                total_forks = sum(repo["forks_count"] for repo in repos_data)
                
                # Rule 3: Stars (+1 per 2 stars, max 30)
                score += min((total_stars // 2), 30)
                
                # Rule 4: Forks (+1 per fork, max 10)
                score += min(total_forks, 10)
                
                # Rule 5: Recent Activity (+10)
                # (This is a simple check, we can make it better later)
                recent_activity = any(
                    repo["pushed_at"] > "2025-09-01T00:00:00Z" for repo in repos_data
                ) # Checks for push in last ~2 months
                if recent_activity:
                    score += 10
            
            print(f"--- GitHub Scorer: Score = {score} ---")
            return max(0, min(score, 100)) # Clamp score
            
    except Exception as e:
        print(f"--- GitHub Scorer: ERROR --- {e}")
        return 0 # Return 0 on error

# --- 6. THE "REAL" ENDPOINT ---

@app.post("/rank_profile", response_model=ProfileScore)
async def rank_profile(
    resume: UploadFile = File(...), 
    github_username: str = Form(...)
):
    """
    This is the REAL endpoint.
    It runs the Resume and GitHub scorers in parallel.
    """
    
    print("--- REAL ENGINE: DATA RECEIVED ---")
    print(f"Resume Filename: {resume.filename}")
    print(f"GitHub Username: {github_username}")
    print("-----------------------------------")
    
    # Run both tasks at the same time
    # This is 10x faster than running them one-by-one
    task_a = asyncio.create_task(parse_resume_score(resume))
    task_b = asyncio.create_task(get_github_score(github_username))
    
    # Wait for both to finish
    resume_score, github_score = await asyncio.gather(task_a, task_b)
    
    # Calculate weighted "Show-off Score" (60% GitHub, 40% Resume)
    showoff_score = int((github_score * 0.6) + (resume_score * 0.4))
    
    # Placeholder for rank. Pratham's leaderboard will calculate this.
    rank = 0 
    
    return {
        "resume_score": resume_score,
        "github_score": github_score,
        "showoff_score": showoff_score,
        "rank": rank
    }

# 7. Root endpoint
@app.get("/")
def read_root():
    return {"status": "GradPipe Showoff API is running (v1.0 - Real Engine)"}

# 8. Uvicorn runner
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)