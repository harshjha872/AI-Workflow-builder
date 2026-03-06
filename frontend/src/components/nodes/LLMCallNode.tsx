import { BaseNode } from "./BaseNode";

export function LLMCallNode(props: any) {
  const { data } = props;
  const { config } = data;

  return (
    <BaseNode {...props}>
      <div className="font-medium text-indigo-700 dark:text-indigo-400">
        {config.provider} · {config.model}
      </div>
      <div className="line-clamp-2 text-[11px] text-slate-600 dark:text-slate-400">
        {config.userPrompt}
      </div>
    </BaseNode>
  );
}
