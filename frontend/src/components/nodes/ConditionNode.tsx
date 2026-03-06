import { BaseNode } from "./BaseNode";

export function ConditionNode(props: any) {
  const { data } = props;
  const { config } = data;

  return (
    <BaseNode {...props}>
      <div className="font-medium text-amber-700 dark:text-amber-400">
        Condition
      </div>
      <div className="line-clamp-2 text-[11px] text-slate-600 dark:text-zinc-400">
        {config.expression}
      </div>
    </BaseNode>
  );
}
