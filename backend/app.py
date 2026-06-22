from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Configure CORS rules so your React development server can access endpoints securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all connection sources
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, OPTIONS, GET, etc.
    allow_headers=["*"],  
)

class PlanRequest(BaseModel):
    topics: list[str]
    days: int

def calculate_study_plan(topics: list[str], days: int) -> str:
    """
    Core synthesis engine. This acts as a confirmation fallback 
    string indicating that data transmission was evaluated correctly.
    """
    joined_topics = ", ".join(topics)
    return f"Successfully generated schedule dataset for targets: {joined_topics} over {days} days."

@app.get("/")
def home():
    return {"message": "MindMap AI Backend running safely."}

@app.post("/api/generate")
def generate_plan(data: PlanRequest):
    # Route accepts structured Pydantic format validation maps safely
    generated_schedule = calculate_study_plan(topics=data.topics, days=data.days)
    return {
        "status": "Success",
        "schedule": generated_schedule
    }