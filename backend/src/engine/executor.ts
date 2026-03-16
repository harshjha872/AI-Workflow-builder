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
import Response from "express";
import { addExecutionJob } from "../queue/jobHelpers.js";

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
  context: any,
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
) {
  const nodesMap = new Map<string, GraphNode>();
  for (const node of graph.nodes) {
    nodesMap.set(node.id, node);
  }

  const executionOrder = getExecutionOrder(graph.nodes, graph.edges);
  const context = new ExecutionContext(input);
  const logs: NodeLogEntry[] = [];

  const node = graph.nodes.find((e: any) => e.type === "trigger");

  console.log(node, "node");
  
  if (node?.id) {
    await addExecutionJob({
      executionId,
      nodeId: node.id,
      context,
      graph,
    });
  }
}
