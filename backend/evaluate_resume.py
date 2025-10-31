import asyncio
import json
import fitz # PyMuPDF
from fastapi.concurrency import run_in_threadpool

# We must import the *exact* functions we use in our server
from main import score_resume_sync

async def run_evaluation():
    print("--- Starting Resume Evals Harness (v1.5 vs LLM Panel) ---")
    
    try:
        with open('golden_set_resume.json', 'r') as f:
            golden_set = json.load(f)
    except FileNotFoundError:
        print("ERROR: golden_set_resume.json not found.")
        return
    except json.JSONDecodeError:
        print("ERROR: golden_set_resume.json is not valid JSON.")
        return

    if not golden_set:
        print("Evals set is empty. Exiting.")
        return
        
    total_difference = 0
    
    for entry in golden_set:
        print(f"\nEvaluating: {entry['resume_file']}...")
        
        try:
            # 1. Read the resume file (as bytes)
            with fitz.open(entry['resume_file']) as doc:
                pdf_bytes = doc.convert_to_pdf()
            
            # 2. Run our v1.5 Heuristic Engine
            # We must use run_in_threadpool to be identical to our server
            heuristic_score = await run_in_threadpool(score_resume_sync, pdf_bytes)
            
            # 3. Get the "Ground Truth"
            llm_score = entry['llm_avg_score']
            
            # 4. Compare Scores
            difference = heuristic_score - llm_score
            total_difference += abs(difference)
            
            print(f"  > LLM Panel Score (Golden): {llm_score}")
            print(f"  > Our v1.5 Score (Heuristic): {heuristic_score}")
            print(f"  > Difference:  {difference:+.2f}")

        except Exception as e:
            print(f"  > ERROR processing file {entry['resume_file']}: {e}")

    # 5. Get the average error
    mean_absolute_error = total_difference / len(golden_set)
    print(f"\n--- COMPLETE ---")
    print(f"Mean Absolute Error (v1.5 vs LLM Panel): {mean_absolute_error:.2f} points")

if __name__ == "__main__":
    # Activate venv: .\venv\Scripts\activate
    # Run: python evaluate_resume.py
    asyncio.run(run_evaluation())