import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface ConditionConfigShape {
  expression: string;
  truePath: string;
  falsePath: string;
}

interface Props {
  config: ConditionConfigShape;
  onChange: (cfg: ConditionConfigShape) => void;
}

export function ConditionConfig({ config, onChange }: Props) {
  const { register, watch } = useForm<ConditionConfigShape>({
    defaultValues: config,
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as ConditionConfigShape));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        Condition
      </h2>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">Expression</span>
        <textarea
          {...register("expression")}
          rows={3}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 font-mono text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">
          True Path Node ID
        </span>
        <input
          {...register("truePath")}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">
          False Path Node ID
        </span>
        <input
          {...register("falsePath")}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
    </div>
  );
}
