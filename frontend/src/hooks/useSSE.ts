import { useEffect } from 'react';
import { useAppDispatch } from '../store';
import {
  setExecutionComplete,
  setExecutionError,
  setNodeError,
  setNodeRunning,
  setNodeSuccess
} from '../store/executionSlice';

export function useSSE(executionId: string | null) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!executionId) return;

    const es = new EventSource(`http://localhost:4000/api/executions/${executionId}/stream`);

    es.addEventListener('node_start', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { nodeId: string };
      dispatch(setNodeRunning(data.nodeId));
    });

    es.addEventListener('node_success', (e) => {
      const d = JSON.parse((e as MessageEvent).data) as {
        nodeId: string;
        output?: unknown;
        durationMs?: number;
      };
      dispatch(setNodeSuccess({ nodeId: d.nodeId, output: d.output, durationMs: d.durationMs }));
    });

    es.addEventListener('node_error', (e) => {
      const d = JSON.parse((e as MessageEvent).data) as {
        nodeId: string;
        error: string;
      };
      dispatch(setNodeError({ nodeId: d.nodeId, error: d.error }));
    });

    es.addEventListener('execution_complete', (e) => {
      const d = JSON.parse((e as MessageEvent).data) as { output: unknown };
      dispatch(setExecutionComplete(d.output));
    });

    es.addEventListener('execution_error', (e) => {
      const d = JSON.parse((e as MessageEvent).data) as { error: string };
      dispatch(setExecutionError(d.error));
    });

    return () => es.close();
  }, [dispatch, executionId]);
}

