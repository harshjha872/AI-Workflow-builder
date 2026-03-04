import { BaseNode } from './BaseNode';

export function LLMCallNode(props: any) {
  const { data } = props;
  const { config } = data;

  return (
    <BaseNode {...props}>
      <div className="font-medium text-indigo-700">
        {config.provider} · {config.model}
      </div>
      <div className="line-clamp-2 text-[11px] text-slate-600">{config.userPrompt}</div>
    </BaseNode>
  );
}

