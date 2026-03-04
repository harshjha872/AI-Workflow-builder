import { BaseNode } from './BaseNode';

export function OutputNode(props: any) {
  const { data } = props;
  const { config } = data;

  return (
    <BaseNode {...props} showSourceHandle={false}>
      <div className="font-medium text-rose-700">Output</div>
      <div className="text-[11px] text-slate-600">
        {Array.isArray(config.outputKeys) ? config.outputKeys.join(', ') : ''}
      </div>
    </BaseNode>
  );
}

