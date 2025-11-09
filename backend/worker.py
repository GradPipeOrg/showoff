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
if REDIS_URL and REDIS_URL.startswith("rediss://"):
    REDIS_URL = f"{REDIS_URL}?ssl_cert_reqs=none"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") # This MUST be your Service Role Key
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
LLM_PROVIDER = "gemini" # Our "pluggable" switch
GITHUB_PAT = os.environ.get("GITHUB_PAT")

# --- 2. MASTER PROMPT v5 (v1.9 "CONTEXT-AWARE" RUBRIC) ---
# This is our "gold standard" rubric
MASTER_PROMPT_V5 = """
You are an expert Senior Technical Recruiter and Hiring Manager at a top-tier quant firm (e.g., Jane Street, Radix). Your *only* goal is to find the top 1% of elite *software engineers*. You are NOT hiring for community or marketing.

You value deep, complex, and *verifiable* technical skill above all else. You are ruthlessly strict. You are *not* fooled by similar-sounding projects; you understand that **context** (e.g., university prestige, company bar, research venue) is a critical multiplier. An 8.5 CPI from IIT Bombay is a stronger signal than a 9.5 from an unknown college. An internship at Quadeye is 10x more valuable than one at a local service-based company.

Your task is to analyze the resume I am about to upload. Read and parse the entire document. Then, score it *strictly* according to the **"Unified Scoring Rubric v1.9 (Context-Aware Engine)"** below.

You must score *only* the Resume Analysis part. The total score you give must be between **0 and 100**.

---
## Unified Scoring Rubric v1.9 (Context-Aware Engine)

### 1. Foundational Professionalism (Max 10 pts)
*(A basic "pass/fail" check for following instructions.)*
* **1.1: Presentation Standards (5 pts)**
    * **5 pts:** Single page, clean format, no typos.
    * **3 pts:** Minor issues (e.g., 1-2 typos, 2 pages).
    * **1 pt:** Multiple major issues.
* **1.2: Structure & Links (5 pts)**
    * **5 pts:** Optimal order (e.g., Edu, Exp, Proj), functional GitHub & LinkedIn links.
    * **3 pts:** Non-optimal order, or links missing.
    * **1 pt:** Illogical, missing GitHub link.

### 2. Technical Proficiency Claims (Max 10 pts)
*(A "claims" check. This is cheap signal; the "proof" is in Section 3. We penalize "fluff".)*
* **2.1: Skill Relevance & Clarity (10 pts)**
    * **10 pts:** Skills are relevant, in-demand (e.g., C++, Python, Systems, ML), clearly categorized (Languages, Tools) AND there are **NO** subjective self-ratings (e.g., "Python 8/10").
    * **5 pts:** Mix of relevant and basic tech OR skills are in a single block OR they include subjective self-ratings (a minor red flag).
    * **1 pt:** Dominated by basic/irrelevant tech, disorganized, and includes subjective ratings.

### 3. Evidence of Elite Capability (Max 80 pts)
*(This is the MOST IMPORTANT section. We fuse "what" they did with "where" they did it.)*
* **3.1: Quantification & Impact Writing (Max 10 pts)**
    * **10 pts:** Majority of bullets (in Projects/Experience) are quantified with specific metrics AND use strong action verbs (e.g., "Architected," "Optimized," "Reduced latency by...").
    * **5 pts:** Some quantification OR good verbs, but not both.
    * **1 pt:** No quantified impact; just a list of responsibilities.
* **3.2: The "Context-Aware" Technical Depth Engine (Max 70 pts) - [CRITICAL]**
    *(This score evaluates the *fusion* of [Work Complexity] x [Prestige Signal].)*

    * **70 pts: (Tier-1 / "Alpha" Signal)**
        * Overwhelming evidence of elite, "bug-proof" capability. This profile shows *at least one* of:
        * **1. Elite Experience:** High-impact internship at an *elite* quant/tech firm (e.g., Jane Street, Radix, Quadeye, Glean, Google Brain) with *deeply complex* project work.
        * **2. Elite Research:** 1st-author publication at a *Tier-1* conference (e.g., NeurIPS, ICML, OSDI, PLDI).
        * **3. Elite Spike:** Verifiable *elite* competitive rank (e.g., ICPC Regionals, Codeforces Master, Kaggle Gold).
        * **4. Elite "Spike" Project:** A systems-level project (e.g., custom compiler, k/v store) *calibrated* by a **Tier-1 Institution** (e.g., IIT Bombay, CMU). The [Elite School] + [Hard Project] combination qualifies here.

    * **45 pts: (Tier-2 / "Strong" Signal)**
        * A strong engineer with high potential. This profile shows *at least one* of:
        * **1. Strong Experience:** Internship at Big Tech (e.g., Google, Microsoft, Amazon) or a top startup with a *quantified*, complex project.
        * **2. Strong Education:** Top student (e.g., 8.5+ CPI) from a **Tier-1 Institution** (IITs, CMU) with *good* (not elite) projects. The institution's prestige *calibrates* the project's value.
        * **3. Strong Spike:** Verifiable *win* at a major hackathon (not just participation) or a strong competitive rank (e.g., Codeforces Expert).
        * **4. "Skill Trumps All" Project:** An *elite* (Tier-1) level project from a *Tier-3 Institution*. This is a rare, strong signal of pure self-direction and must be noted.

    * **25 pts: (Tier-3 / "Standard" Signal)**
        * This is the "meets expectations" / median student profile. Shows:
        * **1. Standard Experience:** Internship at a service-based company, an unknown startup, or a non-tech role with *some* coding.
        * **2. Standard Projects:** Projects are of moderate complexity (e.g., frontend + public API, standard ML model clones, full-stack CRUD app).
        * **3. Standard Education:** A good GPA (e.g., 9.0+) from a **Tier-2/3 Institution** with standard projects lands here.

    * **5 pts: (Tier-4 / "Low" Signal)**
        * Profile shows only low-complexity or trivial work.
        * **1. Low-Effort:** Projects are tutorial-clones, simple scripts, or "Java (Basic)"-level.
        * **2. No Context:** No verifiable "Prestige Signal" (e.g., no school listed, no company) AND weak projects.

---

**YOUR TASK:**
Read the resume PDF I upload. Evaluate it *strictly* against this **v1.9 "Context-Aware Engine"** rubric. Provide your final score and a brief justification in a single JSON object. Do not add any other text.

Your justification *must* now explicitly reference the context-aware signals (e.g., "...strong signal from a Tier-1 institution...", "...calibrated project score based on elite internship...", or "...lack of prestige signal from...").

**Output Format:**
{
  "total_score_100": <your_final_score_0_to_100>,
  "justification": "<Your 2-sentence rationale, referencing the context-aware signals (e.g., Tier-1/2/3) that determined the score.>"
}
"""

