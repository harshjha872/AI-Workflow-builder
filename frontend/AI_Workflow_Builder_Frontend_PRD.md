# AI Workflow Builder — Frontend PRD

> **Version:** 1.0 | **Date:** February 2026 | **Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Tech Stack](#3-tech-stack)
4. [Application Structure](#4-application-structure)
5. [Directory Structure](#5-directory-structure)
6. [Pages & Routing](#6-pages--routing)
7. [Layout & UI Zones](#7-layout--ui-zones)
8. [Component Breakdown](#8-component-breakdown)
9. [State Management](#9-state-management)
10. [Canvas & Node System](#10-canvas--node-system)
11. [Node Config Forms](#11-node-config-forms)
12. [Execution & Real-time Updates](#12-execution--real-time-updates)
13. [API Client Layer](#13-api-client-layer)
14. [Node Visual Design](#14-node-visual-design)
15. [User Interactions & Keyboard Shortcuts](#15-user-interactions--keyboard-shortcuts)
16. [Error & Empty States](#16-error--empty-states)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Development Milestones](#18-development-milestones)

---

## 1. Overview

The frontend is a single-page React application that provides a visual, drag-and-drop workflow editor. Users build AI automation pipelines by connecting nodes on an infinite canvas, configuring each node via a side panel, and running workflows with real-time execution feedback.

The frontend is purely a client — it holds no business logic for workflow execution. All orchestration happens on the backend. The frontend's responsibilities are:

- Rendering the node canvas and handling all drag/drop/connect interactions
- Managing local UI state (selected node, panel open/closed, etc.)
- Syncing workflow graph state to the backend on save
- Consuming SSE streams and reflecting execution status visually on the canvas

---

## 2. Goals & Non-Goals

### Goals

- Provide an intuitive drag-and-drop canvas powered by React Flow
- Render 6 node types with distinct visual styles and config forms
- Show real-time node status (idle → running → success/error) during execution
- Allow users to create, save, load, rename, and delete workflows
- Display a live execution log panel with per-node output
- Be fully functional with just a running backend — no external services needed from the frontend

### Non-Goals (v1)

- Mobile or touch-optimized canvas interactions
- Undo/redo history
- Multi-user collaboration or presence indicators
- Dark mode
- Workflow import/export (JSON file upload/download)
- Minimap or workflow thumbnail previews

---

## 3. Tech Stack

| Concern | Technology | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast HMR, modern JSX, optimized builds |
| Canvas / Flow | React Flow (`@xyflow/react`) | Production-grade node/edge rendering, built-in drag & pan |
| State Management | Zustand | Minimal boilerplate, works great with React Flow |
| Routing | React Router v6 | Simple client-side routing for pages |
| UI Components | shadcn/ui | Accessible, composable, unstyled-by-default |
| Styling | Tailwind CSS | Utility-first, consistent design tokens |
| API Calls | Axios | Interceptors for base URL and error handling |
| Form Handling | React Hook Form + Zod | Performant forms, schema-driven validation |
| Icons | Lucide React | Clean icon set, tree-shakeable |
| Notifications | Sonner | Lightweight toast library |
| SSE Client | Native `EventSource` API | No library needed |

---

## 4. Application Structure

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                  │
│                                                         │
│  ┌──────────┐   ┌────────────────────────────────────┐  │
│  │ Sidebar  │   │         Main Area                  │  │
│  │          │   │  ┌──────────────────────────────┐  │  │
│  │Workflow  │   │  │      Toolbar                 │  │  │
│  │  List    │   │  └──────────────────────────────┘  │  │
│  │          │   │  ┌────────┐ ┌──────────┐ ┌──────┐  │  │
│  │──────────│   │  │ Node   │ │  Canvas  │ │Config│  │  │
│  │          │   │  │Palette │ │(ReactFlow│ │Panel │  │  │
│  │ Node     │   │  │        │ │)         │ │      │  │  │
│  │ Palette  │   │  └────────┘ └──────────┘ └──────┘  │  │
│  │          │   │  ┌──────────────────────────────┐  │  │
│  └──────────┘   │  │   Execution Log Drawer       │  │  │
│                 │  └──────────────────────────────┘  │  │
│                 └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Directory Structure

```
frontend/
├── src/
│   ├── main.jsx                   # ReactDOM.createRoot entry point
│   ├── App.jsx                    # Router setup
│   │
│   ├── pages/
│   │   ├── HomePage.jsx           # Workflow list / landing
│   │   └── EditorPage.jsx         # Main workflow editor (canvas + panels)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Toolbar.jsx        # Top bar: name, save, run buttons
│   │   │   ├── WorkflowSidebar.jsx # Left: saved workflows list
│   │   │   └── ExecutionDrawer.jsx # Bottom: live log panel
│   │   │
│   │   ├── canvas/
│   │   │   ├── Canvas.jsx         # React Flow wrapper, handles drop events
│   │   │   ├── NodePalette.jsx    # Draggable node type cards
│   │   │   └── ConnectionLine.jsx # Custom edge style
│   │   │
│   │   ├── nodes/                 # Custom React Flow node renderers
│   │   │   ├── BaseNode.jsx       # Shared wrapper (handles, status ring)
│   │   │   ├── TriggerNode.jsx
│   │   │   ├── LLMCallNode.jsx
│   │   │   ├── HttpRequestNode.jsx
│   │   │   ├── ConditionNode.jsx
│   │   │   ├── TransformNode.jsx
│   │   │   └── OutputNode.jsx
│   │   │
│   │   ├── config/                # Right panel config forms per node type
│   │   │   ├── ConfigPanel.jsx    # Wrapper: shows correct form for selected node
│   │   │   ├── TriggerConfig.jsx
│   │   │   ├── LLMCallConfig.jsx
│   │   │   ├── HttpRequestConfig.jsx
│   │   │   ├── ConditionConfig.jsx
│   │   │   ├── TransformConfig.jsx
│   │   │   └── OutputConfig.jsx
│   │   │
│   │   └── ui/                    # Generic reusable UI primitives
│   │       ├── Badge.jsx          # Status badges (RUNNING, SUCCESS, etc.)
│   │       ├── CodeEditor.jsx     # Textarea with monospace styling
│   │       └── KeyValueEditor.jsx # Dynamic key-value pair input (headers, etc.)
│   │
│   ├── store/
│   │   ├── workflowStore.js      # Nodes, edges, workflow metadata, save state
│   │   └── executionStore.js     # Current execution status, logs, SSE connection
│   │
│   ├── api/
│   │   ├── client.js             # Axios instance with base URL
│   │   ├── workflows.js          # Workflow CRUD API calls
│   │   └── executions.js         # Execution trigger + history API calls
│   │
│   ├── hooks/
│   │   ├── useSSE.js             # Opens/closes SSE stream, dispatches to store
│   │   ├── useWorkflowSave.js    # Debounced save logic
│   │   └── useDrop.js            # Handles canvas drop to create new node
│   │
│   └── utils/
│       ├── nodeDefaults.js       # Default config for each node type
│       └── statusColors.js       # Maps execution status to Tailwind classes
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── .env.example
└── package.json
```

---

## 6. Pages & Routing

### Routes

| Path | Page | Description |
|---|---|---|
| `/` | `HomePage` | Lists all saved workflows with create button |
| `/editor` | `EditorPage` | New blank workflow editor |
| `/editor/:id` | `EditorPage` | Load and edit an existing workflow |

### `HomePage`

- Fetches `GET /api/workflows` on mount
- Displays workflow cards: name, description, last updated, execution count
- "New Workflow" button navigates to `/editor`
- Clicking a card navigates to `/editor/:id`
- Delete button on each card (with confirm dialog)
- Empty state: illustration + "Create your first workflow" CTA

### `EditorPage`

- On mount: if `:id` present, fetches `GET /api/workflows/:id` and loads graph into store
- If no `:id`: initializes empty graph with a default Trigger node
- Manages the full editor layout — Toolbar, Canvas, ConfigPanel, ExecutionDrawer
- Handles browser navigation guard if there are unsaved changes ("Leave without saving?")

---

## 7. Layout & UI Zones

### Toolbar (top, full width, fixed)

```
[ ← Back ]  [ Workflow Name (editable) ]         [ Save ]  [ ▶ Run ]
```

- Back arrow navigates to `/`
- Workflow name is an inline editable input — click to edit
- Save button: calls PUT, shows spinner while saving, success toast on done
- Run button: disabled while a workflow is already running; triggers execution

### Node Palette (left panel, fixed width 220px)

- Lists all 6 node types as draggable cards
- Each card shows: icon, node type name, one-line description
- Drag a card onto the canvas to create that node type

### Canvas (center, fills remaining space)

- React Flow infinite canvas with pan and zoom
- Nodes rendered as custom components (see Node Visual Design)
- Edges drawn as smooth bezier curves
- Drop zone: accepts dragged palette items

### Config Panel (right panel, fixed width 320px)

- Hidden when no node is selected
- Slides in when a node is clicked
- Shows the config form for the selected node type
- "Delete Node" button at the bottom

### Execution Log Drawer (bottom, collapsible)

- Hidden by default
- Opens automatically when "Run" is clicked
- Shows: execution status badge, per-node log entries with status + output
- Can be manually collapsed/expanded

---

## 8. Component Breakdown

### `Canvas.jsx`

The core React Flow wrapper. Responsibilities:

```jsx
// Key props passed to <ReactFlow>
- nodes, edges (from workflowStore)
- onNodesChange, onEdgesChange (update store)
- onConnect (add new edge to store)
- onDrop, onDragOver (create node from palette drag)
- onNodeClick (set selectedNodeId in store)
- onPaneClick (clear selectedNodeId)
- nodeTypes (map of type string → custom component)
```

### `BaseNode.jsx`

Every custom node wraps this. It provides:

- The outer container div with correct border/shadow styling
- A colored status ring (based on `executionStore.nodeStatuses[node.id]`)
- Input handle (top) and output handle (bottom) via React Flow `<Handle>`
- Node label at the top
- A slot for node-type-specific content in the middle

```jsx
function BaseNode({ id, data, children }) {
  const status = useExecutionStore(s => s.nodeStatuses[id]);
  const statusClass = statusColors[status] ?? 'border-gray-200';

  return (
    <div className={`rounded-lg border-2 bg-white shadow-sm w-52 ${statusClass}`}>
      <Handle type="target" position={Position.Top} />
        <div className="px-3 py-2 text-sm font-medium text-gray-700">{data.label}</div>
        <div className="px-3 pb-3">{children}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### `NodePalette.jsx`

Renders draggable node type cards. On drag start, sets `dataTransfer` with the node type so `Canvas.jsx` can read it on drop.

```jsx
function PaletteItem({ type, icon, label, description }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/node-type', type);
  };

  return (
    <div draggable onDragStart={onDragStart} className="...">
      <span>{icon}</span>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
```

### `ConfigPanel.jsx`

Reads `selectedNodeId` from store, finds the node, renders the matching config form.

```jsx
const CONFIG_FORMS = {
  trigger:     TriggerConfig,
  llmCall:     LLMCallConfig,
  httpRequest: HttpRequestConfig,
  condition:   ConditionConfig,
  transform:   TransformConfig,
  output:      OutputConfig,
};

function ConfigPanel() {
  const { selectedNodeId, nodes, updateNodeConfig } = useWorkflowStore();
  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const Form = CONFIG_FORMS[node.type];
  return (
    <aside className="w-80 border-l bg-white overflow-y-auto">
      <Form config={node.data.config} onChange={(cfg) => updateNodeConfig(node.id, cfg)} />
    </aside>
  );
}
```

### `ExecutionDrawer.jsx`

Shows live execution progress. Reads from `executionStore`.

```jsx
function ExecutionDrawer() {
  const { isOpen, status, logs } = useExecutionStore();
  if (!isOpen) return null;

  return (
    <div className="h-64 border-t bg-gray-950 text-gray-100 overflow-y-auto font-mono text-sm p-4">
      <StatusBadge status={status} />
      {logs.map(log => <LogEntry key={log.nodeId + log.startedAt} {...log} />)}
    </div>
  );
}
```

---

## 9. State Management

Two Zustand stores handle all application state.

### `workflowStore.js`

Owns the workflow graph and metadata.

```js
{
  // Workflow metadata
  id: null,              // null = unsaved new workflow
  name: "Untitled",
  isSaved: true,
  isSaving: false,

  // React Flow graph state
  nodes: [],
  edges: [],

  // Selection
  selectedNodeId: null,

  // Actions
  setName(name),
  setNodes(nodes),
  setEdges(edges),
  addNode(type, position),         // creates node with default config
  updateNodeConfig(nodeId, config),
  deleteNode(nodeId),
  setSelectedNodeId(id),
  loadWorkflow(workflow),          // replaces entire state from API response
  markSaved(id),                   // sets isSaved=true, stores returned id
}
```

### `executionStore.js`

Owns the current execution state and SSE log.

```js
{
  // Current execution
  executionId: null,
  status: 'IDLE',          // IDLE | RUNNING | SUCCESS | ERROR
  isDrawerOpen: false,

  // Per-node status for canvas visualization
  nodeStatuses: {},        // { [nodeId]: 'RUNNING' | 'SUCCESS' | 'ERROR' }

  // Log entries
  logs: [],                // array of { nodeId, type, status, output, durationMs, error }

  // Final output
  output: null,

  // Actions
  startExecution(executionId),
  setNodeRunning(nodeId),
  setNodeSuccess(nodeId, output, durationMs),
  setNodeError(nodeId, error),
  setExecutionComplete(output),
  setExecutionError(error),
  resetExecution(),
  openDrawer(),
  closeDrawer(),
}
```

---

## 10. Canvas & Node System

### Adding a Node (Drop Flow)

```
User drags palette item → Canvas onDragOver (preventDefault) →
User drops → Canvas onDrop fires →
Read node type from dataTransfer →
Generate unique id (nanoid) →
Get drop position (reactFlowInstance.screenToFlowPosition) →
Call workflowStore.addNode(type, position) →
Node appears on canvas
```

### Default Node Config (`nodeDefaults.js`)

Each node type has a default config so forms are never empty on creation:

```js
export const NODE_DEFAULTS = {
  trigger:     { triggerType: 'manual', inputSchema: '' },
  llmCall:     { provider: 'openai', model: 'gpt-4o', systemPrompt: 'You are a helpful assistant.', userPrompt: '', outputKey: 'result', maxTokens: 1024 },
  httpRequest: { method: 'GET', url: '', headers: {}, body: '', outputKey: 'response', timeoutMs: 10000 },
  condition:   { expression: 'context.score > 0.5', truePath: '', falsePath: '' },
  transform:   { code: 'return { output: context.input }', outputKey: 'transformed' },
  output:      { outputKeys: ['result'], format: 'json' },
};
```

### Connecting Nodes

React Flow handles the visual edge drawing. On `onConnect`:

```js
onConnect: (connection) => {
  const newEdge = { id: nanoid(), ...connection };
  setEdges(edges => addEdge(newEdge, edges));
}
```

Edges are stored in `workflowStore.edges` and serialized into the graph on save.

---

## 11. Node Config Forms

Each config form uses React Hook Form with Zod validation. All forms follow the same pattern:

```jsx
function LLMCallConfig({ config, onChange }) {
  const { register, watch, formState: { errors } } = useForm({
    defaultValues: config,
    resolver: zodResolver(llmCallSchema),
  });

  // Watch all fields and propagate changes up to store
  useEffect(() => {
    const sub = watch((values) => onChange(values));
    return () => sub.unsubscribe();
  }, [watch]);

  return (
    <div className="space-y-4 p-4">
      <label>Provider
        <select {...register('provider')}>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </label>
      <label>Model
        <input {...register('model')} />
      </label>
      <label>System Prompt
        <textarea {...register('systemPrompt')} rows={3} />
      </label>
      <label>User Prompt <span className="text-xs text-gray-400">supports {"{{context.key}}"}</span>
        <textarea {...register('userPrompt')} rows={4} />
      </label>
      <label>Output Key
        <input {...register('outputKey')} />
      </label>
    </div>
  );
}
```

### Config Fields Per Node Type

| Node Type | Fields |
|---|---|
| **Trigger** | Trigger Type (manual), Input Schema (optional textarea) |
| **LLM Call** | Provider, Model, System Prompt, User Prompt, Output Key, Max Tokens, Temperature |
| **HTTP Request** | Method (select), URL, Headers (key-value editor), Body (textarea), Output Key, Timeout |
| **Condition** | Expression (code input), True Path (node id select), False Path (node id select) |
| **Transform** | Code (code editor textarea), Output Key |
| **Output** | Output Keys (multi-select or tag input), Format (json/text/markdown) |

---

## 12. Execution & Real-time Updates

### Run Flow

```
User clicks "Run" →
executionStore.resetExecution() →
executionStore.openDrawer() →
POST /api/executions { workflowId, input: {} } →
Receive { executionId } →
executionStore.startExecution(executionId) →
useSSE hook opens EventSource on /api/executions/:id/stream →
SSE events arrive → dispatch to executionStore →
Canvas nodes update color in real time →
Stream closes on complete/error
```

### `useSSE.js` Hook

```js
function useSSE(executionId) {
  const { setNodeRunning, setNodeSuccess, setNodeError,
          setExecutionComplete, setExecutionError } = useExecutionStore();

  useEffect(() => {
    if (!executionId) return;

    const es = new EventSource(`/api/executions/${executionId}/stream`);

    es.addEventListener('node_start',           e => setNodeRunning(JSON.parse(e.data).nodeId));
    es.addEventListener('node_success',         e => { const d = JSON.parse(e.data); setNodeSuccess(d.nodeId, d.output, d.durationMs); });
    es.addEventListener('node_error',           e => { const d = JSON.parse(e.data); setNodeError(d.nodeId, d.error); });
    es.addEventListener('execution_complete',   e => setExecutionComplete(JSON.parse(e.data).output));
    es.addEventListener('execution_error',      e => setExecutionError(JSON.parse(e.data).error));

    return () => es.close();
  }, [executionId]);
}
```

### Node Status → Visual Mapping (`statusColors.js`)

```js
export const statusColors = {
  RUNNING: 'border-blue-400 shadow-blue-100 shadow-md',
  SUCCESS: 'border-green-400 shadow-green-100 shadow-md',
  ERROR:   'border-red-400 shadow-red-100 shadow-md',
  default: 'border-gray-200',
};
```

---

## 13. API Client Layer

### `api/client.js`

```js
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Global error handler
client.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error ?? 'Something went wrong';
    toast.error(message);
    return Promise.reject(err);
  }
);

export default client;
```

### `api/workflows.js`

```js
export const workflowsApi = {
  list:    ()         => client.get('/workflows').then(r => r.data),
  get:     (id)       => client.get(`/workflows/${id}`).then(r => r.data),
  create:  (payload)  => client.post('/workflows', payload).then(r => r.data),
  update:  (id, data) => client.put(`/workflows/${id}`, data).then(r => r.data),
  delete:  (id)       => client.delete(`/workflows/${id}`),
};
```

### `api/executions.js`

```js
export const executionsApi = {
  run:     (workflowId, input) => client.post('/executions', { workflowId, input }).then(r => r.data),
  get:     (id)                => client.get(`/executions/${id}`).then(r => r.data),
  history: (workflowId)        => client.get(`/workflows/${workflowId}/executions`).then(r => r.data),
};
```

---

## 14. Node Visual Design

Each node on the canvas has a distinct color identity so users can scan the graph at a glance.

| Node Type | Icon | Accent Color | Description shown on node |
|---|---|---|---|
| Trigger | ▶ | Green (`#16a34a`) | "Manual Start" or "Webhook" |
| LLM Call | 🤖 | Indigo (`#4f46e5`) | Provider + model name |
| HTTP Request | 🌐 | Sky (`#0284c7`) | Method + truncated URL |
| Condition | ◇ | Amber (`#d97706`) | Truncated expression |
| Transform | ⚙ | Purple (`#7c3aed`) | "JS Transform" |
| Output | 📤 | Rose (`#e11d48`) | Output key names |

### Node Anatomy

```
┌─────────────────────────┐
│   ●  (input handle)     │  ← top center, hidden on Trigger nodes
├─────────────────────────┤
│  🤖  LLM Call           │  ← accent icon + type label
│  ─────────────────────  │
│  gpt-4o · openai        │  ← key config preview (1-2 lines)
│  "Summarize this: ..."  │
├─────────────────────────┤
│   ●  (output handle)    │  ← bottom center, hidden on Output nodes
└─────────────────────────┘
      ↑ status border ring (blue/green/red during execution)
```

---

## 15. User Interactions & Keyboard Shortcuts

### Mouse Interactions

| Interaction | Result |
|---|---|
| Drag palette item → canvas | Creates node at drop position |
| Click node | Selects node, opens Config Panel |
| Click canvas background | Deselects node, closes Config Panel |
| Drag node | Moves node position (React Flow default) |
| Drag from output handle → input handle | Creates edge between nodes |
| Click edge | Selects edge (highlights it) |
| Right-click node | Context menu: Rename, Duplicate, Delete |
| Scroll | Zoom in/out on canvas |
| Click + drag canvas | Pan canvas |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Delete` / `Backspace` | Delete selected node or edge |
| `Ctrl/Cmd + S` | Save workflow |
| `Ctrl/Cmd + Enter` | Run workflow |
| `Escape` | Deselect / close config panel |
| `Ctrl/Cmd + A` | Select all nodes |

---

## 16. Error & Empty States

### Canvas Empty State

When the canvas has no nodes (new workflow):

```
┌─────────────────────────────────┐
│                                 │
│    ⬡  Drag a node here         │
│    to start building your       │
│    workflow                     │
│                                 │
└─────────────────────────────────┘
```

### Workflow List Empty State (HomePage)

```
No workflows yet.
Build your first AI automation in minutes.
[ + New Workflow ]
```

### Disconnected / API Error

- If backend is unreachable on load: red banner at top "Cannot connect to backend at localhost:4000"
- Failed save: toast error "Failed to save — check your connection"
- Failed run: toast error with the error message from the API

### Execution Error State

- Node that errored: red border ring
- Execution drawer shows: `ERROR` badge + error message in red text
- Other nodes that didn't run: remain in idle (grey) state

### Validation Errors (Config Forms)

- Inline error messages below each field
- Run button disabled if the selected node has invalid config

---

## 17. Non-Functional Requirements

### Performance

- Initial page load (Vite prod build): < 2s on localhost
- Canvas should render 50+ nodes without lag (React Flow virtualizes by default)
- Config panel form updates should be instant (< 16ms) — no re-render of canvas
- SSE events should update node colors within 100ms of receipt

### Accessibility

- All interactive elements reachable via keyboard
- ARIA labels on icon-only buttons (Run, Save, Delete)
- Color is not the sole indicator of node status — icons/badges also used

### Browser Support

- Chrome 110+, Firefox 115+, Safari 16+, Edge 110+
- No IE11 support required

### Environment Variables

```env
# .env.example
VITE_API_URL=http://localhost:4000/api
```

---

## 18. Development Milestones

| Phase | Milestone | Key Deliverables | Duration |
|---|---|---|---|
| 1 | Scaffold | Vite + React setup, Tailwind, Router, Axios client, folder structure | 1–2 days |
| 2 | Home Page | Workflow list page, create/delete workflow, API integration | 1–2 days |
| 3 | Canvas Core | React Flow canvas, node palette, drag-to-create, edge connections | 3–4 days |
| 4 | Node Renderers | All 6 custom node components with BaseNode, status ring, config preview | 2–3 days |
| 5 | Config Forms | All 6 config panels with React Hook Form + Zod validation | 3 days |
| 6 | Execution & SSE | Run button, useSSE hook, ExecutionDrawer, real-time node status colors | 2–3 days |
| 7 | Polish | Empty states, error handling, keyboard shortcuts, toasts, unsaved-changes guard | 2 days |

**Total estimated frontend build time: ~3 weeks**

---

*AI Workflow Builder Frontend PRD v1.0 — Internal Use*
