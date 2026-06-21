import json
import ollama

def calculate_study_plan(topics: str, total_days: int):
    """
    Generates a structured daily study schedule using a local Llama 3.2 model via Ollama.
    """
    
    # Construct a strict prompt requiring a clean layout structure
    prompt = f"""
    You are an expert academic planner. Create a highly structured study plan over exactly {total_days} days for the following topics:
    {topics}
    
    You MUST respond with a valid JSON array of objects. Do not include any conversational filler, markdown formatting, or backticks.
    
    Each object in the array must strictly follow this format:
    {{
        "day": "Day X",
        "tasks": ["Sub-topic or task 1", "Sub-topic or task 2"]
    }}
    """
    
    try:
        # Call your offline local model and force a JSON output structure
        response = ollama.chat(
            model='llama3.2:3b',
            messages=[{'role': 'user', 'content': prompt}],
            format='json',
        )
        
        # Extract the raw response text string
        raw_text = response['message']['content'].strip()
        
        # --- TERMINAL LOGGING FOR DEBUGGING ---
        print("\n================== OLLAMA RAW OUTPUT ==================")
        print(raw_text)
        print("=======================================================\n")
        
        # Clean up any accidental markdown backticks if they somehow leak through
        if raw_text.startswith("```"):
            if "json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            else:
                raw_text = raw_text.split("```")[1].split("```")[0].strip()
        
        # Parse text string into an actual Python dictionary/list object
        schedule_data = json.loads(raw_text)
        
        # Fail-safe 1: Convert an indexed object dictionary {"0": {...}, "1": {...}} into a flat list array
        if isinstance(schedule_data, dict):
            first_val = next(iter(schedule_data.values()), None)
            if isinstance(first_val, dict) and "day" in first_val:
                return list(schedule_data.values())
                
            # Fail-safe 2: If wrapped in an outer key like {"schedule": [...] or {"plan": [...]}
            for key, value in schedule_data.items():
                if isinstance(value, list):
                    return value
                    
        return schedule_data

    except Exception as e:
        print(f"Local AI Error: {e}")
        # Return a fallback JSON structure so the React frontend does not crash
        return [
            {
                "day": "Error",
                "tasks": [
                    "Failed to process local AI plan cleanly.",
                    f"Details: {str(e)}"
                ]
            }
        ]