# AI Service

FastAPI service for AI-powered productivity features.

## Endpoints

- `GET /health` — service status
- `POST /ai/task` — convert natural language into structured task data
- `POST /ai/summarize` — summarize notes into key points

The service supports an OpenAI-compatible chat-completions endpoint through environment variables. If no LLM credentials are configured, safe local fallback logic keeps development usable.

## Run locally

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
