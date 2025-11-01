import os
import json
from celery import Celery
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import google.generativeai as genai
from supabase import create_client, Client
import httpx # We'll use the sync client here
from dotenv import load_dotenv

# --- 1. CONFIGURATION ---
load_dotenv() # Loads the .env file

REDIS_URL = os.environ.get("REDIS_URL")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") # This MUST be your Service Role Key
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
LLM_PROVIDER = "gemini" # Our "pluggable" switch

# --- 2. MASTER PROMPT v5 (v1.8 RUBRIC) ---
# This is our "gold standard" rubric
MASTER_PROMPT_V5 = """
You are an expert Senior Technical Recruiter and Hiring Manager at a top-tier tech firm (e.g., Google, Jane Street, or a top YC startup). Your *only* goal is to find the top 1% of elite *software engineers*. You are NOT hiring for community or marketing. You value deep, complex, and verifiable technical skill above all else. You are ruthlessly strict.

Your task is to analyze the resume I am about to upload. Read and parse the entire document. Then, score it *strictly* according to the **"Unified Scoring Rubric v1.8 (Elite Engineering-Focused)"** below.

You must score *only* the Resume Analysis part. The total score you give must be between **0 and 100**.

---
## Unified Scoring Rubric v1.8 (Elite Engineering-Focused)

### 1. Foundational Professionalism & Clarity (Max 10 pts)
*(A basic "pass/fail" check for following instructions.)*
* **1.1: Presentation Standards (5 pts)**
    * **5 pts:** Single page, clean format, no typos.
    * **3 pts:** Minor issues (e.g., 1-2 typos, 2 pages).
    * **1 pt:** Multiple major issues.
* **1.2: Structure & Links (5 pts)**
    * **5 pts:** Optimal order, functional GitHub & LinkedIn links.
    * **3 pts:** Non-optimal order, or links missing.
    * **1 pt:** Illogical, missing GitHub link.

### 2. Technical Proficiency Signals (Max 20 pts)
*(A keyword check. This is just a claim, not proof.)*
* **2.1: Skill Relevance & Demand (10 pts)**
    * **10 pts:** Lists multiple, relevant, in-demand 2025 tech (e.g., Python, React, Node.js, C++, AWS, Docker).
    * **5 pts:** Mix of relevant and basic/less-critical tech.
    * **1 pt:** Dominated by basic/irrelevant tech.
* **2.2: Skill Grouping & Clarity (10 pts)**
    * **10 pts:** Skills are clearly categorized (Languages, Frameworks, Tools) AND there are NO subjective self-ratings (e.g., "Python 8/10").
    * **5 pts:** Skills are in a single block OR they include subjective self-ratings (a minor red flag).
    * **1 pt:** Disorganized and includes subjective ratings.

### 3. Evidence of Impact & Technical Depth (Max 60 pts)
*(This is the MOST IMPORTANT section, worth 60 points of the total score.)*
* **3.1: Quantification & Verbs (10 pts)**
    * **10 pts:** Majority of bullets (in Projects/Experience) are quantified with specific metrics AND use strong action verbs (e.g., "Architected," "Optimized").
    * **5 pts:** Some quantification OR good verbs, but not both.
    * **1 pt:** No quantified impact; just a list of responsibilities.
* **3.2: Project/Experience Technical Complexity (50 pts) - [CRITICAL]**
    * **50 pts:** **(Top 1% / Elite)** Overwhelming evidence of *multiple*, *deeply complex*, and *self-directed* projects (e.g., building a systems-level tool like a parser/compiler, novel ML research, a full-stack app with microservices/k8s). OR a high-impact internship at an *elite* tech/quant firm (e.g., Google, Jane Street, Rubrik, Quadeye) with clear, quantified achievements.
    * **30 pts:** **(Strong Engineer)** Describes *one* very complex project OR a solid internship at a good tech company (e.g., Microsoft, Amazon, Oracle). The tech stack is modern and applied correctly.
    * **15 pts:** **(Good Student)** Projects are of moderate complexity (e.g., frontend + public API, standard ML model clones) or a limited-scope internship. This is the "meets expectations" tier.
    * **1 pt:** **(Low Signal)** Projects are trivial, tutorial-clones, or "Java (Basic)"-level. Descriptions are vague.

### 4. Growth & Leadership Indicators (Max 10 pts)
*(A "tie-breaker" or "bonus" for well-rounded candidates. This section CANNOT save a technically weak profile.)*
* **4.1: Proactive Learning/Initiative (5 pts)**
    * **5 pts:** Multiple examples of *technical* activities outside of coursework (e.g., hackathons, *technical* clubs, significant personal projects).
    * **2 pts:** One or two such activities mentioned.
    * **0 pts:** No evidence of initiative beyond coursework.
* **4.2: Leadership & Teamwork (PoR) (5 pts)**
    * **5 pts:** Mentions a formal *technical* leadership PoR (e.g., "Tech Lead," "Project Head") OR clearly describes leading a team on a complex project.
    * **2 pts:** Mentions a non-technical PoR (e.g., "Community Manager"), a mentorship role, or just "worked in a team."
    * **0 pts:** No mention of teamwork or leadership.

---

**YOUR TASK:**
Read the resume PDF I upload. Evaluate it *strictly* against this **v1.8 Elite Engineering-Focused** rubric. Provide your final score and a brief justification in a single JSON object. Do not add any other text.

**Output Format:**
{
  "total_score_100": <your_final_score_0_to_100>,
  "justification": "<Your 2-sentence rationale for the score>"
}
"""

