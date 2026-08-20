from os import getenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import httpx

app = FastAPI(title="AI Productivity Assistant Service", version="2.0.1")

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    context: dict = {}

@app.get("/")
def root():
    return {"status": "ok", "service": "ai-service"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service", "configured": bool(getenv("OPENAI_API_KEY"))}

@app.post("/chat")
async def chat(payload: ChatRequest, x_service_token: str | None = Header(default=None)):
    expected = getenv("AI_SERVICE_TOKEN")
    if expected and x_service_token != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

    api_key = getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")

    model = getenv("OPENAI_MODEL", "gpt-5-mini")
    system = """You are a practical personal productivity assistant. Be concise and actionable. Use the user's tasks and notes as context when relevant. Do not claim to have changed data unless the application provides a tool for that action. Help prioritize work, plan the day, summarize notes, and explain productivity concepts."""
    context_text = f"User context:\n{payload.context}"
    history_text = "\n".join(f"{m.get('role','user')}: {m.get('content','')}" for m in payload.history[-8:])
    prompt = f"{system}\n\n{context_text}\n\nConversation:\n{history_text}\nuser: {payload.message}"

    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "input": prompt},
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="AI provider request failed")

    data = response.json()
    return {"reply": data.get("output_text", "I couldn't generate a response right now.")}