# --- 2.5. MASTER GITHUB PROMPT v2.2 (Deep-Tech Edition) ---

MASTER_GITHUB_PROMPT_V2_2 = """

You are an expert Principal Engineer at a top-tier tech firm (e.g., Google, Jane Street). Your *only* goal is to find elite *software engineers*. You are ruthlessly technical. You value "proof-of-work" (the code itself) *far* more than "fluff" (like READMEs or profile polish).

Your task is to analyze a "GitHub Context Packet" (a JSON object) that contains *limited scraped data* from a user's GitHub profile. You must score this packet *strictly* according to the **"Unified Scoring Rubric v2.2 (Deep-Tech Engine)"** below.

The total score you give must be between **0 and 100**.

---

## 1. Input Data Structure (The "Context Packet")

You will receive a JSON object with the following *limited* structure:

{

  "user_profile": {

    "bio": "string",

    "name": "string",

    "followers": "integer"

  },

  // This field is CRITICAL.

  // "pinned": User curated these.

  // "top_repo_fallback": User had no pins, so we automatically grabbed their most active repos.

  "analysis_method": "pinned" | "top_repo_fallback",

  

  "analyzed_repos": [

    {

      "name": "string",

      "description": "string",

      "readme_content": "string (raw text, truncated)",

      "file_list": ["string", "string", ...], // List of file *names* only

      "commit_messages": ["string", "string", ...], // List of *last 10* commit messages

      "branch_count": "integer",

      "stargazerCount": "integer",

      

      // The "Deep Tech" data:

      "raw_code_snippets": [

        { "file_name": "main.py", "content": "<raw python code...>" },

        { "file_name": "App.jsx", "content": "<raw javascript code...>" }

      ]

    },

    ... (up to 3 repos)

  ],

  "oss_contributions_count": "integer" // A simple count of merged PRs

}

---

## 2. The Scoring Rubric (v2.2 "Deep-Tech")

You must score the packet against these rules.

### 1. Profile Curation (Max 10 pts)

*(A basic "first impression" check. This is low-priority.)*

* **1.1: Profile Polish (5 pts)**

    * **5 pts:** The `user_profile.bio` is clear and professional AND a `user_profile.name` is present.

    * **2 pts:** Profile is partially complete.

* **1.2: Repository Curation (5 pts)**

    * **5 pts:** The `analysis_method` is `"pinned"`. This shows the user is organized.

    * **0 pts:** The `analysis_method` is `"top_repo_fallback"`. (No penalty, but no bonus).

### 2. Project Quality & Depth (Max 60 pts)

*(This is the MOST IMPORTANT section. Focus on the raw code.)*

* **2.1: Code Quality & Complexity (40 pts) - [CRITICAL]**

    * *Instructions:* Analyze the `raw_code_snippets` for *actual* engineering skill.

    * **40 pts (Elite):** The code shows high complexity (e.g., async, custom algorithms, complex state management) AND is clean (well-structured, good variable names).

    * **25 pts (Strong):** The code is functional and non-trivial (e.g., a standard CRUD app) but doesn't show deep complexity.

    * **10 pts (Good):** The code is simple, or functional but messy.

    * **1 pt (Low Signal):** The code is trivial, a copy/paste, or "Java (Basic)"-level.

* **2.2: Code Structure & Testing (10 pts)**

    * **10 pts:** The `file_list` shows *both* a logical structure (e.g., `src/`) AND clear evidence of testing (e.g., `tests/`, `*.test.js`, `.github/workflows/main.yml`).

    * **5 pts:** Shows *either* a good structure *or* tests, but not both.

    * **1 pt:** Disorganized and no tests.

* **2.3: README Quality (10 pts)**

    * **10 pts:** The `readme_content` is comprehensive (description, tech stack, setup instructions).

    * **5 pts:** READMEs are minimal.

    * **1 pt:** No READMEs.

### 3. Engineering Craftsmanship (Max 20 pts)

*(This proves *how* they work.)*

* **3.1: Commit History Quality (15 pts)**

    * **15 pts:** The `commit_messages` show a clear pattern of atomic commits with descriptive messages (e.g., "feat: add user auth").

    * **7 pts:** Commits are infrequent/large, or messages are generic ("update," "wip").

    * **1 pt:** The project was one large "Initial commit."

* **3.2: Use of Branching (5 pts)**

    * **5 pts:** The `branch_count` is > 1.

    * **0 pts:** All commits are on the `main` branch.

### 4. Community Engagement (Max 10 pts - "Bonus")

*(A "tie-breaker".)*

* **4.1: Open-Source Contributions (5 pts)**

    * **5 pts:** The `oss_contributions_count` is > 0.

    * **0 pts:** No OSS contributions.

* **4.2: Community Signals (Stars/Forks) (5 pts)**

    * **5 pts:** The `analyzed_repos` show notable `stargazerCount` (e.g., > 10).

    * **0 pts:** Few or no stars/forks.

---

## 3. Your Task

Read the "GitHub Context Packet" (JSON) I provide. Evaluate it *strictly* against this **v2.2 "Deep-Tech"** rubric. Prioritize your analysis on the `raw_code_snippets`. Provide your final score and a brief justification in a single JSON object. Do not add any other text.

**Output Format:**

{

  "total_score_100": <your_final_score_0_to_100>,

  "justification": "<Your 2-sentence rationale focusing on the *code quality* and *project complexity*>"

}

"""