# --- 3. SETUP: CELERY, SUPABASE, GEMINI ---
celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel(model_name="gemini-2.5-pro-preview-03-25")

# --- 4. MODULAR LLM "ROUTER" (SYNC) ---

def _call_gemini_api_sync(resume_bytes: bytes) -> dict:
    """
    Private SYNC function to call the Gemini API.
    """
    print("--- [Worker] Calling Gemini API... ---")
    try:
        # Gemini can accept raw bytes for PDFs
        resume_file_blob = {"mime_type": "application/pdf", "data": resume_bytes}
        
        response = gemini_model.generate_content(
            [MASTER_PROMPT_V5, resume_file_blob],
            generation_config={"response_mime_type": "application/json"},
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"--- [Worker] Gemini API ERROR: {e} ---")
        # Return a 0 score but log the justification for debugging
        return {"total_score_100": 0, "justification": f"Error: {e}"}


def score_resume_with_llm_sync(resume_bytes: bytes) -> dict:
    """
    This is our "pluggable" router. It calls the
    correct LLM based on the LLM_PROVIDER config.
    """
    if LLM_PROVIDER == "gemini":
        return _call_gemini_api_sync(resume_bytes)
    # elif LLM_PROVIDER == "deepseek":
    #   return _call_deepseek_api_sync(resume_bytes)
    else:
        print(f"--- [Worker] ERROR: Unknown LLM Provider '{LLM_PROVIDER}' ---")
        return {"total_score_100": 0, "justification": "Error: Invalid LLM Provider"}


