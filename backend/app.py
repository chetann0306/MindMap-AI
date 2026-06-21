from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS middleware rules so React (port 5173) can query FastAPI (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, OPTIONS, GET, etc.
    allow_headers=["*"],  
)

class PlanRequest(BaseModel):
    topics: list[str]
    days: int

def calculate_study_plan(topics: list[str], days: int) -> str:
    """
    Placeholder generation function. Change this logic to invoke your 
    actual Ollama/Llama local model synthesis loop.
    """
    joined_topics = ", ".join(topics)
    return (
        f"Custom Study Syllabus Blueprint:\n\n"
        f"📅 Time Duration Allocation: {days} Days Available.\n"
        f"🎯 Core Core Targets Evaluated: {joined_topics}\n\n"
        f"• Phase 1: Foundations & Architecture Setup (Day 1 - Day {max(1, days//2)})\n"
        f"  Deep dive into raw theoretical foundations and memory optimization mapping layout.\n\n"
        f"• Phase 2: Implementation & Scalability Review (Day {max(1, days//2) + 1} - Day {days})\n"
        f"  Hands-on application logic build, edge case auditing, and design deployment verification."
    )

@app.get("/")
def home():
    return {"message": "MindMap AI Backend is running smoothly."}

@app.post("/api/generate")
def generate_plan(data: PlanRequest):
    # Pass parsed validation model inputs down to the algorithm execution path
    generated_schedule = calculate_study_plan(topics=data.topics, days=data.days)
    return {
        "status": "Success",
        "schedule": generated_schedule
    }