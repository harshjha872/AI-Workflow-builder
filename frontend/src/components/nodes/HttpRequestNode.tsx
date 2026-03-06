import { BaseNode } from "./BaseNode";

export function HttpRequestNode(props: any) {
  const { data } = props;
  const { config } = data;

  return (
    <BaseNode {...props}>
      <div className="font-medium text-sky-700 dark:text-sky-400">
        {config.method}
      </div>
      <div className="line-clamp-2 text-[11px] text-slate-600 dark:text-slate-400">
        {config.url}
      </div>
    </BaseNode>
  );
}
