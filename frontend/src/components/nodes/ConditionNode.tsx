import { BaseNode } from './BaseNode';

export function ConditionNode(props: any) {
  const { data } = props;
  const { config } = data;

  return (
    <BaseNode {...props}>
      <div className="font-medium text-amber-700">Condition</div>
      <div className="line-clamp-2 text-[11px] text-slate-600">{config.expression}</div>
    </BaseNode>
  );
}