# --- 3. SETUP: CELERY, SUPABASE, GEMINI ---
celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel(model_name="gemini-2.5-pro-preview-03-25")

# --- 4. MODULAR LLM "ROUTER" (SYNC) ---

def _call_gemini_api_sync(*args) -> dict:
    """
    Private SYNC function to call the Gemini API.
    Overloaded behavior:
    - _call_gemini_api_sync(resume_bytes)
    - _call_gemini_api_sync(prompt_str, context_json_str)
    """
    print("--- [Worker] Calling Gemini API... ---")
    try:
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
        if len(args) == 1 and isinstance(args[0], (bytes, bytearray)):
            resume_bytes = args[0]
            resume_file_blob = {"mime_type": "application/pdf", "data": resume_bytes}
            response = gemini_model.generate_content(
                [MASTER_PROMPT_V5, resume_file_blob],
                generation_config={"response_mime_type": "application/json", "temperature": 0.1},
                safety_settings=safety_settings,
            )
        elif len(args) == 2 and all(isinstance(a, str) for a in args):
            prompt_str, context_json_str = args
            response = gemini_model.generate_content(
                [prompt_str, context_json_str],
                generation_config={"response_mime_type": "application/json", "temperature": 0.1},
                safety_settings=safety_settings,
            )
        else:
            raise ValueError("Invalid arguments for _call_gemini_api_sync")
        return json.loads(response.text)
    except Exception as e:
        print(f"--- [Worker] Gemini API ERROR: {e} ---")
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


