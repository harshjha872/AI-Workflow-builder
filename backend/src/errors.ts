export class WorkflowNotFoundError extends Error {
  public status = 404;
  public code = 'WORKFLOW_NOT_FOUND';

  constructor(workflowId: string) {
    super(`Workflow not found: ${workflowId}`);
    this.name = 'WorkflowNotFoundError';
  }
}

export class ExecutionNotFoundError extends Error {
  public status = 404;
  public code = 'EXECUTION_NOT_FOUND';

  constructor(executionId: string) {
    super(`Execution not found: ${executionId}`);
    this.name = 'ExecutionNotFoundError';
  }
}

export class CycleDetectedError extends Error {
  public status = 422;
  public code = 'CYCLE_DETECTED';

  constructor(message = 'Cycle detected in workflow graph') {
    super(message);
    this.name = 'CycleDetectedError';
  }
}

export class NodeExecutionError extends Error {
  public status = 500;
  public code = 'NODE_EXECUTION_ERROR';
  public nodeId: string;

  constructor(nodeId: string, message: string) {
    super(message);
    this.name = 'NodeExecutionError';
    this.nodeId = nodeId;
  }
}

export class TransformTimeoutError extends NodeExecutionError {
  public override code = 'TRANSFORM_TIMEOUT';

  constructor(nodeId: string) {
    super(nodeId, `Transform node timed out: ${nodeId}`);
    this.name = 'TransformTimeoutError';
  }
}

export class HttpNodeError extends NodeExecutionError {
  public override code = 'HTTP_NODE_ERROR';

  constructor(nodeId: string, message: string) {
    super(nodeId, message);
    this.name = 'HttpNodeError';
  }
}

export class ValidationError extends Error {
  public status = 400;
  public code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
