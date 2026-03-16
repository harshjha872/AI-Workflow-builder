
import db from "../db/client.js";
import { ExecutionContext } from "../engine/context.js";
import { execQueue } from "./queue.js";

export async function addExecutionJob({executionId, nodeId, context, graph}:{executionId: string, nodeId: string, context: ExecutionContext, graph: any}) {
    console.log('Adding job to queue', { executionId, nodeId });
    try {
        await execQueue.add("execute_node", {
          executionId,
          nodeId,
          context,
          graph
        });
    }catch (err) {
        console.error('Error adding job to queue', err);
    }
}