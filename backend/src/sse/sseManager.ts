import { Response } from 'express';

class SSEManager {
  private connections = new Map<string, Response>();

  register(executionId: string, res: Response): void {
    this.connections.set(executionId, res);
  }

  emit(executionId: string, eventType: string, data: unknown): void {
    const res = this.connections.get(executionId);
    if (res) {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  close(executionId: string): void {
    const res = this.connections.get(executionId);
    if (res) {
      res.end();
      this.connections.delete(executionId);
    }
  }

  has(executionId: string): boolean {
    return this.connections.has(executionId);
  }

  emitFromPost(executionId: string, eventType: string, data:unknown, res: any) {
    if(res) {
       res.write(`event: ${eventType}\n`);
       res.write(`data: ${JSON.stringify({ data, executionId})}\n\n`);
    }
  }
}

export const sseManager = new SSEManager();
