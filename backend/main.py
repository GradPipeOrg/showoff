import uvicorn
import asyncio
import fitz       # PyMuPDF library
import httpx
import os
import re
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.concurrency import run_in_threadpool

# --- START: CRITICAL CONFIGURATION ---
# PASTE YOUR GITHUB TOKEN HERE (for MVP)
GITHUB_PAT = "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"
# -------------------------------------

app = FastAPI(title="GradPipe Showoff API")
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProfileScore(BaseModel):
    resume_score: int
    github_score: int
    showoff_score: int
    rank: int

# --- 4. ENGINE v1.5: Resume Scoring Rubric ---

def score_resume_sync(pdf_bytes: bytes) -> int:
    """
    This is the SYNCHRONOUS, blocking function that runs the 
    CPU-bound PyMuPDF (fitz) logic and our v1.5 Heuristic Rubric.
    """
    print("--- Resume Parser (v1.5): Starting ---")
    total_score = 0
    doc = None
    
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        full_text = ""
        for page in doc:
            full_text += page.get_text().lower()
        
        # --- 1.1: Foundational Professionalism & Clarity (10 pts) ---
        
        # 1.1.1: Presentation Standards (5 pts)
        page_count = doc.page_count
        if page_count == 1 and "gmail.com" in full_text: # Simple checks for now
            total_score += 5
        elif page_count <= 2:
            total_score += 3
        else:
            total_score += 1

        # 1.1.2: Structure & Links (5 pts)
        if "github.com" in full_text and "linkedin.com" in full_text:
            total_score += 5
        elif "github.com" in full_text:
            total_score += 3
        else:
            total_score += 1
            
        # --- 1.2: Technical Proficiency Signals (10 pts) ---
        
        # 1.2.1: Skill Relevance & Demand (5 pts)
        tech_keywords = {"python", "react", "node.js", "fastapi", "typescript", "java", "c++", "aws", "docker", "kubernetes", "sql"}
        keyword_count = sum(1 for keyword in tech_keywords if keyword in full_text)
        if keyword_count > 5:
            total_score += 5
        elif keyword_count > 2:
            total_score += 3
        else:
            total_score += 1
            
        # 1.2.2: Skill Grouping & Clarity (5 pts)
        if "languages" in full_text and "frameworks" in full_text and "tools" in full_text:
            total_score += 5
        elif "skills" in full_text:
            total_score += 2

        # --- 1.3: Evidence of Impact & Initiative (15 pts) ---
        
        # 1.3.1: Quantification of Achievements (7 pts)
        if re.search(r"\d+%", full_text) or re.search(r"\d+x", full_text):
            total_score += 7
        elif re.search(r"increased", full_text) or re.search(r"reduced", full_text):
            total_score += 3
        
        # 1.3.2: Use of Strong Action Verbs (3 pts)
        action_verbs = {"led", "developed", "managed", "built", "created", "implemented", "designed", "architected", "optimized"}
        action_verb_count = sum(1 for verb in action_verbs if verb in full_text)
        if action_verb_count > 3:
            total_score += 3
        elif action_verb_count > 1:
            total_score += 1
            
        # 1.3.3: Project/Experience Complexity (5 pts)
        if "intern" in full_text or "full-stack" in full_text or "machine learning" in full_text:
            total_score += 5
        elif "project" in full_text:
            total_score += 2

        # --- 1.4: Growth & Collaboration Indicators (5 pts) ---
        
        # 1.4.1: Proactive Learning/Initiative (3 pts)
        if "hackathon" in full_text or "club" in full_text:
            total_score += 3
            
        # 1.4.2: Leadership & Teamwork (PoR) (2 pts)
        if "lead" in full_text or "mentor" in full_text or "head" in full_text:
            total_score += 2
        
        # --- Final Score Clamping ---
        # We will scale this 45-point max up to 100 for the resume score
        scaled_score = int((total_score / 45.0) * 100)
        
        print(f"--- Resume Parser (v1.5): Raw Score = {total_score}/45, Scaled = {scaled_score}/100 ---")
        return max(0, min(scaled_score, 100)) # Clamp score 0-100
        
    except Exception as e:
        print(f"--- Resume Parser (v1.5): ERROR --- {e}")
        return 0
    finally:
        if doc:
            doc.close()
            print("--- Resume Parser (v1.5): Document closed. ---")

