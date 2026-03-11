import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export type ExecutionStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR';
export type NodeExecutionStatus = 'RUNNING' | 'SUCCESS' | 'ERROR';

export interface ExecutionLogEntry {
  nodeId: string;
  type: string;
  nodeType?: string;
  status: NodeExecutionStatus;
  output?: unknown;
  durationMs?: number;
  error?: string;
  startedAt?: string;
}

export interface ExecutionState {
  executionId: string | null;
  status: ExecutionStatus;
  isDrawerOpen: boolean;
  nodeStatuses: Record<string, NodeExecutionStatus>;
  logs: ExecutionLogEntry[];
  output: unknown;
  error?: string;
}

const initialState: ExecutionState = {
  executionId: null,
  status: 'IDLE',
  isDrawerOpen: false,
  nodeStatuses: {},
  logs: [],
  output: null
};

const executionSlice = createSlice({
  name: 'execution',
  initialState,
  reducers: {
    resetExecution() {
      return initialState;
    },
    openDrawer(state) {
      state.isDrawerOpen = true;
    },
    closeDrawer(state) {
      state.isDrawerOpen = false;
    },
    startExecution(state, action: PayloadAction<string>) {
      state.executionId = action.payload;
      state.status = 'RUNNING';
      state.isDrawerOpen = true;
    },
    setNodeRunning(state, action: PayloadAction<{ nodeId: string; nodeType: string }>) {
      const { nodeId, nodeType } = action.payload;
      state.nodeStatuses[nodeId] = 'RUNNING';
      state.logs.push({
        nodeId,
        type: 'node_start',
        nodeType,
        status: 'RUNNING',
        startedAt: new Date().toISOString()
      });
    },
    setNodeSuccess(
      state,
      action: PayloadAction<{ nodeId: string; output?: unknown; durationMs?: number }>
    ) {
      const { nodeId, output, durationMs } = action.payload;
      state.nodeStatuses[nodeId] = 'SUCCESS';
      state.logs.push({
        nodeId,
        type: 'node_success',
        status: 'SUCCESS',
        output,
        durationMs
      });
    },
    setNodeError(state, action: PayloadAction<{ nodeId: string; error: string }>) {
      const { nodeId, error } = action.payload;
      state.nodeStatuses[nodeId] = 'ERROR';
      state.logs.push({
        nodeId,
        type: 'node_error',
        status: 'ERROR',
        error
      });
      state.status = 'ERROR';
      state.error = error;
    },
    setExecutionComplete(state, action: PayloadAction<unknown>) {
      state.status = 'SUCCESS';
      state.output = action.payload;
    },
    setExecutionError(state, action: PayloadAction<string>) {
      state.status = 'ERROR';
      state.error = action.payload;
    }
  }
});

export const {
  resetExecution,
  openDrawer,
  closeDrawer,
  startExecution,
  setNodeRunning,
  setNodeSuccess,
  setNodeError,
  setExecutionComplete,
  setExecutionError
} = executionSlice.actions;

export default executionSlice.reducer;

