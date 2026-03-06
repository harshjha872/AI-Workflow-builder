import { ExecutionContext } from "./context.js";
import { getExecutionOrder, GraphNode, GraphEdge } from "./dag.js";
import { deepInterpolate } from "./interpolate.js";
import { sseManager } from "../sse/sseManager.js";
import { NodeExecutionError } from "../errors.js";
import logger from "../middleware/requestLogger.js";
import { execute as executeTrigger, TriggerConfig } from "./nodes/trigger.js";
import { execute as executeLLMCall, LLMCallConfig } from "./nodes/llmCall.js";
import {
  execute as executeHttpRequest,
  HttpRequestConfig,
} from "./nodes/httpRequest.js";
import {
  execute as executeCondition,
  ConditionConfig,
} from "./nodes/condition.js";
import {
  execute as executeTransform,
  TransformConfig,
} from "./nodes/transform.js";
import { execute as executeOutput, OutputConfig } from "./nodes/output.js";
import Response from 'express';

export interface WorkflowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface NodeLogEntry {
  nodeId: string;
  nodeType: string;
  status: "SUCCESS" | "ERROR";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  output: unknown;
  error: string | null;
}

type NodeConfig =
  | TriggerConfig
  | LLMCallConfig
  | HttpRequestConfig
  | ConditionConfig
  | TransformConfig
  | OutputConfig;

type NodeExecutorFn = (
  config:
    | TriggerConfig
    | LLMCallConfig
    | HttpRequestConfig
    | ConditionConfig
    | TransformConfig
    | OutputConfig,
  context: ExecutionContext,
) => Promise<Record<string, unknown>>;

const nodeExecutors: Record<string, NodeExecutorFn> = {
  trigger: executeTrigger as NodeExecutorFn,
  llmCall: executeLLMCall as NodeExecutorFn,
  httpRequest: executeHttpRequest as NodeExecutorFn,
  condition: executeCondition as NodeExecutorFn,
  transform: executeTransform as NodeExecutorFn,
  output: executeOutput as NodeExecutorFn,
};

export async function executeWorkflow(
  executionId: string,
  graph: WorkflowGraph,
  input: Record<string, unknown>,
  response?: any,
  callbacks?: {
    onNodeStart?: (nodeId: string, nodeType: string, label: string) => void;
    onNodeSuccess?: (
      nodeId: string,
      output: unknown,
      durationMs: number,
    ) => void;
    onNodeError?: (nodeId: string, error: string) => void;
    onComplete?: (status: string, output: unknown) => void;
    onError?: (status: string, error: string) => void;
  },
): Promise<{ output: unknown; logs: NodeLogEntry[] }> {

  const nodesMap = new Map<string, GraphNode>();
  for (const node of graph.nodes) {
    nodesMap.set(node.id, node);
  }

  const executionOrder = getExecutionOrder(graph.nodes, graph.edges);
  const context = new ExecutionContext(input);
  const logs: NodeLogEntry[] = [];

  for (const nodeId of executionOrder) {
    const node = nodesMap.get(nodeId);
    if (!node) continue;

    const executor = nodeExecutors[node.type];
    if (!executor) {
      throw new NodeExecutionError(nodeId, `Unknown node type: ${node.type}`);
    }

    const resolvedConfig = deepInterpolate(
      node.data.config,
      context.data,
    ) as NodeConfig;
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    callbacks?.onNodeStart?.(nodeId, node.type, node.data.label);
    sseManager.emitFromPost(executionId, "node_start", {
      nodeId,
      nodeType: node.type,
      label: node.data.label,
    }, response);

    try {
      const result = await executor(resolvedConfig, context);

      for (const [key, value] of Object.entries(result)) {
        context.set(key, value);
      }

      const durationMs = Date.now() - startTime;
      const finishedAt = new Date().toISOString();

      logs.push({
        nodeId,
        nodeType: node.type,
        status: "SUCCESS",
        startedAt,
        finishedAt,
        durationMs,
        output: result,
        error: null,
      });

      callbacks?.onNodeSuccess?.(nodeId, result, durationMs);
      sseManager.emitFromPost(executionId, "node_success", {
        nodeId,
        output: result,
        durationMs,
      }, response);

      logger.debug(
        { nodeId, nodeType: node.type, durationMs },
        "Node executed successfully",
      );
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const finishedAt = new Date().toISOString();
      const errorMessage = err instanceof Error ? err.message : String(err);

      logs.push({
        nodeId,
        nodeType: node.type,
        status: "ERROR",
        startedAt,
        finishedAt,
        durationMs,
        output: null,
        error: errorMessage,
      });

      callbacks?.onNodeError?.(nodeId, errorMessage);
      sseManager.emitFromPost(executionId, "node_error", {
        nodeId,
        error: errorMessage,
      }, response);

      logger.error(
        { nodeId, nodeType: node.type, err },
        "Node execution failed",
      );

      if (err instanceof NodeExecutionError) throw err;
      throw new NodeExecutionError(nodeId, errorMessage);
    }
  }

  const finalOutput = context.get("result") ?? context.snapshot();

  callbacks?.onComplete?.("SUCCESS", finalOutput);
  sseManager.emitFromPost(executionId, "execution_complete", {
    status: "SUCCESS",
    output: finalOutput,
  }, response);

  return { output: finalOutput, logs };
}
