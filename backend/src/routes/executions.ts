import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import {
  createExecution,
  getExecutionById,
  updateExecution,
  getExecutionsByWorkflowId,
} from '../db/queries/executions.js';
import { getWorkflowById } from '../db/queries/workflows.js';
import { executeWorkflow } from '../engine/executor.js';
import { sseManager } from '../sse/sseManager.js';
import { WorkflowNotFoundError, ExecutionNotFoundError } from '../errors.js';
import logger from '../middleware/requestLogger.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const createExecutionSchema = z.object({
  workflowId: z.string().uuid(),
  input: z.record(z.unknown()).optional().default({}),
});

router.post('/', validate(createExecutionSchema), asyncHandler(async (req, res) => {
  const { workflowId, input } = req.body;

  const workflow = getWorkflowById(workflowId);

  if (!workflow) {
    throw new WorkflowNotFoundError(workflowId);
  }

  const executionId = crypto.randomUUID();
  createExecution({ id: executionId, workflowId, input });

  res.status(202).json({ executionId });

  const startedAt = new Date().toISOString();
  updateExecution(executionId, { status: 'RUNNING', startedAt });

  executeWorkflow(executionId, workflow.graph, input)
    .then(({ output, logs }) => {
      updateExecution(executionId, {
        status: 'SUCCESS',
        output,
        logs,
        finishedAt: new Date().toISOString(),
      });
    })
    .catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error({ executionId, err }, 'Workflow execution failed');
      updateExecution(executionId, {
        status: 'ERROR',
        error: errorMessage,
        finishedAt: new Date().toISOString(),
      });
      sseManager.emit(executionId, 'execution_error', {
        status: 'ERROR',
        error: errorMessage,
      });
    })
    .finally(() => {
      sseManager.close(executionId);
    });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const execution = getExecutionById(req.params.id as string);
  if (!execution) {
    throw new ExecutionNotFoundError(req.params.id as string);
  }
  res.json(execution);
}));

router.get('/:id/stream', (req: Request, res: Response) => {
  const executionId = req.params.id as string;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseManager.register(executionId, res);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.close(executionId);
  });
});

router.get('/by-workflow/:workflowId', asyncHandler(async (req, res) => {
  const executions = getExecutionsByWorkflowId(req.params.workflowId as string);
  res.json(executions);
}));

export default router;
