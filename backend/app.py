from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- Import the CORS tool
from pydantic import BaseModel
from scheduler import calculate_study_plan

app = FastAPI(title="MindMap AI API")

# Allow your React frontend to securely request data from this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "MindMap AI Backend is running smoothly!"}

class PlanRequest(BaseModel):
    topics: list[str]
    days: int

@app.post("/api/generate")
def generate_plan(data: PlanRequest):
    generated_schedule = calculate_study_plan(topics=data.topics, total_days=data.days)
    return {
        "status": "Success",
        "schedule": generated_schedule
    }