# AI Workflow Builder — Backend PRD

> **Version:** 1.0 | **Date:** February 2026 | **Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Directory Structure](#5-directory-structure)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [Workflow Execution Engine](#8-workflow-execution-engine)
9. [Node Types & Executors](#9-node-types--executors)
10. [Real-time Streaming (SSE)](#10-real-time-streaming-sse)
11. [Environment & Configuration](#11-environment--configuration)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Security Requirements](#13-security-requirements)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Development Milestones](#15-development-milestones)

---

## 1. Overview

The backend for the Mini AI Workflow Builder is a Node.js REST API server responsible for:

- Persisting workflow definitions (nodes + edges) to SQLite
- Validating workflow graphs before execution
- Orchestrating the execution of workflows as a directed acyclic graph (DAG)
- Streaming real-time execution logs to the frontend via Server-Sent Events (SSE)
- Integrating with external AI providers (OpenAI, Anthropic) and HTTP endpoints

The backend is intentionally minimal — no authentication, no message queues, no microservices — optimized for a single-user local deployment that can be extended later.

---

## 2. Goals & Non-Goals

### Goals

- Expose a clean REST API for workflow CRUD and execution management
- Implement a DAG-based workflow executor that runs nodes in topological order
- Support 6 core node types: Trigger, LLM Call, HTTP Request, Condition, Transform, Output
- Stream per-node execution events to the client in real-time via SSE
- Persist all workflows and execution history in SQLite
- Be runnable with a single `node src/index.js` or `docker-compose up`

### Non-Goals (v1)

- User authentication or multi-tenancy
- Distributed/parallel node execution
- Webhook-triggered workflow scheduling (cron)
- Plugin marketplace or external node registry
- GraphQL API

---

## 3. Tech Stack

| Concern | Technology | Reason |
|---|---|---|
| Runtime | Node.js 20 LTS | Non-blocking I/O, wide ecosystem |
| Framework | Express.js 4 | Minimal, well-understood, extensible |
| Database | SQLite via `better-sqlite3` | Zero-config, file-based, fast sync reads |
| AI — OpenAI | `openai` npm SDK | Official, supports streaming |
| AI — Anthropic | `@anthropic-ai/sdk` | Official, supports streaming |
| HTTP Client | `axios` | Reliable, interceptor support |
| JS Sandbox | `vm2` | Isolates Transform node user code |
| Validation | `zod` | Runtime schema validation for API inputs |
| Logging | `pino` | Structured JSON logging, low overhead |
| Dev Server | `nodemon` | Auto-restart on file changes |
| Testing | `vitest` + `supertest` | Fast unit + integration testing |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Express.js Server                    │
│                                                         │
│   ┌─────────────┐    ┌──────────────┐                  │
│   │  REST Routes │    │  SSE Routes  │                  │
│   │  /workflows  │    │ /executions/ │                  │
│   │  /executions │    │  :id/stream  │                  │
│   └──────┬──────┘    └──────┬───────┘                  │
│          │                  │                            │
│   ┌──────▼──────────────────▼───────┐                  │
│   │         Workflow Executor        │                  │
│   │  (DAG traversal + node runner)   │                  │
│   └──────┬───────────────────────────┘                  │
│          │                                               │
│   ┌──────▼────────────────────────────────────────┐    │
│   │              Node Executors                    │    │
│   │  trigger │ llmCall │ httpRequest │ condition   │    │
│   │  transform │ output                            │    │
│   └──────┬────────────────────────────────────────┘    │
│          │                                               │
│   ┌──────▼──────┐   ┌─────────────┐                   │
│   │   SQLite DB  │   │  AI / HTTP  │                   │
│   │  (workflows  │   │  External   │                   │
│   │  executions) │   │  Services   │                   │
│   └─────────────┘   └─────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Request Lifecycle

1. Client sends `POST /api/executions` with `{ workflowId, input }`
2. Express validates the request body via Zod schema
3. Executor is invoked **asynchronously** — server immediately responds `202 { executionId }`
4. Client opens SSE stream at `GET /api/executions/:id/stream`
5. Executor performs topological sort, runs each node, pushes SSE events
6. On completion or error, execution record is finalized in SQLite; SSE stream closes

---

## 5. Directory Structure

```
backend/
├── src/
│   ├── index.js                  # Entry point — creates Express app, starts server
│   ├── app.js                    # App factory — mounts routes, middleware
│   ├── config.js                 # Reads .env, exports typed config object
│   │
│   ├── routes/
│   │   ├── workflows.js          # GET/POST/PUT/DELETE /api/workflows
│   │   └── executions.js         # POST /api/executions, GET stream + history
│   │
│   ├── middleware/
│   │   ├── errorHandler.js       # Global Express error handler
│   │   ├── validate.js           # Zod schema validation middleware factory
│   │   └── requestLogger.js      # Pino request logging
│   │
│   ├── engine/
│   │   ├── executor.js           # Orchestrates DAG traversal and node execution
│   │   ├── context.js            # ExecutionContext class — shared state across nodes
│   │   ├── dag.js                # Topological sort, cycle detection utilities
│   │   ├── interpolate.js        # Template string resolution: {{context.key}}
│   │   └── nodes/
│   │       ├── trigger.js
│   │       ├── llmCall.js
│   │       ├── httpRequest.js
│   │       ├── condition.js
│   │       ├── transform.js
│   │       └── output.js
│   │
│   ├── db/
│   │   ├── client.js             # Opens SQLite connection (singleton)
│   │   ├── schema.js             # CREATE TABLE statements, run on startup
│   │   └── queries/
│   │       ├── workflows.js      # Prepared statements for workflow operations
│   │       └── executions.js     # Prepared statements for execution operations
│   │
│   └── sse/
│       └── sseManager.js         # Manages open SSE connections per executionId
│
├── tests/
│   ├── unit/
│   │   ├── dag.test.js
│   │   ├── interpolate.test.js
│   │   └── nodes/
│   │       └── condition.test.js
│   └── integration/
│       ├── workflows.test.js
│       └── executions.test.js
│
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── README.md
```

---

## 6. Database Schema

### Table: `workflows`

```sql
CREATE TABLE IF NOT EXISTS workflows (
  id          TEXT PRIMARY KEY,           -- UUID v4
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  graph       TEXT NOT NULL,              -- JSON: { nodes: [], edges: [] }
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Table: `executions`

```sql
CREATE TABLE IF NOT EXISTS executions (
  id           TEXT PRIMARY KEY,          -- UUID v4
  workflow_id  TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | RUNNING | SUCCESS | ERROR
  input        TEXT NOT NULL DEFAULT '{}', -- JSON: initial trigger input
  output       TEXT,                       -- JSON: final output node result
  logs         TEXT NOT NULL DEFAULT '[]', -- JSON array of NodeLogEntry
  started_at   TEXT,
  finished_at  TEXT,
  error        TEXT                        -- error message if status = ERROR
);
```

### `graph` JSON Shape

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Start",
        "config": {
          "triggerType": "manual"
        }
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "node-1", "target": "node-2" }
  ]
}
```

### `logs` JSON Shape (per execution)

```json
[
  {
    "nodeId": "node-2",
    "nodeType": "llmCall",
    "status": "SUCCESS",
    "startedAt": "2026-02-27T10:00:00.000Z",
    "finishedAt": "2026-02-27T10:00:02.312Z",
    "durationMs": 2312,
    "output": { "summary": "..." },
    "error": null
  }
]
```

---

## 7. API Design

### Base URL

```
http://localhost:4000/api
```

---

### 7.1 Workflows

#### `GET /api/workflows`
Returns a list of all saved workflows (summary, no graph).

**Response `200`**
```json
[
  {
    "id": "uuid",
    "name": "My Summarizer",
    "description": "Summarizes a URL using GPT-4o",
    "createdAt": "2026-02-27T10:00:00Z",
    "updatedAt": "2026-02-27T10:00:00Z"
  }
]
```

---

#### `POST /api/workflows`
Creates a new workflow.

**Request Body**
```json
{
  "name": "My Workflow",
  "description": "Optional description",
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

**Response `201`** — returns full workflow object including `id`.

**Validation (Zod)**
- `name`: string, min 1, max 100
- `graph.nodes`: array, min 1
- `graph.edges`: array

---

#### `GET /api/workflows/:id`
Returns a single workflow with its full graph.

**Response `200`**
```json
{
  "id": "uuid",
  "name": "My Workflow",
  "description": "",
  "graph": { "nodes": [...], "edges": [...] },
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Response `404`** if not found.

---

#### `PUT /api/workflows/:id`
Replaces a workflow's name, description, and graph.

**Request Body** — same shape as POST.

**Response `200`** — updated workflow object.

---

#### `DELETE /api/workflows/:id`

**Response `204`** — no body.  
Cascades to delete all associated executions.

---

### 7.2 Executions

#### `POST /api/executions`
Triggers a new workflow run.

**Request Body**
```json
{
  "workflowId": "uuid",
  "input": {
    "text": "Summarize this article..."
  }
}
```

**Response `202`**
```json
{
  "executionId": "uuid"
}
```

The execution runs asynchronously. Poll or stream for results.

---

#### `GET /api/executions/:id`
Returns a completed or in-progress execution with logs.

**Response `200`**
```json
{
  "id": "uuid",
  "workflowId": "uuid",
  "status": "SUCCESS",
  "input": { "text": "..." },
  "output": { "result": "..." },
  "logs": [...],
  "startedAt": "...",
  "finishedAt": "...",
  "error": null
}
```

---

#### `GET /api/executions/:id/stream`
Opens an SSE connection. Streams events as each node runs.

**Headers**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Types**

```
event: node_start
data: {"nodeId":"node-2","nodeType":"llmCall","label":"Summarize"}

event: node_success
data: {"nodeId":"node-2","output":{"summary":"..."},"durationMs":2312}

event: node_error
data: {"nodeId":"node-2","error":"OpenAI timeout after 30s"}

event: execution_complete
data: {"status":"SUCCESS","output":{"result":"..."}}

event: execution_error
data: {"status":"ERROR","error":"Cycle detected in workflow graph"}
```

Stream closes after `execution_complete` or `execution_error`.

---

#### `GET /api/workflows/:id/executions`
Returns execution history for a workflow, newest first.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "status": "SUCCESS",
    "startedAt": "...",
    "finishedAt": "...",
    "durationMs": 4120
  }
]
```

---

### 7.3 Health Check

#### `GET /api/health`

**Response `200`**
```json
{
  "status": "ok",
  "uptime": 3721,
  "dbConnected": true
}
```

---

## 8. Workflow Execution Engine

### 8.1 `executor.js` — Core Algorithm

```
async function executeWorkflow(workflow, input, emitter):
  1. Parse graph: extract nodes map and edges list
  2. Detect cycles using DFS — throw if cycle found
  3. Topological sort nodes using Kahn's algorithm
  4. Initialize ExecutionContext with { input, ...initialData }
  5. For each node in sorted order:
       a. Resolve node config (interpolate {{context.key}} templates)
       b. Emit 'node_start' event
       c. Try: result = await nodeExecutors[node.type](config, context)
       d. Merge result into context under config.outputKey
       e. Emit 'node_success' with result + duration
       f. Catch: emit 'node_error', halt execution, throw
  6. Emit 'execution_complete' with final context output
```

### 8.2 `context.js` — ExecutionContext

```js
class ExecutionContext {
  constructor(input) {
    this.data = { input };    // All node outputs live here
  }

  set(key, value) {
    this.data[key] = value;
  }

  get(key) {
    return this.data[key];
  }

  snapshot() {
    return structuredClone(this.data);
  }
}
```

### 8.3 `dag.js` — Graph Utilities

```js
// Returns nodes in topological order using Kahn's algorithm
function topologicalSort(nodes, edges) { ... }

// Returns true if graph has a cycle (DFS-based)
function hasCycle(nodes, edges) { ... }

// Returns ordered list of node IDs for a given source
function getExecutionOrder(nodes, edges) { ... }
```

### 8.4 `interpolate.js` — Template Resolution

Resolves `{{context.key}}` and `{{context.nested.key}}` expressions in any string field of a node's config before it is executed.

```js
// "Hello {{context.name}}" + { name: "World" } => "Hello World"
function interpolate(template, context) { ... }
```

---

## 9. Node Types & Executors

Each node executor is an async function with signature:

```js
async function execute(config, context) => Record<string, unknown>
```

The returned object is merged into the execution context.

---

### `trigger.js`

Validates that the initial input matches an expected schema (if defined). Passes `input` into context unchanged.

```js
config: {
  triggerType: "manual",   // "manual" | "webhook"
  inputSchema: {}          // optional JSON Schema for validation
}
```

---

### `llmCall.js`

Sends a prompt to an AI provider and stores the response.

```js
config: {
  provider: "openai",           // "openai" | "anthropic"
  model: "gpt-4o",
  systemPrompt: "You are...",   // supports {{context.key}}
  userPrompt: "Summarize: {{context.text}}",
  outputKey: "summary",         // where to store in context
  maxTokens: 1024,
  temperature: 0.7
}
```

**Behavior:**
- Interpolates `systemPrompt` and `userPrompt` with current context
- Calls the provider SDK (switches on `provider`)
- Stores response text at `context[outputKey]`

---

### `httpRequest.js`

Makes an outbound HTTP call and stores the response body.

```js
config: {
  method: "GET",                // GET | POST | PUT | PATCH | DELETE
  url: "https://api.example.com/data?id={{context.itemId}}",
  headers: { "Authorization": "Bearer {{context.token}}" },
  body: "{{context.payload}}",  // auto-parsed as JSON if string starts with {
  outputKey: "apiResponse",
  timeoutMs: 10000
}
```

---

### `condition.js`

Evaluates a JS expression against context. Determines which branch to execute next.

```js
config: {
  expression: "context.score > 0.8",  // JS expression, context is available
  truePath: "node-success",           // nodeId to execute if true
  falsePath: "node-fallback"          // nodeId to execute if false
}
```

**Behavior:**
- Expression evaluated with `new Function('context', \`return \${expression}\`)(context.data)`
- Returns `{ _nextNodeId: truePath | falsePath }` to redirect executor

---

### `transform.js`

Runs a sandboxed JS snippet to transform context data.

```js
config: {
  code: "return { wordCount: context.text.split(' ').length }",
  outputKey: "stats"
}
```

**Behavior:**
- Code runs inside `vm2` sandbox — no `require`, no file system, no network
- Return value is stored at `context[outputKey]`
- Timeout: 5 seconds max

---

### `output.js`

Marks the terminal node. Picks keys from context to return as the final result.

```js
config: {
  outputKeys: ["summary", "stats"],  // keys to extract from context
  format: "json"                      // "json" | "text" | "markdown"
}
```

**Behavior:**
- Returns `{ result: pick(context.data, outputKeys) }`
- This is what gets stored in `executions.output`

---

## 10. Real-time Streaming (SSE)

### `sseManager.js`

Manages active SSE response objects keyed by `executionId`.

```js
const connections = new Map();  // executionId => res (Express response)

function register(executionId, res) { ... }
function emit(executionId, eventType, data) { ... }
function close(executionId) { ... }
```

### SSE Setup (in route handler)

```js
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.flushHeaders();

// Heartbeat every 20s to keep connection alive
const heartbeat = setInterval(() => res.write(': ping\n\n'), 20000);
req.on('close', () => {
  clearInterval(heartbeat);
  sseManager.close(executionId);
});
```

### SSE Event Format

```
event: node_success\n
data: {"nodeId":"node-2","output":{"summary":"..."},"durationMs":2312}\n
\n
```

---

## 11. Environment & Configuration

### `.env.example`

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DB_PATH=./data/workflows.db

# AI Providers (add the ones you use)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Security
ALLOWED_HTTP_DOMAINS=*   # comma-separated, or * to allow all (dev only)
TRANSFORM_TIMEOUT_MS=5000
HTTP_REQUEST_TIMEOUT_MS=10000
```

### `config.js`

```js
export default {
  port: parseInt(process.env.PORT ?? '4000'),
  dbPath: process.env.DB_PATH ?? './data/workflows.db',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  allowedHttpDomains: process.env.ALLOWED_HTTP_DOMAINS?.split(',') ?? ['*'],
  transformTimeoutMs: parseInt(process.env.TRANSFORM_TIMEOUT_MS ?? '5000'),
  httpRequestTimeoutMs: parseInt(process.env.HTTP_REQUEST_TIMEOUT_MS ?? '10000'),
};
```

---

## 12. Error Handling Strategy

### API Layer

All route handlers are wrapped in an `asyncHandler` utility. Unhandled errors bubble to the global error middleware:

```js
app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message,
    code: err.code ?? 'INTERNAL_ERROR'
  });
});
```

### Executor Layer

| Scenario | Behavior |
|---|---|
| Cycle in graph | Throw before execution starts; execution status set to ERROR |
| Node execution throws | Emit `node_error` SSE event; halt traversal; save error to execution record |
| LLM provider timeout | Caught in `llmCall.js`; surfaces provider error message |
| Transform sandbox timeout | `vm2` kills the script; throws `TransformTimeoutError` |
| Condition references undefined context key | Returns `false` branch (safe default) |
| HTTP request timeout | Axios throws; caught and re-thrown as `HttpNodeError` |

### Custom Error Classes

```js
class WorkflowNotFoundError extends Error { status = 404; }
class CycleDetectedError extends Error { status = 422; }
class NodeExecutionError extends Error { status = 500; nodeId; }
class TransformTimeoutError extends NodeExecutionError {}
class HttpNodeError extends NodeExecutionError {}
```

---

## 13. Security Requirements

| Area | Requirement |
|---|---|
| Transform sandbox | All user-provided JS runs inside `vm2` — no access to `require`, filesystem, or network |
| API keys | Never returned in any API response; stored only in environment variables |
| HTTP Request node | `ALLOWED_HTTP_DOMAINS` env var restricts outbound domains in production |
| SQL injection | `better-sqlite3` prepared statements used for all queries — no string interpolation |
| Input validation | All request bodies validated with Zod before reaching route logic |
| Error messages | Stack traces never returned to client in production (`NODE_ENV=production`) |

---

## 14. Non-Functional Requirements

### Performance

- Workflow save/load: < 50ms for graphs with up to 100 nodes
- `POST /api/executions` response (202): < 100ms
- SSE first event after execution start: < 500ms
- Concurrent SSE streams supported: at minimum 10 simultaneous

### Reliability

- SQLite WAL mode enabled for better concurrent read performance
- Executor errors must always finalize the execution record — no executions stuck in `RUNNING` status
- Heartbeat pings on SSE connections to prevent proxy timeouts

### Observability

- Pino structured JSON logs for all requests and execution events
- Log levels: `error`, `warn`, `info`, `debug` — configurable via `LOG_LEVEL` env var
- Each execution log entry includes `nodeId`, `status`, `durationMs`

### Testability

- Node executors are pure async functions — easy to unit test with mock context
- Routes tested with `supertest` against an in-memory SQLite database
- DAG utilities (`topologicalSort`, `hasCycle`) tested independently

---

## 15. Development Milestones

| Phase | Milestone | Key Deliverables | Duration |
|---|---|---|---|
| 1 | Scaffold | Express app, SQLite schema, health endpoint, Docker setup | 2–3 days |
| 2 | Workflow CRUD | All 5 workflow endpoints, Zod validation, error middleware | 2–3 days |
| 3 | Execution Engine | DAG utilities, context object, executor loop, SSE manager | 3–4 days |
| 4 | Node Executors | All 6 node types implemented and unit tested | 3–4 days |
| 5 | Execution API | POST /executions, SSE stream, history endpoint | 2 days |
| 6 | Hardening | Error classes, sandbox security, integration tests, `.env` docs | 2–3 days |

**Total estimated backend build time: ~3 weeks**

---

*AI Workflow Builder Backend PRD v1.0 — Internal Use*
Backend.md
Displaying Backend.md.