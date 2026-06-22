from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pypdf
import io

app = FastAPI(title="MindMap AI Syllabus Engine")

# Configure CORS so your Vite frontend (port 5173) can communicate cleanly with the server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerationRequest(BaseModel):
    topics: list[str]
    days: int

# --- DYNAMIC SUBJECT POINTERS ENGINE (DAA + MACHINE LEARNING) ---
def get_academic_pointers(topic: str) -> dict:
    clean = topic.lower()
    
    # === ALGORITHMS (DAA) MATCHING CORES ===
    if "recurrence" in clean or "master" in clean or "substitution" in clean:
        return {
            "tip": "MTE Favorite: Expect a mandatory question demanding a step-by-step recursive tree derivation vs. Master Theorem comparison.",
            "question": "Solve $T(n) = 2T(n/2) + n \log n$. Does the standard Master Theorem apply here? Prove why or why not."
        }
    elif "divide" in clean or "merge" in clean or "quick" in clean:
        return {
            "tip": "Watch out for boundary conditions! Focus heavily on proving the average-case vs worst-case mathematical space complexities.",
            "question": "Formulate a formal mathematical proof showing how Quick Sort degrades to $\mathcal{O}(n^2)$ when given an already sorted array."
        }
    elif "greedy" in clean or "knapsack" in clean or "spanning" in clean:
        return {
            "tip": "Focus on structural proof logic. University evaluations often check your ability to prove whether a greedy choice strategy yields a globally optimal solution.",
            "question": "Differentiate between the Fractional Knapsack and 0/1 Knapsack optimization principles. Why does Greedy fail for 0/1?"
        }
    
    # === MACHINE LEARNING (ML) MATCHING CORES ===
    elif "regression" in clean or "gradient descent" in clean or "squares" in clean:
        return {
            "tip": "High-Probability Question: Be ready to mathematically derive the weight update equation or prove OLS matrix properties.",
            "question": "Derive the gradient descent update rule for a Mean Squared Error (MSE) loss function in a multiple linear regression setting."
        }
    elif "svm" in clean or "kernel" in clean or "hyperplane" in clean:
        return {
            "tip": "Core Exam Staple: Focus on why we transform data into high-dimensional space and the definition of Support Vectors.",
            "question": "Explain the difference between the primal and dual formulations of a Support Vector Machine. What is the explicit role of the Kernel Trick?"
        }
    elif "tree" in clean or "forest" in clean or "entropy" in clean or "gini" in clean:
        return {
            "tip": "Analytical Problem Warning: You will likely be given a small dataset and asked to calculate Information Gain or Gini Impurity by hand.",
            "question": "Given a sample dataset split, calculate the Entropy and Information Gain to determine the optimal root node attribute."
        }
    elif "clustering" in clean or "k-means" in clean or "pca" in clean:
        return {
            "tip": "Unsupervised Learning Target: Focus on dimensionality reduction constraints and centroid convergence failure cases.",
            "question": "Describe the mathematical steps of Principal Component Analysis (PCA). How do Covariance Matrix Eigenvectors help maximize variance?"
        }
    elif "neural" in clean or "perceptron" in clean or "backpropagation" in clean:
        return {
            "tip": "Deep Learning Core Focus: Perfect your understanding of the chain rule in calculus for weight updates and vanishing gradient causes.",
            "question": "Trace the mathematical flow of error backpropagation through a single hidden layer. Why does the ReLU activation function mitigate vanishing gradients?"
        }
        
    # === UNIVERSAL ENGINEERING FALLBACK ===
    return {
        "tip": "Analyze runtime and structural constraints. Ensure you can identify resource requirements and validation trade-offs clearly.",
        "question": f"Given the module '{topic}', sketch out its core algorithmic steps or architectural design trade-offs."
    }

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an academic PDF.")
    
    try:
        pdf_bytes = await file.read()
        pdf_file = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(pdf_file)
        
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
        cleaned_text = "\n".join(extracted_text)
        if not cleaned_text.strip():
            return {"status": "Failed", "message": "The PDF layout appears to be image-based or blank."}
            
        return {"status": "Success", "text": cleaned_text}
    except Exception as e:
        return {"status": "Failed", "message": str(e)}

@app.post("/api/generate")
async def generate_schedule(payload: GenerationRequest):
    if not payload.topics:
        raise HTTPException(status_code=400, detail="Topics deck pool cannot be empty.")
        
    result_days = []
    for i in range(payload.days):
        day_num = i + 1
        topic_assigned = payload.topics[i % len(payload.topics)]
        
        guidance = get_academic_pointers(topic_assigned)
        
        result_days.append({
            "dayNumber": day_num,
            "topic": topic_assigned,
            "examTip": guidance["tip"],
            "mockQuestion": guidance["question"]
        })
        
    return {"status": "Generated", "schedule": result_days}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)