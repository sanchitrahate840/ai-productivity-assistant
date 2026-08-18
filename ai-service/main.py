import os
import re
from datetime import datetime, timedelta
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="AI Productivity Assistant", version="0.2.0")
LLM_API_URL = os.getenv("LLM_API_URL", "").strip()
LLM_API_KEY = os.getenv("LLM_API_KEY", "").strip()
LLM_MODEL = os.getenv("LLM_MODEL", "").strip()

class TaskParseRequest(BaseModel):
    text: str = Field(min_length=3, max_length=2000)

class SummaryRequest(BaseModel):
    text: str = Field(min_length=10, max_length=12000)

def fallback_task(text: str):
    lowered = text.lower()
    priority = "high" if any(w in lowered for w in ["urgent", "asap", "important", "interview", "deadline"]) else "medium"
    due_date: Optional[str] = None
    now = datetime.now()
    if "tomorrow" in lowered:
        due_date = (now + timedelta(days=1)).isoformat()
    elif "today" in lowered:
        due_date = now.isoformat()
    cleaned = re.sub(r"\b(remind me to|please|remind me|tomorrow|today|asap)\b", "", text, flags=re.I).strip(" .")
    return {"title": cleaned or text.strip(), "priority": priority, "dueDate": due_date, "source": "fallback"}

async def call_llm(system: str, user: str):
    if not (LLM_API_URL and LLM_API_KEY and LLM_MODEL):
        return None
    headers = {"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": LLM_MODEL, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}], "temperature": 0.2}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(LLM_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

@app.get("/health")
def health():
    return {"status": "ok", "llm_configured": bool(LLM_API_URL and LLM_API_KEY and LLM_MODEL)}

@app.post("/ai/task")
async def parse_task(request: TaskParseRequest):
    try:
        result = await call_llm("Extract a productivity task. Return JSON with title, priority (low/medium/high), and dueDate (ISO string or null).", request.text)
        if result:
            return {"result": result, "source": "llm"}
    except Exception as error:
        print(f"LLM task parsing failed: {error}")
    return {"result": fallback_task(request.text), "source": "fallback"}

@app.post("/ai/summarize")
async def summarize(request: SummaryRequest):
    try:
        result = await call_llm("Summarize the user's note into concise key points. Do not invent information.", request.text)
        if result:
            return {"summary": result, "source": "llm"}
    except Exception as error:
        print(f"LLM summarization failed: {error}")
    sentences = re.split(r"(?<=[.!?])\s+", request.text.strip())
    return {"summary": "\n".join(f"- {s}" for s in sentences[:5]), "source": "fallback"}
