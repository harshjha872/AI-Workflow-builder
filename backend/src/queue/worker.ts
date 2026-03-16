import {
  TriggerConfig,
  execute as executeTrigger,
} from "../engine/nodes/trigger.js";
import {
  LLMCallConfig,
  execute as executeLLMCall,
} from "../engine/nodes/llmCall.js";
import {
  HttpRequestConfig,
  execute as executeHttpRequest,
} from "../engine/nodes/httpRequest.js";
import {
  ConditionConfig,
  execute as executeCondition,
} from "../engine/nodes/condition.js";
import {
  TransformConfig,
  execute as executeTransform,
} from "../engine/nodes/transform.js";
import {
  OutputConfig,
  execute as executeOutput,
} from "../engine/nodes/output.js";
import { ExecutionContext } from "../engine/context.js";
import { Worker } from "bullmq";
import { deepInterpolate } from "../engine/interpolate.js";
import { execQueue } from "./queue.js";
import { sseManager } from "../sse/sseManager.js";
import { NodeExecutionError } from "../errors.js";
import { connection } from "../config/redis.js";

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

export const worker = new Worker(
  "execution",
  async (job) => {
    const { executionId, nodeId, context, graph } = job.data;

    const node = graph.nodes.find((n: any) => n.id === nodeId);

    console.log("Worker processing node", {
      executionId,
      nodeId,
      nodeType: node?.type,
      context: context.data,
    });

    if (!node) {
      console.error("Node not found", { executionId, nodeId });
      return;
    }

    console.log("Processing node", node.type);

    // Stream node start
    sseManager.emit(executionId, "node_start", {
      nodeId,
      nodeType: node.type,
      label: node.data.label,
    });

    const resolvedConfig = deepInterpolate(
      node.data.config,
      context.data,
    ) as NodeConfig;

    try {
      const startedAt = new Date().toISOString();
      const startTime = Date.now();

      // Execute node
      const result = await nodeExecutors[node.type](resolvedConfig, context);

      const durationMs = Date.now() - startTime;

      // Update context
      for (const [key, value] of Object.entries(result)) {
        context.data[key] = value;
      }

      sseManager.emit(executionId, "node_success", {
        nodeId,
        output: result,
        durationMs,
      });

      // Find next node
      const nextNodeId = getNextNodeId({
        graph,
        currentNodeId: nodeId,
        nodeResult: result,
      });

      // Enqueue next node or finalize
      if (nextNodeId) {
        await execQueue.add("node", {
          executionId,
          nodeId: nextNodeId,
          context,
          graph,
        });
      } else {
        const finalOutput = context.data["result"] ?? context.data;

        sseManager.emit(executionId, "execution_complete", {
          status: "SUCCESS",
          output: finalOutput,
        });
      }
    } catch (err) {
      console.log(err, "Error executing node");
      const errorMessage = err instanceof Error ? err.message : String(err);

      sseManager.emit(executionId, "node_error", {
        nodeId,
        error: errorMessage,
      });

      if (err instanceof NodeExecutionError) throw err;
      throw new NodeExecutionError(nodeId, errorMessage);
    }
  },
  {
    connection: connection,
    concurrency: 5,
  },
);

function getNextNodeId({
  graph,
  currentNodeId,
  nodeResult,
}: {
  graph: any;
  currentNodeId: string;
  nodeResult: any;
}): string | null {
  const outgoingEdges = graph.edges.filter(
    (e: any) => e.source === currentNodeId,
  );

  // no outgoing edges = terminal node (Output)
  if (outgoingEdges.length === 0) return null;

  // normal node — single outgoing edge
  if (outgoingEdges.length === 1) return outgoingEdges[0].target;

  // condition node — result tells us which branch to take
  // condition executor returns the winning nodeId directly
  if (outgoingEdges.some((e: any) => e.target === nodeResult._nextNodeId)) {
    return nodeResult._nextNodeId;
  }

  // fallback — take the first edge (shouldn't reach here)
  return outgoingEdges[0].target;
}
