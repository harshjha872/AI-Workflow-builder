import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface TriggerConfigProps {
  config: { triggerType: string; inputSchema: string };
  onChange: (cfg: TriggerConfigProps["config"]) => void;
}

export function TriggerConfig({ config, onChange }: TriggerConfigProps) {
  const { register, watch } = useForm<TriggerConfigProps["config"]>({
    defaultValues: config,
  });

  useEffect(() => {
    const sub = watch((values) =>
      onChange(values as TriggerConfigProps["config"]),
    );
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
        Trigger
      </h2>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Trigger Type</span>
        <select
          {...register("triggerType")}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        >
          <option value="manual">Manual</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Input Schema</span>
        <textarea
          {...register("inputSchema")}
          rows={4}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 font-mono text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
    </div>
  );
}