# --- 5. "DEEP TECH" GITHUB ENGINE (v4.2) ---

# "Key File" Heuristics for the scraper
KEY_FILE_NAMES = [
    "package.json", "requirements.txt", "pom.xml", "go.mod", "docker-compose.yml", "Dockerfile",
    ".github/workflows/main.yml", ".github/workflows/ci.yml"
]
KEY_FILE_EXTENSIONS = [
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rs"
]

def _get_github_context_packet(username: str, client: httpx.Client) -> dict:
    """
    This is the "Hybrid Scraper" (v4.2).
    It implements the "Pinned or Top 3" logic and scrapes raw code.
    """
    print(f"--- [v4.2 Scraper] Starting for {username} ---")
    context_packet = {
        "user_profile": {},
        "analysis_method": "top_repo_fallback", # Default
        "analyzed_repos": [],
        "oss_contributions_count": 0
    }

    # 1. Get User Profile
    user_url = f"https://api.github.com/users/{username}"
    user_response = client.get(user_url)
    if user_response.status_code != 200:
        raise Exception(f"GitHub user '{username}' not found.")
    
    user_data = user_response.json()
    context_packet["user_profile"] = {
        "bio": user_data.get("bio"),
        "name": user_data.get("name"),
        "followers": user_data.get("followers", 0)
    }

    # 2. --- "Path A/B" Hybrid Logic ---
    repo_list = []
    
    # Path A: Try to get Pinned Repos first
    graphql_query = {"query": f'query {{ user(login: "{username}") {{ pinnedItems(first: 6, types: REPOSITORY) {{ nodes {{ ... on Repository {{ name, description, stargazerCount, forkCount, defaultBranchRef {{ name }} }} }} }} }} }}'}
    gql_response = client.post("https://api.github.com/graphql", json=graphql_query)
    
    if gql_response.status_code == 200:
        repo_nodes = gql_response.json().get("data", {}).get("user", {}).get("pinnedItems", {}).get("nodes", [])
        repo_nodes = [r for r in repo_nodes if r] # Filter out Nones
        
        if len(repo_nodes) >= 2:
            print(f"--- [v4.2 Scraper] Path A: Found {len(repo_nodes)} pinned repos. ---")
            context_packet["analysis_method"] = "pinned"
            repo_list = repo_nodes[:3] # Analyze top 3 pinned
        
    # Path B: "Top Repo Fallback"
    if not repo_list:
        print(f"--- [v4.2 Scraper] Path B: No pinned repos. Falling back to top 3 active repos. ---")
        context_packet["analysis_method"] = "top_repo_fallback"
        repo_url = f"https://api.github.com/users/{username}/repos?sort=pushed&per_page=3"
        repo_response = client.get(repo_url)
        if repo_response.status_code == 200:
            top_repos = repo_response.json()
            # Need to re-fetch basic data we would have gotten from GraphQL
            for repo in top_repos:
                repo_list.append({
                    "name": repo.get("name"),
                    "description": repo.get("description"),
                    "stargazerCount": repo.get("stargazers_count", 0),
                    "forkCount": repo.get("forks_count", 0),
                    "defaultBranchRef": {"name": repo.get("default_branch", "main")}
                })

    # 3. --- "Deep Scraper" Logic ---
    # We now have our 3 repos. Let's analyze them.
    for repo in repo_list:
        repo_name = repo.get("name")
        if not repo_name:
            continue
            
        print(f"--- [v4.2 Scraper] Analyzing repo: {repo_name} ---")
        repo_url = f"https://api.github.com/repos/{username}/{repo_name}"
        default_branch = repo.get("defaultBranchRef", {}).get("name", "main")

        # Get README
        readme_content = ""
        readme_res = client.get(f"{repo_url}/readme")
        if readme_res.status_code == 200:
            readme_data = readme_res.json()
            readme_content = httpx.get(readme_data.get("download_url")).text
            if len(readme_content) > 1000:
                readme_content = readme_content[:1000] + "... (truncated)"

        # Get File List (Tree)
        file_list = []
        tree_res = client.get(f"{repo_url}/git/trees/{default_branch}?recursive=1")
        if tree_res.status_code == 200:
            tree_data = tree_res.json().get("tree", [])
            file_list = [item.get("path") for item in tree_data if item.get("type") == "blob"]

        # Get Commits
        commit_messages = []
        commits_res = client.get(f"{repo_url}/commits?per_page=10")
        if commits_res.status_code == 200:
            commit_messages = [c.get("commit", {}).get("message", "") for c in commits_res.json()]

        # Get Branch Count
        branches_res = client.get(f"{repo_url}/branches")
        branch_count = len(branches_res.json()) if branches_res.status_code == 200 else 1

        # Get PR Count
        prs_res = client.get(f"{repo_url}/pulls?state=all")
        pull_request_count = len(prs_res.json()) if prs_res.status_code == 200 else 0

        # "Key File" Heuristic & Raw Code Scrape
        raw_code_snippets = []
        key_files_found = [f for f in file_list if os.path.basename(f).lower() in KEY_FILE_NAMES]
        
        # If no "key files", find top 3 by extension
        if not key_files_found:
            key_files_found = [f for f in file_list if os.path.splitext(f)[1].lower() in KEY_FILE_EXTENSIONS][:3]
        
        for file_path in key_files_found[:5]: # Max 5 key files
            print(f"--- [v4.2 Scraper] Fetching raw code for: {file_path} ---")
            file_content_res = client.get(f"https://api.github.com/repos/{username}/{repo_name}/contents/{file_path}")
            if file_content_res.status_code == 200:
                file_data = file_content_res.json()
                if file_data.get("encoding") == "base64" and file_data.get("content"):
                    # We can't send huge files. Truncate after decoding.
                    raw_content = httpx.get(file_data.get("download_url")).text
                    if len(raw_content) > 1500:
                        raw_content = raw_content[:1500] + "... (truncated)"
                    
                    raw_code_snippets.append({
                        "file_name": file_path,
                        "content": raw_content,
                        "language": os.path.splitext(file_path)[1]
                    })

        context_packet["analyzed_repos"].append({
            "name": repo_name,
            "description": repo.get("description"),
            "primary_language": repo.get("language"), # From fallback, or we can get this
            "readme_content": readme_content,
            "file_list": file_list,
            "commit_messages": commit_messages,
            "branch_count": branch_count,
            "pull_request_count": pull_request_count,
            "stargazerCount": repo.get("stargazerCount", 0),
            "raw_code_snippets": raw_code_snippets
        })

    # 4. Fetch OSS Contributions
    contrib_url = f"https://api.github.com/search/issues?q=author:{username}+is:pr+is:merged+-user:{username}"
    contrib_response = client.get(contrib_url)
    if contrib_response.status_code == 200:
        context_packet["oss_contributions_count"] = contrib_response.json().get("total_count", 0)

    print("--- [v4.2 Scraper] Context packet built. ---")
    return context_packet

