from os import getenv

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="AI Productivity Assistant Service", version="2.0.2")


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = Field(default_factory=list)
    context: dict = Field(default_factory=dict)


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
    system = (
        "You are a practical personal productivity assistant. Be concise and actionable. "
        "Use the user's tasks and notes as context when relevant. Do not claim to have "
        "changed data unless the application provides a tool for that action. Help "
        "prioritize work, plan the day, summarize notes, and explain productivity concepts."
    )
    context_text = f"User context:\n{payload.context}"
    history_text = "\n".join(
        f"{item.get('role', 'user')}: {item.get('content', '')}"
        for item in payload.history[-8:]
    )
    prompt = f"{system}\n\n{context_text}\n\nConversation:\n{history_text}\nuser: {payload.message}"

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": model, "input": prompt},
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Unable to reach AI provider") from error

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="AI provider request failed")

    data = response.json()
    reply = data.get("output_text")
    if not reply:
        parts = []
        for item in data.get("output", []):
            for content in item.get("content", []):
                text = content.get("text")
                if text:
                    parts.append(text)
        reply = "\n".join(parts).strip()

    return {"reply": reply or "I couldn't generate a response right now."}
