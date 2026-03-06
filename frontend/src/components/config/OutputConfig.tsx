import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface OutputConfigShape {
  outputKeys: string[];
  format: string;
}

interface Props {
  config: OutputConfigShape;
  onChange: (cfg: OutputConfigShape) => void;
}

export function OutputConfig({ config, onChange }: Props) {
  const { register, watch } = useForm<OutputConfigShape>({
    defaultValues: config,
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as OutputConfigShape));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        Output
      </h2>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">
          Output Keys (comma separated)
        </span>
        <input
          {...register("outputKeys", {
            setValueAs: (val: string | string[]) =>
              Array.isArray(val)
                ? val
                : val
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
          })}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">Format</span>
        <select
          {...register("format")}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        >
          <option value="json">JSON</option>
          <option value="text">Text</option>
          <option value="markdown">Markdown</option>
        </select>
      </label>
    </div>
  );
}