def get_github_score_v4_2_llm(username: str) -> dict:
    """
    This is the "Brain Handoff" (v4.2).
    It calls the Scraper, then calls the LLM with the new v2.2 prompt.
    """
    try:
        # 1. Run the "Hybrid Scraper" to get the data
        with httpx.Client(headers={"Authorization": f"token {GITHUB_PAT}"}, timeout=40.0) as client:
            context_packet = _get_github_context_packet(username, client)
        
        # 2. Feed the "Context Packet" to the LLM "Brain"
        print(f"--- [v4.2 Engine] Sending {len(context_packet['analyzed_repos'])} repos to LLM for final scoring... ---")
        score_data = _call_gemini_api_sync(MASTER_GITHUB_PROMPT_V2_2, json.dumps(context_packet))
        
        print(f"--- [v4.2 Engine] LLM GitHub Score: {score_data.get('total_score_100', 0)}/100 ---")
        return score_data
        
    except Exception as e:
        print(f"--- [v4.2 Engine] CRITICAL ERROR --- {e}")
        return {"total_score_100": 0, "justification": f"Error: {e}"}


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
    
    # 3. Score GitHub with NEW "Deep Tech Engine" (v4.2)
    github_score_data = get_github_score_v4_2_llm(github_username)
    github_score = github_score_data.get("total_score_100", 0)
    github_justification = github_score_data.get("justification", "Analysis complete.")
    
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
            "github_justification": github_justification,
            "rank": 0 # We'll calculate rank later
        }).eq("user_id", user_id).execute()
        
        print(f"--- [Worker] Job COMPLETE for user: {user_id} ---")
    except Exception as e:
        print(f"--- [Worker] ERROR saving to Supabase: {e} ---")
