import { BaseNode } from './BaseNode';

export function TriggerNode(props: any) {
  return (
    <BaseNode {...props} showTargetHandle={false}>
      <div className="text-emerald-600">Manual Start</div>
    </BaseNode>
  );
}

