import {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect } from "react";
import { useDrop } from "../../hooks/useDrop";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  setEdges,
  setNodes,
  setSelectedNodeId,
  updateNodeConfig,
} from "../../store/workflowSlice";
import { BaseNode } from "../nodes/BaseNode";
import { TriggerNode } from "../nodes/TriggerNode";
import { LLMCallNode } from "../nodes/LLMCallNode";
import { HttpRequestNode } from "../nodes/HttpRequestNode";
import { ConditionNode } from "../nodes/ConditionNode";
import { TransformNode } from "../nodes/TransformNode";
import { OutputNode } from "../nodes/OutputNode";
import { CustomEdge } from "../edges/BaseEdge";

const nodeTypes = {
  trigger: TriggerNode,
  llmCall: LLMCallNode,
  httpRequest: HttpRequestNode,
  condition: ConditionNode,
  transform: TransformNode,
  output: OutputNode,
  base: BaseNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

function InnerCanvas() {
  const dispatch = useAppDispatch();
  const workflow = useAppSelector((s) => s.workflow);
  const [nodes, setLocalNodes, onNodesChange] = useNodesState(
    workflow.nodes as Node[],
  );
  const [edges, setLocalEdges, onEdgesChange] = useEdgesState(
    workflow.edges as Edge[],
  );
  const { onDragOver, onDrop } = useDrop();

  useEffect(() => {
    setLocalNodes(workflow.nodes as Node[]);
    setLocalEdges(workflow.edges as Edge[]);
  }, [setLocalEdges, setLocalNodes, workflow.edges, workflow.nodes]);

  const handleConnect = (connection: Edge | any) => {
    const newEdges = addEdge(connection, edges);
    setLocalEdges(newEdges);
    dispatch(setEdges(newEdges));

    const sourceNode = nodes.find((n) => n.id === connection.source);
    if (sourceNode?.type === "condition") {
      const config = { ...(sourceNode.data.config as Record<string, any>) };
      if (connection.sourceHandle === "true") {
        config.truePath = connection.target;
      } else if (connection.sourceHandle === "false") {
        config.falsePath = connection.target;
      } else if (connection.sourceHandle === "error") {
        config.errorPath = connection.target;
      }
      dispatch(updateNodeConfig({ nodeId: sourceNode.id, config }));
    }
  };

  const handleNodesChange = (changes: any) => {
    onNodesChange(changes);
    dispatch(setNodes(nodes));
  };

  const handleEdgesChange = (changes: any) => {
    onEdgesChange(changes);
    dispatch(setEdges(edges));
  };

  return (
    <div className="flex-1">
      <ReactFlow
        colorMode="dark"
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => {
          dispatch(setSelectedNodeId(null));
          setTimeout(() => {
            dispatch(setSelectedNodeId(node.id));
          }, 100);
        }}
        onPaneClick={() => dispatch(setSelectedNodeId(null))}
        onDragOver={onDragOver}
        onDrop={onDrop}
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
          style: {
            stroke: "#d4d4d8",
            // strokeWidth: 2,
            // strokeDasharray: "4 4",
          },
        }}
        connectionLineStyle={{
          stroke: "#d4d4d8",
          // strokeWidth: 2,
          // strokeDasharray: "2 6",
        }}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <InnerCanvas />
    </ReactFlowProvider>
  );
}
