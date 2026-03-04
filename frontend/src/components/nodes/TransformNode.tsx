import { BaseNode } from './BaseNode';

export function TransformNode(props: any) {
  const { data } = props;
  const { config } = data;

  return (
    <BaseNode {...props}>
      <div className="font-medium text-purple-700">JS Transform</div>
      <div className="line-clamp-2 text-[11px] text-slate-600">{config.code}</div>
    </BaseNode>
  );
}

