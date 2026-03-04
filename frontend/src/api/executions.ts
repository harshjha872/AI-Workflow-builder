import client from './client';

export interface RunExecutionResponse {
  executionId: string;
}

export const executionsApi = {
  run: async (workflowId: string, input: unknown) =>
    client.post<RunExecutionResponse>('/executions', { workflowId, input }).then((r) => r.data),
  get: async (id: string) => client.get(`/executions/${id}`).then((r) => r.data),
  history: async (workflowId: string) =>
    client.get(`/workflows/${workflowId}/executions`).then((r) => r.data)
};

