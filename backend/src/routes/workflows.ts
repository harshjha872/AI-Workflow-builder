import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import {
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from '../db/queries/workflows.js';
import { WorkflowNotFoundError } from '../errors.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const workflowSchema = z.object({
  name: z.string().min(1).max(100),
  graph: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.object({
        label: z.string(),
        config: z.record(z.unknown()),
      }),
    })).min(1),
    edges: z.array(z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
    })),
  }),
});

router.get('/', asyncHandler(async (_req, res) => {
  const workflows = getAllWorkflows();
  res.json(workflows);
}));

router.post('/', validate(workflowSchema), asyncHandler(async (req, res) => {
  const { name, description, graph } = req.body;
  const workflow = createWorkflow({
    id: crypto.randomUUID(),
    name,
    description,
    graph,
  });
  res.status(201).json(workflow);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const workflow = getWorkflowById(req.params.id as string);
  if (!workflow) {
    throw new WorkflowNotFoundError(req.params.id as string);
  }
  res.json(workflow);
}));

router.put('/:id', validate(workflowSchema), asyncHandler(async (req, res) => {
  const existing = getWorkflowById(req.params.id as string);
  if (!existing) {
    throw new WorkflowNotFoundError(req.params.id as string);
  }
  const { name, description, graph } = req.body;
  const updated = updateWorkflow(req.params.id as string, { name, description, graph });
  res.json(updated);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  deleteWorkflow(req.params.id as string);
  res.status(204).end();
}));

export default router;
