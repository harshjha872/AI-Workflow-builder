# AI Workflow Builder — Backend

A Node.js REST API server for the Mini AI Workflow Builder. Persists workflow definitions to SQLite, orchestrates DAG-based workflow execution, and streams real-time logs via SSE.

## Tech Stack

- **Runtime:** Node.js 20 LTS + TypeScript
- **Framework:** Express.js 4
- **Database:** SQLite via `better-sqlite3`
- **AI Providers:** OpenAI, Anthropic
- **Validation:** Zod
- **Logging:** Pino

## Setup

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Development (auto-restart on changes)
npm run dev

# Production build
npm run build
npm start
```

## Docker

```bash
docker build -t ai-workflow-backend .
docker run -p 4000:4000 --env-file .env ai-workflow-backend
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/workflows | List all workflows |
| POST | /api/workflows | Create a workflow |
| GET | /api/workflows/:id | Get a workflow |
| PUT | /api/workflows/:id | Update a workflow |
| DELETE | /api/workflows/:id | Delete a workflow |
| POST | /api/executions | Run a workflow |
| GET | /api/executions/:id | Get execution details |
| GET | /api/executions/:id/stream | SSE stream for execution |
| GET | /api/workflows/:id/executions | Execution history |
