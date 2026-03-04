import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { Edge, Node, XYPosition } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { NODE_DEFAULTS } from '../utils/nodeDefaults';

export type WorkflowNodeType = 'trigger' | 'llmCall' | 'httpRequest' | 'condition' | 'transform' | 'output';

export interface WorkflowMetadata {
  id: string | null;
  name: string;
  isSaved: boolean;
  isSaving: boolean;
}

export interface WorkflowState extends WorkflowMetadata {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
}

const initialState: WorkflowState = {
  id: null,
  name: 'Untitled',
  isSaved: true,
  isSaving: false,
  nodes: [],
  edges: [],
  selectedNodeId: null
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
      state.isSaved = false;
    },
    setNodes(state, action: PayloadAction<Node[]>) {
      state.nodes = action.payload;
      state.isSaved = false;
    },
    setEdges(state, action: PayloadAction<Edge[]>) {
      state.edges = action.payload;
      state.isSaved = false;
    },
    addNode(state, action: PayloadAction<{ type: WorkflowNodeType; position: XYPosition }>) {
      const { type, position } = action.payload;
      const id = nanoid();
      const data = {
        label: type,
        config: NODE_DEFAULTS[type]
      };
      state.nodes.push({
        id,
        type,
        position,
        data
      } as Node);
      state.selectedNodeId = id;
      state.isSaved = false;
    },
    updateNodeConfig(state, action: PayloadAction<{ nodeId: string; config: unknown }>) {
      const { nodeId, config } = action.payload;
      const node = state.nodes.find((n) => n.id === nodeId);
      if (node) {
        node.data = { ...node.data, config };
        state.isSaved = false;
      }
    },
    deleteNode(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.nodes = state.nodes.filter((n) => n.id !== id);
      state.edges = state.edges.filter((e) => e.source !== id && e.target !== id);
      if (state.selectedNodeId === id) {
        state.selectedNodeId = null;
      }
      state.isSaved = false;
    },
    setSelectedNodeId(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },
    loadWorkflow(state, action: PayloadAction<WorkflowState>) {
      return { ...action.payload, isSaved: true, isSaving: false };
    },
    markSaved(state, action: PayloadAction<string>) {
      state.id = action.payload;
      state.isSaved = true;
      state.isSaving = false;
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload;
    }
  }
});

export const {
  setName,
  setNodes,
  setEdges,
  addNode,
  updateNodeConfig,
  deleteNode,
  setSelectedNodeId,
  loadWorkflow,
  markSaved,
  setSaving
} = workflowSlice.actions;

export default workflowSlice.reducer;

