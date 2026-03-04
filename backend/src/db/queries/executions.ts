import db from '../client.js';

export interface Execution {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  input: Record<string, unknown>;
  output: unknown;
  logs: unknown[];
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

export interface ExecutionSummary {
  id: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
}

interface ExecutionRow {
  id: string;
  workflow_id: string;
  status: string;
  input: string;
  output: string | null;
  logs: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
}

function rowToExecution(row: ExecutionRow): Execution {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    status: row.status as Execution['status'],
    input: JSON.parse(row.input) as Record<string, unknown>,
    output: row.output ? JSON.parse(row.output) : null,
    logs: JSON.parse(row.logs) as unknown[],
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    error: row.error,
  };
}

function rowToSummary(row: ExecutionRow): ExecutionSummary {
  const startedAt = row.started_at;
  const finishedAt = row.finished_at;
  let durationMs: number | null = null;
  if (startedAt && finishedAt) {
    durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  }
  return {
    id: row.id,
    status: row.status,
    startedAt,
    finishedAt,
    durationMs,
  };
}

const insertStmt = db.prepare(
  'INSERT INTO executions (id, workflow_id, input) VALUES (?, ?, ?)'
);
const getByIdStmt = db.prepare('SELECT * FROM executions WHERE id = ?');
const getByWorkflowIdStmt = db.prepare(
  'SELECT * FROM executions WHERE workflow_id = ? ORDER BY started_at DESC'
);

export function createExecution(input: {
  id: string;
  workflowId: string;
  input: Record<string, unknown>;
}): Execution {
  insertStmt.run(input.id, input.workflowId, JSON.stringify(input.input));
  return getExecutionById(input.id)!;
}

export function getExecutionById(id: string): Execution | undefined {
  const row = getByIdStmt.get(id) as ExecutionRow | undefined;
  return row ? rowToExecution(row) : undefined;
}

export function updateExecution(
  id: string,
  updates: Partial<{
    status: string;
    output: unknown;
    logs: unknown[];
    startedAt: string;
    finishedAt: string;
    error: string;
  }>
): void {
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    values.push(updates.status);
  }
  if (updates.output !== undefined) {
    setClauses.push('output = ?');
    values.push(JSON.stringify(updates.output));
  }
  if (updates.logs !== undefined) {
    setClauses.push('logs = ?');
    values.push(JSON.stringify(updates.logs));
  }
  if (updates.startedAt !== undefined) {
    setClauses.push('started_at = ?');
    values.push(updates.startedAt);
  }
  if (updates.finishedAt !== undefined) {
    setClauses.push('finished_at = ?');
    values.push(updates.finishedAt);
  }
  if (updates.error !== undefined) {
    setClauses.push('error = ?');
    values.push(updates.error);
  }

  if (setClauses.length === 0) return;

  values.push(id);
  const sql = `UPDATE executions SET ${setClauses.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);
}

export function getExecutionsByWorkflowId(workflowId: string): ExecutionSummary[] {
  const rows = getByWorkflowIdStmt.all(workflowId) as ExecutionRow[];
  return rows.map(rowToSummary);
}
