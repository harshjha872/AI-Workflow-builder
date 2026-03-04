import { DragEvent } from 'react';
import { useReactFlow, XYPosition } from '@xyflow/react';
import { useAppDispatch } from '../store';
import { addNode, WorkflowNodeType } from '../store/workflowSlice';

export function useDrop() {
  const dispatch = useAppDispatch();
  const reactFlowInstance = useReactFlow();

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/node-type') as WorkflowNodeType | '';
    if (!type) return;

    const bounds = (event.target as HTMLElement).getBoundingClientRect();
    const position: XYPosition = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });

    dispatch(addNode({ type, position }));
  };

  return { onDragOver, onDrop };
}

