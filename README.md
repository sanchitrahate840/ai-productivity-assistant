# AI Productivity Assistant

A full-stack personal productivity workspace with authentication, tasks, notes, calendar events, reminders, dashboard analytics, and an AI assistant that can use the user's tasks and notes as context.

## Stack

- React + Vite frontend
- Node.js + Express API
- PostgreSQL
- JWT + bcrypt authentication
- Python + FastAPI AI service
- OpenAI Responses API for the assistant
- Render Blueprint for deployment

## Features

- Secure registration and login
- Persistent login sessions
- Task creation, descriptions, priorities, due dates, completion and deletion
- Task filters and dashboard statistics
- Notes with search, tags, categories, pinning and deletion
- Calendar events and reminders
- AI assistant with task/note context
- Health endpoint for deployment monitoring
- Automatic database initialization

## Local development

### Backend

```bash
cd backend
npm install
```

Create `.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/productivity_assistant
JWT_SECRET=change-me
PORT=5000
CLIENT_URL=http://localhost:5174
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=local-token
```

Initialize PostgreSQL:

```bash
node src/migrate.js
npm run dev
```

### AI service

```bash
cd ai-service
pip install -r requirements.txt
```

Set `OPENAI_API_KEY`, then run:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

For a deployed frontend, set `VITE_API_URL` to the public backend API URL.

## Deployment

The repository contains `render.yaml` for a one-click Render Blueprint. It provisions the frontend, API, AI service and PostgreSQL database together. Render supports monorepos by setting a root directory per service, and Blueprint secret variables marked `sync: false` are entered during the initial deployment.

Required secret during deployment:

- `OPENAI_API_KEY`

The free Render PostgreSQL option is suitable for a demo/hobby deployment; check Render's current limits before using it for production data.