# --- 5. "BETA ENGINE" GITHUB SCORER (v2.0 HEURISTIC) ---
def get_github_score_v2_heuristic(username: str) -> int:
    """
    This is the NEW "Beta Engine" (v2.0) Heuristic.
    It implements the General Rubric PDF by making multiple API calls.
    It is SYNCHRONOUS.
    """
    print(f"--- [Worker] GitHub Scorer (v2.0 Heuristic): Starting for {username} ---")
    total_score = 0
    headers = {"Authorization": f"token {os.environ.get('GITHUB_PAT')}"}
    
    # Define our rubric weights
    WEIGHTS = {
        'profile_polish': 5,
        'pinned_repos': 5,
        'readme_quality': 15,
        'code_structure_and_tests': 35,
        'commit_history': 20,
        'branching': 10,
        'oss_contribs': 5,
        'community_signals': 5
    }
    
    try:
        with httpx.Client(headers=headers, timeout=20.0) as client:
            
            # --- 1. Profile Curation (Max 10 pts) ---
            user_url = f"https://api.github.com/users/{username}"
            user_response = client.get(user_url)
            if user_response.status_code != 200: 
                print(f"--- [Worker] GitHub Scorer: ERROR - User {username} not found. ---")
                return 0
            user_data = user_response.json()
            
            # 1.1: Profile Polish (5 pts)
            if user_data.get("bio") and user_data.get("name"):
                total_score += WEIGHTS['profile_polish']
            elif user_data.get("bio") or user_data.get("name"):
                total_score += 2
            
            # 1.2: Pinned Repos (5 pts)
            graphql_query = {"query": f'query {{ user(login: "{username}") {{ pinnedItems(first: 6, types: REPOSITORY) {{ nodes {{ ... on Repository {{ name description, stargazerCount }} }} }} }} }}'}
            gql_response = client.post("https://api.github.com/graphql", json=graphql_query)
            repo_nodes = []
            if gql_response.status_code == 200:
                repo_nodes = gql_response.json().get("data", {}).get("user", {}).get("pinnedItems", {}).get("nodes", [])
            
            if repo_nodes and len(repo_nodes) >= 2:
                total_score += WEIGHTS['pinned_repos']
            elif repo_nodes:
                total_score += 1

            # --- 2. Project Quality & Depth (Max 50 pts) ---
            repo_analysis_score = 0
            repo_url = "" # Define repo_url in the outer scope
            if repo_nodes:
                # We will analyze *one* pinned repo to save time/API calls
                repo_name = repo_nodes[0].get("name")
                repo_url = f"https://api.github.com/repos/{username}/{repo_name}"
                
                # 2.1 README Quality (15 pts)
                readme_response = client.get(f"{repo_url}/readme")
                if readme_response.status_code == 200 and readme_response.json().get("size", 0) > 200: # Check if README has > 200 bytes
                    repo_analysis_score += WEIGHTS['readme_quality']
                elif readme_response.status_code == 200:
                    repo_analysis_score += 7

                # 2.2 & 2.3 Code Structure & Testing (35 pts)
                tree_response = client.get(f"{repo_url}/git/trees/main?recursive=1") # Assumes 'main' branch
                if tree_response.status_code != 200: # Try 'master' as fallback
                    tree_response = client.get(f"{repo_url}/git/trees/master?recursive=1")
                
                if tree_response.status_code == 200:
                    files = tree_response.json().get("tree", [])
                    paths = {f.get("path", "").lower() for f in files}
                    
                    has_tests = any("test" in p or ".spec." in p or ".github/workflows" in p or "pytest.ini" in p for p in paths)
                    has_src = any("src/" in p for p in paths)
                    
                    if has_tests and has_src:
                        repo_analysis_score += WEIGHTS['code_structure_and_tests'] # (Elite)
                    elif has_tests or has_src:
                        repo_analysis_score += 20 # (Strong)
                    else:
                        repo_analysis_score += 5  # (Good)
            
            total_score += repo_analysis_score # Add up to 50 pts
            
            # --- 3. Engineering Craftsmanship (Max 30 pts) ---
            # 3.1 Commit History
            commits_response = client.get(f"{repo_url}/commits?per_page=10") if repo_url else None
            commits = commits_response.json() if commits_response and commits_response.status_code == 200 else []
            if len(commits) > 5: # More than 5 commits
                total_score += WEIGHTS['commit_history']
            elif len(commits) > 1: # More than "Initial Commit"
                total_score += 10
            
            # 3.2 Branching
            branches_response = client.get(f"{repo_url}/branches") if repo_url else None
            if branches_response and branches_response.status_code == 200 and len(branches_response.json()) > 1:
                total_score += WEIGHTS['branching']
            
            # --- 4. Community Engagement (Max 10 pts - "Bonus") ---
            # 4.1 OSS Contributions
            contrib_url = f"https://api.github.com/search/issues?q=author:{username}+is:pr+is:merged+-user:{username}"
            contrib_response = client.get(contrib_url)
            if contrib_response.status_code == 200 and contrib_response.json().get("total_count", 0) > 0:
                total_score += WEIGHTS['oss_contribs']
            
            # 4.2 Stars/Forks
            stars = repo_nodes[0].get("stargazerCount", 0) if repo_nodes else 0
            if user_data.get("followers", 0) > 5 or stars > 5:
                total_score += WEIGHTS['community_signals']
                
            print(f"--- [Worker] GitHub Scorer (v2.0 Heuristic): Score = {total_score}/100 ---")
            return max(0, min(total_score, 100)) # Clamp score

    except Exception as e:
        print(f"--- [Worker] GitHub Scorer (v2.0 Heuristic): CRITICAL ERROR --- {e}")
        return 0


# --- 6. CELERY TASK: THE "BRAIN" ---
@celery_app.task(name="run_deep_analysis")
def run_deep_analysis(user_id: str, github_username: str, resume_path: str):
    """
    This is the main "job" the worker runs.
    It is SYNCHRONOUS and will run to completion.
    """
    print(f"--- [Worker] Job Started for user: {user_id} ---")
    
    # 1. Download Resume from Supabase Storage
    print(f"--- [Worker] Downloading resume: {resume_path} ---")
    try:
        # The supabase-python client storage download is synchronous
        resume_bytes = supabase.storage.from_("resumes").download(resume_path)
    except Exception as e:
        print(f"--- [Worker] ERROR downloading file: {e} ---")
        return # Job fails
    
    # 2. Score Resume with our "Pluggable" LLM (Gemini)
    resume_score_data = score_resume_with_llm_sync(resume_bytes)
    resume_score = resume_score_data.get("total_score_100", 0)
    resume_justification = resume_score_data.get("justification", "Analysis complete.") # Get the justification
    
    # 3. Score GitHub with NEW "Beta Engine" (v2.0 Heuristic)
    github_score = get_github_score_v2_heuristic(github_username)
    
    # 4. Calculate Final Score (NEW 70/30 WEIGHTING)
    showoff_score = int((resume_score * 0.7) + (github_score * 0.3))
    
    # 5. Save *ALL* scores to Supabase
    print(f"--- [Worker] Saving scores for {user_id}: R={resume_score}, G={github_score}, Total={showoff_score} ---")
    try:
        supabase.from_("profiles").update({
            "resume_score": resume_score,
            "github_score": github_score,
            "showoff_score": showoff_score,
            "resume_justification": resume_justification,
            "rank": 0 # We'll calculate rank later
        }).eq("user_id", user_id).execute()
        
        print(f"--- [Worker] Job COMPLETE for user: {user_id} ---")
    except Exception as e:
        print(f"--- [Worker] ERROR saving to Supabase: {e} ---")
