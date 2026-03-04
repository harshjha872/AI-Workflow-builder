import db from '../client.js';

export interface WorkflowGraph {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      config: Record<string, unknown>;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  graph: WorkflowGraph;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowRow {
  id: string;
  name: string;
  description: string;
  graph: string;
  created_at: string;
  updated_at: string;
}

function rowToWorkflow(row: WorkflowRow): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    graph: JSON.parse(row.graph) as WorkflowGraph,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToSummary(row: WorkflowRow): WorkflowSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const listStmt = db.prepare('SELECT id, name, description, created_at, updated_at FROM workflows ORDER BY updated_at DESC');
const getByIdStmt = db.prepare('SELECT * FROM workflows WHERE id = ?');
const insertStmt = db.prepare('INSERT INTO workflows (id, name, description, graph) VALUES (?, ?, ?, ?)');
const updateStmt = db.prepare("UPDATE workflows SET name = ?, description = ?, graph = ?, updated_at = datetime('now') WHERE id = ?");
const deleteStmt = db.prepare('DELETE FROM workflows WHERE id = ?');

export function getAllWorkflows(): WorkflowSummary[] {
  const rows = listStmt.all() as WorkflowRow[];
  return rows.map(rowToSummary);
}

export function getWorkflowById(id: string): Workflow | undefined {
  const row = getByIdStmt.get(id) as WorkflowRow | undefined;
  return row ? rowToWorkflow(row) : undefined;
}

export function createWorkflow(input: {
  id: string;
  name: string;
  description: string;
  graph: WorkflowGraph;
}): Workflow {
  insertStmt.run(input.id, input.name, input.description, JSON.stringify(input.graph));
  return getWorkflowById(input.id)!;
}

export function updateWorkflow(
  id: string,
  input: { name: string; description: string; graph: WorkflowGraph }
): Workflow {
  updateStmt.run(input.name, input.description, JSON.stringify(input.graph), id);
  return getWorkflowById(id)!;
}

export function deleteWorkflow(id: string): void {
  deleteStmt.run(id);
}
