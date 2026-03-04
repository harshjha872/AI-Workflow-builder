import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { markSaved, setSaving } from '../store/workflowSlice';
import { WorkflowPayload, workflowsApi } from '../api/workflows';

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

export function useWorkflowSave() {
  const dispatch = useAppDispatch();
  const workflow = useAppSelector((s) => s.workflow);

  useEffect(() => {
    if (workflow.isSaved) return;

    const save = debounce(async () => {
      dispatch(setSaving(true));
      const payload = {
        name: workflow.name,
        graph: {
          nodes: workflow.nodes,
          edges: workflow.edges
        }
      } as WorkflowPayload;
      if (workflow.id) {
        await workflowsApi.update(workflow.id, payload);
        dispatch(markSaved(workflow.id));
      } else {
        const created = await workflowsApi.create(payload);
        dispatch(markSaved(created.id));
      }
    }, 800);

    save();
  }, [dispatch, workflow]);
}

