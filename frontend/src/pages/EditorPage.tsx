import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { executionsApi } from '../api/executions';
import { workflowsApi } from '../api/workflows';
import { Canvas } from '../components/canvas/Canvas';
import { NodePalette } from '../components/canvas/NodePalette';
import { ConfigPanel } from '../components/config/ConfigPanel';
import { ExecutionDrawer } from '../components/layout/ExecutionDrawer';
import { Toolbar } from '../components/layout/Toolbar';
import { useSSE } from '../hooks/useSSE';
import { useWorkflowSave } from '../hooks/useWorkflowSave';
import { useAppDispatch, useAppSelector } from '../store';
import { loadWorkflow } from '../store/workflowSlice';
import { openDrawer, resetExecution, startExecution } from '../store/executionSlice';

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
          selectedNodeId: null
        })
      );
    })();
  }, [dispatch, id]);
  
  const workflow = useAppSelector((s) => s.workflow); // not ideal inside handler, but keeps example simple
  
  const handleRun = async () => {
    dispatch(resetExecution());
    dispatch(openDrawer());
    if (!workflow.id) return;
    const res = await executionsApi.run(workflow.id, {});
    dispatch(startExecution(res.executionId));
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

