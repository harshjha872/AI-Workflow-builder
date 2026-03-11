import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { executionsApi } from "../api/executions";
import { workflowsApi } from "../api/workflows";
import { Canvas } from "../components/canvas/Canvas";
import { NodePalette } from "../components/canvas/NodePalette";
import { ConfigPanel } from "../components/config/ConfigPanel";
import { ExecutionDrawer } from "../components/layout/ExecutionDrawer";
import { Toolbar } from "../components/layout/Toolbar";
import { useSSE } from "../hooks/useSSE";
import { useWorkflowSave } from "../hooks/useWorkflowSave";
import { useAppDispatch, useAppSelector } from "../store";
import { loadWorkflow } from "../store/workflowSlice";
import {
  openDrawer,
  resetExecution,
  startExecution,
  setNodeRunning,
  setNodeSuccess,
  setNodeError,
  setExecutionComplete,
  setExecutionError
} from "../store/executionSlice";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const executionId = useAppSelector((s) => s.execution.executionId);

  useSSE(executionId);
  useWorkflowSave();

  useEffect(() => {
    void (async () => {
      if (!id) {
        return;
      }
      const wf = await workflowsApi.get(id);
      dispatch(
        loadWorkflow({
          id: wf.id,
          name: wf.name,
          isSaved: true,
          isSaving: false,
          nodes: (wf as any).nodes ?? [],
          edges: (wf as any).edges ?? [],
          selectedNodeId: null,
        }),
      );
    })();
  }, [dispatch, id]);

  const workflow = useAppSelector((s) => s.workflow); // not ideal inside handler, but keeps example simple

  const handleRun = async () => {
    dispatch(resetExecution());
    dispatch(openDrawer());
    if (!workflow.id) return;

    // Extract dynamic inputs from the trigger node
    const triggerNode = workflow.nodes.find((n: any) => n.type === "trigger");
    const inputFields: Array<{ key: string; value: string }> =
      (triggerNode?.data?.config as any)?.inputFields || [];

    const executionInput = inputFields.reduce(
      (acc: Record<string, string>, field) => {
        if (field.key) {
          acc[field.key] = field.value;
        }
        return acc;
      },
      {},
    );

    // const res = await executionsApi.run(workflow.id, {});

    // example Api: https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true

    const response = await fetch("http://localhost:4000/api/executions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        workflowId: workflow.id,
        input: executionInput,
      }),
    });

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        let doubleNewlineIndex;
        while ((doubleNewlineIndex = buffer.indexOf("\n\n")) !== -1) {
          const event = buffer.slice(0, doubleNewlineIndex);
          buffer = buffer.slice(doubleNewlineIndex + 2);
          
          const lines = event.split("\n");
          let eventType = "";
          let eventData: any = null;
          
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                eventData = JSON.parse(line.slice(6));
              } catch (e) {
                console.error("Failed to parse SSE data", e);
              }
            }
          }
          
          if (eventType && eventData) {
            const payload = eventData.data || eventData; // Handle both wrapped and direct payloads
            
            if (eventType === "executionId") {
              dispatch(startExecution(payload.executionId));
            } else if (eventType === "node_start") {
              dispatch(setNodeRunning({ nodeId: payload.nodeId, nodeType: payload.nodeType }));
            } else if (eventType === "node_success") {
              dispatch(setNodeSuccess({ nodeId: payload.nodeId, output: payload.output }));
            } else if (eventType === "node_error") {
              dispatch(setNodeError({ nodeId: payload.nodeId, error: payload.error }));
            } else if (eventType === "execution_complete") {
              dispatch(setExecutionComplete(payload.output));
            } else if (eventType === "execution_error") {
              dispatch(setExecutionError(payload.error));
            }
          }
        }
      }
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Toolbar onRun={() => void handleRun()} />
      <div className="flex flex-1">
        <NodePalette />
        <Canvas />
        <ConfigPanel />
      </div>
      <ExecutionDrawer />
    </div>
  );
}
