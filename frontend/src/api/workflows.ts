import client from './client';

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  executionCount?: number;
}

export interface WorkflowPayload {
  name: string;
  graph: {
    nodes: unknown[];
    edges: unknown[];
  }
}

export const workflowsApi = {
  list: async (): Promise<WorkflowSummary[]> =>
    client.get('/workflows').then((r) => r.data),
  get: async (id: string): Promise<WorkflowPayload & { id: string }> =>
    client.get(`/workflows/${id}`).then((r) => r.data),
  create: async (payload: WorkflowPayload) =>
    client.post('/workflows', payload).then((r) => r.data),
  update: async (id: string, data: WorkflowPayload) =>
    client.put(`/workflows/${id}`, data).then((r) => r.data),
  delete: async (id: string) => client.delete(`/workflows/${id}`)
};