async def parse_resume_score(file: UploadFile) -> int:
    """
    Async wrapper for the blocking resume parser.
    """
    print("--- Resume Parser (Async): Reading file... ---")
    pdf_bytes = await file.read()
    score = await run_in_threadpool(score_resume_sync, pdf_bytes)
    return score

# --- 5. ENGINE v1.5: GitHub Scoring Rubric ---

async def get_github_score(username: str) -> int:
    """
    Fetches GitHub data and scores it based on our v1.5 Heuristic Rubric.
    """
    print("--- GitHub Scorer (v1.5): Starting ---")
    total_score = 0
    headers = {"Authorization": f"token {GITHUB_PAT}"}
    
    try:
        async with httpx.AsyncClient() as client:
            # FIX: Correct the GitHub API URL (missing slash after https:)
            user_url = f"https://api.github.com/users/{username}"
            user_response = await client.get(user_url, headers=headers)
            
            if user_response.status_code != 200:
                print(f"--- GitHub Scorer: ERROR - User {username} not found or API error. ---")
                return 0
            
            user_data = user_response.json()

            # --- 2.1: Profile Curation & Professionalism (10 pts) ---
            
            # 2.1.1: Profile Polish (5 pts)
            if user_data.get("bio") and user_data.get("name"):
                total_score += 5
            elif user_data.get("bio") or user_data.get("name"):
                total_score += 3
            
            # 2.1.2: Pinned Repositories (5 pts)
            # This is hard to get. We'll check for public repos as a proxy.
            if user_data.get("public_repos", 0) > 5:
                total_score += 5
            elif user_data.get("public_repos", 0) > 1:
                total_score += 3
            
            # --- 2.2: Project Quality & Depth (25 pts) ---
            # This requires fetching repos, which is slow.
            # We'll use simpler proxies for v1.5
            
            # 2.2.1: README Quality (10 pts) - *Simplified*: We'll skip deep repo analysis for speed
            # 2.2.2: Code Quality (10 pts) - *Simplified*
            # 2.2.3: Testing (5 pts) - *Simplified*
            
            # Simplified proxy for Project Quality:
            total_score += 10 # Base points for having repos
            
            # --- 2.3: Engineering Craftsmanship (15 pts) ---
            # 2.3.1: Commit History (10 pts) - *Simplified*: We'll use total contributions
            # We can't get this easily. We'll use followers/stars as a proxy.
            
            # --- 2.4: Community Engagement (10 pts) ---
            # 2.4.1: OSS Contributions (7 pts) - *Simplified*
            
            # 2.4.2: Community Signals (3 pts - Bonus)
            stars_and_followers = user_data.get("followers", 0)
            total_score += min(stars_and_followers // 2, 10) # 1 pt per 2, max 10
            
            # Simple score: 10 base + 10 quality proxy + (up to 10) followers
            scaled_score = int((total_score / 30.0) * 100)
            
            print(f"--- GitHub Scorer (v1.5): Raw Score = {total_score}/30, Scaled = {scaled_score}/100 ---")
            return max(0, min(scaled_score, 100))
            
    except Exception as e:
        print(f"--- GitHub Scorer (v1.5): ERROR --- {e}")
        return 0

# --- 6. THE "REAL" ENDPOINT ---

@app.post("/rank_profile", response_model=ProfileScore)
async def rank_profile(
    resume: UploadFile = File(...), 
    github_username: str = Form(...)
):
    print("--- REAL ENGINE (v1.5): DATA RECEIVED ---")
    
    task_a = asyncio.create_task(parse_resume_score(resume))
    task_b = asyncio.create_task(get_github_score(github_username))
    
    resume_score, github_score = await asyncio.gather(task_a, task_b)
    
    # --- Final Weighted Score ---
    # Resume (40%) + GitHub (60%)
    showoff_score = int((resume_score * 0.4) + (github_score * 0.6))
    
    rank = 0 # Placeholder
    
    return {
        "resume_score": resume_score,
        "github_score": github_score,
        "showoff_score": showoff_score,
        "rank": rank
    }

# (Keep root endpoint and uvicorn runner as-is)
@app.get("/")
def read_root():
    return {"status": "GradPipe Showoff API is running (v1.5 - Heuristic Engine)"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)