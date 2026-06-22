from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pypdf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlanRequest(BaseModel):
    topics: list[str]
    days: int

@app.get("/")
def home():
    return {"message": "MindMap AI Backend running safely."}

@app.post("/api/generate")
def generate_plan(data: PlanRequest):
    return {"status": "Success"}

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        reader = pypdf.PdfReader(file.file)
        master_lines = []

        # Extract text rows page-by-page directly in Python
        for page in reader.pages:
            text = page.extract_text()
            if text:
                for line in text.split("\n"):
                    if line.strip():
                        master_lines.append(line.strip())

        # Filter structural layout noise common to course handouts
        clean_topics = []
        for line in master_lines:
            # Skip page headers and metadata rules
            if any(x in line.lower() for x in ["manipal university", "course hand-out", "assessment plan", "lecture plan", "co statement", "program outcome"]):
                continue
            
            # Isolate lines containing key course keywords
            keywords = ["algorithm", "complexity", "recurrence", "sort", "search", "greedy", "knapsack", "tree", "programming", "path", "matrix", "bound", "string", "np", "theorem", "probing"]
            if any(kw in line.lower() for kw in keywords) and len(line) > 10:
                if line not in clean_topics:
                    clean_topics.append(line)

        return {"status": "Success", "text": "\n".join(clean_topics)}
    except Exception as e:
        return {"status": "Error", "message": str(e)}