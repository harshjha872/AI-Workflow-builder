# AI Workflow Builder — Backend PRD

> **Version:** 1.1 | **Date:** March 2026 | **Status:** Draft — Updated with BullMQ queue-based execution

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Directory Structure](#5-directory-structure)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [BullMQ Queue System](#8-bullmq-queue-system)
9. [Workflow Execution Engine](#9-workflow-execution-engine)
10. [Node Types & Executors](#10-node-types--executors)
11. [Real-time Streaming (SSE)](#11-real-time-streaming-sse)
12. [Environment & Configuration](#12-environment--configuration)
13. [Error Handling Strategy](#13-error-handling-strategy)
14. [Security Requirements](#14-security-requirements)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Development Milestones](#16-development-milestones)

---

## 1. Overview

The backend for the Mini AI Workflow Builder is a Node.js REST API server responsible for:

- Persisting workflow definitions (nodes + edges) to SQLite
- Validating workflow graphs before execution
- Orchestrating the execution of workflows as a directed acyclic graph (DAG)
- Streaming real-time execution logs to the frontend via Server-Sent Events (SSE)
- Integrating with external AI providers (OpenAI, Anthropic) and HTTP endpoints

The backend uses a **queue-based execution model powered by BullMQ + Redis**. Each node in a workflow is dispatched as an individual job to a BullMQ queue. A worker process picks up jobs, executes the node, and enqueues the next node in the graph. This gives the backend automatic retry on failure, crash recovery, and a clean path to parallel execution in future versions.

---

## 2. Goals & Non-Goals

### Goals

- Expose a clean REST API for workflow CRUD and execution management
- Implement a DAG-based workflow executor that dispatches nodes as BullMQ jobs
- Support 6 core node types: Trigger, LLM Call, HTTP Request, Condition, Transform, Output
- Stream per-node execution events to the client in real-time via SSE
- Persist all workflows and execution history in SQLite
- Provide automatic retry with exponential backoff for failed nodes via BullMQ
- Survive server restarts mid-execution — jobs remain in Redis and resume on restart
- Be runnable with a single `docker-compose up` (includes Redis)

### Non-Goals (v1)

- User authentication or multi-tenancy
- Parallel / fan-out node execution (sequential only in v1)
- Webhook-triggered workflow scheduling (cron)
- Plugin marketplace or external node registry
- GraphQL API
- Bull Board UI (job dashboard) — recommended for debugging but not required in v1

---

## 3. Tech Stack

| Concern | Technology | Reason |
|---|---|---|
| Runtime | Node.js 20 LTS | Non-blocking I/O, wide ecosystem |
| Framework | Express.js 4 | Minimal, well-understood, extensible |
| Database | SQLite via `better-sqlite3` | Zero-config, file-based, fast sync reads |
| Job Queue | `bullmq` | Redis-backed job queue with retries, backoff, crash recovery |
| Redis Client | `ioredis` | BullMQ peer dependency, robust Redis client |
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
+------------------------------------------------------------------+
|                        Express.js Server                         |
|                                                                  |
|   +-------------+    +--------------+                           |
|   |  REST Routes |    |  SSE Routes  |                           |
|   |  /workflows  |    | /executions/ |                           |
|   |  /executions |    |  :id/stream  |                           |
|   +------+------+    +------+-------+                           |
|          |                  |                                     |
|          | push first job   | sseManager.emit()                  |
|          v                  ^                                     |
|   +-------------------------------------+                        |
|   |           BullMQ Queue              |                        |
|   |         "execution" queue           |                        |
|   |    jobs: { executionId, nodeId,     |                        |
|   |            context, graph }         |                        |
|   +--------------+-----------------------+                       |
|                  |                                                |
|                  v                                                |
|   +-------------------------------------+                        |
|   |          Node Worker                |                        |
|   |  1. resolveConfig (interpolate)     |                        |
|   |  2. nodeExecutors[node.type](...)   |                        |
|   |  3. merge result into context       |                        |
|   |  4. enqueue next node job           |                        |
|   |  5. sseManager.emit(node_success)   |                        |
|   +------+------------------------------+                        |
|          |                                                        |
|   +------+------+   +----------+   +--------------+             |
|   |   SQLite DB  |   |  Redis   |   |  AI / HTTP   |            |
|   |  (workflows  |   | (BullMQ  |   |  External    |            |
|   |  executions) |   |  jobs)   |   |  Services    |            |
|   +-------------+   +----------+   +--------------+             |
+------------------------------------------------------------------+
```

### Request Lifecycle

1. Client sends `POST /api/executions` with `{ workflowId, input }`
2. Express validates the body via Zod schema
3. Execution record created in SQLite (`status: PENDING`)
4. DAG is validated (cycle check) — error returned immediately if invalid
5. **Trigger node job pushed to BullMQ queue** — server responds `202 { executionId }`
6. Client opens SSE stream at `GET /api/executions/:id/stream`
7. BullMQ worker picks up the trigger job, executes it, enqueues the next node job
8. Each node job: execute → emit SSE event → enqueue next node
9. When Output node job completes (no next node), worker emits `execution_complete` and finalizes the SQLite record
10. On any job failure, BullMQ retries automatically (up to configured `attempts`); on final failure, worker emits `execution_error`

---

## 5. Directory Structure

```
backend/
├── src/
│   ├── index.js                  # Entry point — starts Express + BullMQ worker
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
│   ├── queue/
│   │   ├── executionQueue.js     # BullMQ Queue instance — "execution" queue
│   │   ├── nodeWorker.js         # BullMQ Worker — processes one node job at a time
│   │   └── jobHelpers.js         # Helpers: enqueueNode(), finalizeExecution()
│   │
│   ├── engine/
│   │   ├── dag.js                # Topological sort, cycle detection, getNextNode()
│   │   ├── context.js            # ExecutionContext class — shared state across nodes
│   │   └── interpolate.js        # Template string resolution: {{context.key}}
│   │
│   ├── nodes/                    # One executor per node type (pure async functions)
│   │   ├── trigger.js
│   │   ├── llmCall.js
│   │   ├── httpRequest.js
│   │   ├── condition.js
│   │   ├── transform.js
│   │   └── output.js
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
│   │   ├── jobHelpers.test.js
│   │   └── nodes/
│   │       └── condition.test.js
│   └── integration/
│       ├── workflows.test.js
│       └── executions.test.js
│
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml            # Includes Redis service
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

> **Note on large outputs:** LLM responses and full HTTP response bodies are stored in SQLite, not in the BullMQ job payload. The job payload carries only a reference key. This keeps Redis memory lean and avoids the 5MB Redis value limit.

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

**What happens internally:**
1. Workflow loaded from SQLite
2. Graph validated — cycle check runs immediately; returns `422` if cycle found
3. Execution record inserted (`status: PENDING`)
4. Trigger node job pushed to BullMQ `execution` queue
5. Execution record updated to `status: RUNNING`

**Response `202`**
```json
{
  "executionId": "uuid"
}
```

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
Opens an SSE connection. Streams events as the BullMQ worker processes each node.

**Headers**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Types**

```
event: node_start
data: {"nodeId":"node-2","nodeType":"llmCall","label":"Summarize","attempt":1}

event: node_success
data: {"nodeId":"node-2","output":{"summary":"..."},"durationMs":2312}

event: node_retry
data: {"nodeId":"node-2","attempt":2,"error":"OpenAI timeout","nextRetryMs":2000}

event: node_error
data: {"nodeId":"node-2","error":"OpenAI timeout after 3 attempts"}

event: execution_complete
data: {"status":"SUCCESS","output":{"result":"..."}}

event: execution_error
data: {"status":"ERROR","error":"Cycle detected in workflow graph"}
```

Stream closes after `execution_complete` or `execution_error`.

> **New in v1.1:** `node_retry` event emitted when BullMQ retries a failed job, so the frontend can show retry state on the node.

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
  "dbConnected": true,
  "redisConnected": true,
  "queueName": "execution",
  "activeJobs": 1,
  "waitingJobs": 0
}
```

---

## 8. BullMQ Queue System

This is the core change from v1.0. Instead of a synchronous executor loop, each node is an independent BullMQ job.

---

### 8.1 Queue Setup (`queue/executionQueue.js`)

```js
import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const executionQueue = new Queue('execution', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,                              // retry failed nodes up to 3 times
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s between retries
    removeOnComplete: 100,                    // keep last 100 completed jobs in Redis
    removeOnFail: 200,                        // keep last 200 failed jobs for debugging
  },
});
```

---

### 8.2 Job Payload Shape

Every job pushed to the queue carries:

```js
{
  executionId: "uuid",       // links back to SQLite execution record
  nodeId: "node-2",          // which node to execute
  context: {                 // current execution context — all prior node outputs
    input: { text: "..." },
    summary: "...",          // added by previous llmCall node
  },
  graph: {                   // full workflow graph — needed to find the next node
    nodes: [...],
    edges: [...]
  }
}
```

> **Important:** Keep `context` lean. Store large values (LLM responses > 10KB, full HTTP responses) in SQLite using `executionId + nodeId` as the key. Pass only a `ref` string in the context payload.

---

### 8.3 Node Worker (`queue/nodeWorker.js`)

```js
import { Worker } from 'bullmq';
import { nodeExecutors } from '../nodes/index.js';
import { resolveConfig } from '../engine/interpolate.js';
import { getNextNodeId } from '../engine/dag.js';
import { sseManager } from '../sse/sseManager.js';
import { enqueueNode, finalizeExecution } from './jobHelpers.js';
import { redisConnection } from '../config/redis.js';

const worker = new Worker('execution', async (job) => {
  const { executionId, nodeId, context, graph } = job.data;
  const node = graph.nodes.find(n => n.id === nodeId);
  const start = Date.now();

  sseManager.emit(executionId, 'node_start', {
    nodeId,
    nodeType: node.type,
    label: node.data.label,
    attempt: job.attemptsMade + 1,
  });

  // 1. resolve {{context.key}} templates in config
  const config = resolveConfig(node.data.config, context);

  // 2. run the node executor
  const result = await nodeExecutors[node.type](config, context);

  // 3. merge result into context
  const updatedContext = config.outputKey
    ? { ...context, [config.outputKey]: result }
    : context;

  const durationMs = Date.now() - start;

  sseManager.emit(executionId, 'node_success', { nodeId, output: result, durationMs });

  // 4. find next node and enqueue it, or finalize if done
  const nextNodeId = getNextNodeId(graph, nodeId, result);

  if (nextNodeId) {
    await enqueueNode({ executionId, nodeId: nextNodeId, context: updatedContext, graph });
  } else {
    await finalizeExecution(executionId, 'SUCCESS', updatedContext);
    sseManager.emit(executionId, 'execution_complete', { output: updatedContext });
    sseManager.close(executionId);
  }

}, {
  connection: redisConnection,
  concurrency: 5,            // process up to 5 node jobs simultaneously (across workflows)
});

// BullMQ calls this on every failed attempt (including ones that will be retried)
worker.on('failed', async (job, err) => {
  const { executionId, nodeId } = job.data;
  const willRetry = job.attemptsMade < job.opts.attempts;

  if (willRetry) {
    sseManager.emit(executionId, 'node_retry', {
      nodeId,
      attempt: job.attemptsMade + 1,
      error: err.message,
      nextRetryMs: calculateBackoff(job.attemptsMade),
    });
  } else {
    // Final failure — no more retries
    await finalizeExecution(executionId, 'ERROR', null, err.message);
    sseManager.emit(executionId, 'node_error', { nodeId, error: err.message });
    sseManager.emit(executionId, 'execution_error', { error: err.message });
    sseManager.close(executionId);
  }
});
```

---

### 8.4 Job Helpers (`queue/jobHelpers.js`)

```js
import { executionQueue } from './executionQueue.js';
import { db } from '../db/client.js';

// Push the next node as a new BullMQ job
export async function enqueueNode({ executionId, nodeId, context, graph }) {
  await executionQueue.add('node', { executionId, nodeId, context, graph });
}

// Write final status to SQLite execution record
export async function finalizeExecution(executionId, status, context, error = null) {
  db.prepare(`
    UPDATE executions
    SET status = ?, output = ?, finished_at = datetime('now'), error = ?
    WHERE id = ?
  `).run(status, JSON.stringify(context), error, executionId);
}
```

---

### 8.5 Why One Job Per Node (Not One Job Per Workflow)

| Approach | Pros | Cons |
|---|---|---|
| One job for entire workflow | Simpler payload, single retry unit | Retry re-runs the whole workflow from scratch |
| **One job per node (chosen)** | Retry only the failed node, progress preserved | Context must be passed in each job payload |

With one job per node, if `node-4` fails after `node-1`, `node-2`, `node-3` have already succeeded, BullMQ retries only `node-4`. The context from the previous three nodes is carried in the job payload so no work is repeated.

---

### 8.6 `docker-compose.yml` (Redis included)

```yaml
version: '3.9'
services:
  backend:
    build: .
    ports:
      - "4000:4000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes   # persist jobs across restarts

volumes:
  redis_data:
```

---

## 9. Workflow Execution Engine

### 9.1 `engine/dag.js` — Graph Utilities

```js
// Returns true if graph has a cycle (DFS-based) — run before enqueuing
function hasCycle(nodes, edges) { ... }

// Returns the nodeId the executor should visit next after the given node
// For condition nodes, result contains the chosen branch (truePath/falsePath)
function getNextNodeId(graph, currentNodeId, nodeResult) { ... }
```

### 9.2 `engine/context.js` — ExecutionContext

Used inside node executors for a clean get/set interface. The plain `.data` object is what gets serialized into the BullMQ job payload.

```js
class ExecutionContext {
  constructor(data = {}) {
    this.data = data;
  }
  set(key, value) { this.data[key] = value; }
  get(key)        { return this.data[key]; }
  snapshot()      { return structuredClone(this.data); }
}
```

### 9.3 `engine/interpolate.js` — Template Resolution

Resolves `{{context.key}}` and `{{context.nested.key}}` in any string field of a node's config before execution.

```js
// "Summarize: {{context.text}}" + { text: "Node.js" } => "Summarize: Node.js"
function resolveConfig(config, contextData) {
  // deep-clones config, walks all string values, interpolates
}
```

---

## 10. Node Types & Executors

Each node executor is a pure async function:

```js
async function execute(config, context) => unknown
```

The returned value is stored in `context[config.outputKey]` by the worker.

---

### `trigger.js`

Validates the initial input and passes it into context.

```js
config: {
  triggerType: "manual",    // "manual" | "webhook"
  inputSchema: {}           // optional JSON Schema for validation
}
```

---

### `llmCall.js`

Sends a prompt to an AI provider and returns the response text.

```js
config: {
  provider: "openai",            // "openai" | "anthropic"
  model: "gpt-4o",
  systemPrompt: "You are...",    // supports {{context.key}}
  userPrompt: "Summarize: {{context.text}}",
  outputKey: "summary",
  maxTokens: 1024,
  temperature: 0.7
}
```

**Behavior:**
- Interpolates `systemPrompt` and `userPrompt` with current context before the API call
- Switches on `provider` to call the correct SDK
- Returns response text; stored at `context[outputKey]`
- If the response is large (> 10KB), stored in SQLite; a `ref` key is put in context instead

---

### `httpRequest.js`

Makes an outbound HTTP call and returns the response body.

```js
config: {
  method: "GET",
  url: "https://api.example.com/data?id={{context.itemId}}",
  headers: { "Authorization": "Bearer {{context.token}}" },
  body: "{{context.payload}}",
  outputKey: "apiResponse",
  timeoutMs: 10000
}
```

---

### `condition.js`

Evaluates a JS expression and returns the chosen branch's nodeId. The worker uses this return value in `getNextNodeId()` to decide which job to enqueue next.

```js
config: {
  expression: "context.score > 0.8",
  truePath: "node-success",
  falsePath: "node-fallback"
}
```

**Behavior:**
- Expression evaluated as `new Function('context', \`return \${expression}\`)(context)`
- Returns `truePath` or `falsePath` nodeId string
- Worker passes this result to `getNextNodeId()` which reads it to pick the next job

---

### `transform.js`

Runs a sandboxed JS snippet and returns the result.

```js
config: {
  code: "return { wordCount: context.text.split(' ').length }",
  outputKey: "stats"
}
```

**Behavior:**
- Runs inside `vm2` sandbox — no `require`, no filesystem, no network
- Timeout: 5 seconds (configurable via `TRANSFORM_TIMEOUT_MS`)
- Return value stored at `context[outputKey]`

---

### `output.js`

Terminal node. Picks specified keys from context as the final result.

```js
config: {
  outputKeys: ["summary", "stats"],
  format: "json"   // "json" | "text" | "markdown"
}
```

**Behavior:**
- Returns `pick(context, outputKeys)`
- Worker detects no `nextNodeId` after this node and calls `finalizeExecution()`

---

## 11. Real-time Streaming (SSE)

### `sse/sseManager.js`

Manages active SSE response objects keyed by `executionId`. The BullMQ worker calls `sseManager.emit()` directly — both the Express server and the worker run in the same Node.js process.

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

sseManager.register(executionId, res);

// Heartbeat every 20s to keep connection alive through proxies
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

## 12. Environment & Configuration

### `.env.example`

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DB_PATH=./data/workflows.db

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# BullMQ job options
QUEUE_JOB_ATTEMPTS=3
QUEUE_BACKOFF_DELAY_MS=2000
QUEUE_CONCURRENCY=5

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Security
ALLOWED_HTTP_DOMAINS=*
TRANSFORM_TIMEOUT_MS=5000
HTTP_REQUEST_TIMEOUT_MS=10000
```

### `config.js`

```js
export default {
  port: parseInt(process.env.PORT ?? '4000'),
  dbPath: process.env.DB_PATH ?? './data/workflows.db',
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
  },
  queue: {
    attempts:    parseInt(process.env.QUEUE_JOB_ATTEMPTS ?? '3'),
    backoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY_MS ?? '2000'),
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY ?? '5'),
  },
  openaiApiKey:    process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  allowedHttpDomains: process.env.ALLOWED_HTTP_DOMAINS?.split(',') ?? ['*'],
  transformTimeoutMs: parseInt(process.env.TRANSFORM_TIMEOUT_MS ?? '5000'),
  httpRequestTimeoutMs: parseInt(process.env.HTTP_REQUEST_TIMEOUT_MS ?? '10000'),
};
```

---

## 13. Error Handling Strategy

### API Layer

All route handlers wrapped in `asyncHandler`. Unhandled errors bubble to global middleware:

```js
app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message,
    code: err.code ?? 'INTERNAL_ERROR'
  });
});
```

### BullMQ Worker Layer

| Scenario | Behavior |
|---|---|
| Cycle in graph | Detected before job is enqueued; `422` returned from POST /api/executions |
| Node job throws (attempt 1 or 2) | BullMQ retries with exponential backoff; `node_retry` SSE emitted |
| Node job throws (final attempt) | `worker.on('failed')` fires; `node_error` + `execution_error` SSE emitted; execution finalized as ERROR in SQLite |
| LLM provider timeout | Caught in `llmCall.js`; re-thrown so BullMQ can retry |
| Transform sandbox timeout | `vm2` kills the script; throws `TransformTimeoutError`; BullMQ retries |
| Condition references undefined key | Returns `false` branch (safe default); no throw, no retry needed |
| HTTP request timeout | Axios throws; caught and re-thrown as `HttpNodeError`; BullMQ retries |
| Server crashes mid-execution | Jobs remain in Redis; worker resumes processing on restart |

### Custom Error Classes

```js
class WorkflowNotFoundError extends Error { status = 404; }
class CycleDetectedError extends Error { status = 422; }
class NodeExecutionError extends Error { status = 500; nodeId; }
class TransformTimeoutError extends NodeExecutionError {}
class HttpNodeError extends NodeExecutionError {}
```

---

## 14. Security Requirements

| Area | Requirement |
|---|---|
| Transform sandbox | All user-provided JS runs inside `vm2` — no `require`, no filesystem, no network access |
| API keys | Never returned in any API response; stored only in environment variables |
| HTTP Request node | `ALLOWED_HTTP_DOMAINS` env var restricts outbound domains in production |
| SQL injection | `better-sqlite3` prepared statements for all queries — no string interpolation |
| Input validation | All request bodies validated with Zod before reaching route logic |
| Error messages | Stack traces never returned to client in production (`NODE_ENV=production`) |
| Redis | In production, bind Redis to localhost or use a private network — not exposed publicly |
| Job payload | API keys and secrets never included in BullMQ job payloads — fetched from env at execution time |

---

## 15. Non-Functional Requirements

### Performance

- Workflow save/load: < 50ms for graphs with up to 100 nodes
- `POST /api/executions` response (202): < 100ms
- SSE first event (`node_start` for trigger): < 500ms after 202 response
- BullMQ Redis round-trip overhead per node: < 50ms
- Concurrent SSE streams supported: at minimum 10 simultaneous

### Reliability

- SQLite WAL mode enabled for concurrent read performance
- BullMQ retries with exponential backoff ensure transient LLM/HTTP failures recover automatically
- Server crash during execution: jobs persist in Redis, resume on process restart
- Execution records never left in `RUNNING` state — `worker.on('failed')` always finalizes
- Heartbeat pings on SSE connections prevent proxy timeouts

### Observability

- Pino structured JSON logs for all requests, job events, and execution lifecycle
- Log levels: `error`, `warn`, `info`, `debug` — configurable via `LOG_LEVEL` env var
- Each node log entry includes `nodeId`, `status`, `durationMs`, `attempt`
- BullMQ job IDs logged alongside `executionId` for cross-referencing Redis and SQLite

### Testability

- Node executors are pure async functions — unit tested with mock context, no queue needed
- Worker logic tested by mocking `executionQueue.add` and `sseManager.emit`
- Routes tested with `supertest` against in-memory SQLite + mocked BullMQ queue
- DAG utilities (`hasCycle`, `getNextNodeId`) tested independently

---

## 16. Development Milestones

| Phase | Milestone | Key Deliverables | Duration |
|---|---|---|---|
| 1 | Scaffold | Express app, SQLite schema, health endpoint, Docker + Redis setup | 2–3 days |
| 2 | Workflow CRUD | All 5 workflow endpoints, Zod validation, error middleware | 2–3 days |
| 3 | BullMQ Foundation | Redis config, executionQueue, nodeWorker skeleton, jobHelpers, SSE manager | 3–4 days |
| 4 | Execution Pipeline | DAG validation, trigger job enqueue on POST /executions, worker → next-node chaining | 2–3 days |
| 5 | Node Executors | All 6 node types implemented and unit tested | 3–4 days |
| 6 | Retry & Error Handling | worker.on('failed'), node_retry SSE event, error classes, finalize on crash | 2 days |
| 7 | Hardening | Sandbox security, integration tests, large-output SQLite offload, `.env` docs | 2–3 days |

**Total estimated backend build time: ~3.5 weeks**

---

*AI Workflow Builder Backend PRD v1.1 — Internal Use*