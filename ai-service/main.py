from os import getenv

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="AI Productivity Assistant Service", version="3.0.0")


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = Field(default_factory=list)
    context: dict = Field(default_factory=dict)


@app.get("/")
def root():
    return {"status": "ok", "service": "ai-service"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-service",
        "configured": bool(getenv("GROQ_API_KEY")),
        "provider": "groq",
    }


@app.post("/chat")
async def chat(payload: ChatRequest, x_service_token: str | None = Header(default=None)):
    expected = getenv("AI_SERVICE_TOKEN")
    if expected and x_service_token != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

    api_key = getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured")

    model = getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
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
    messages = [
        {"role": "system", "content": system},
        {
            "role": "user",
            "content": f"{context_text}\n\nConversation:\n{history_text}\nuser: {payload.message}",
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.3,
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail=f"Unable to reach Groq: {error}") from error

    if response.status_code >= 400:
        try:
            provider_error = response.json().get("error", {})
            detail = provider_error.get("message") or provider_error.get("code") or response.text
        except Exception:
            detail = response.text
        raise HTTPException(
            status_code=502,
            detail=f"Groq error ({response.status_code}): {detail[:500]}",
        )

    try:
        data = response.json()
    except ValueError as error:
        raise HTTPException(status_code=502, detail="Groq returned invalid JSON") from error

    try:
        reply = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        reply = "I couldn't generate a response right now."

    return {"reply": reply}
