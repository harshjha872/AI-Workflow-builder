import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface TriggerConfigProps {
  config: { triggerType: string; inputSchema: string };
  onChange: (cfg: TriggerConfigProps["config"]) => void;
}

interface TriggerConfigProps1 {
  config: {
    inputFields: Array<{key: string, value: string}>
  };
  onChange: (cfg: TriggerConfigProps1["config"]) => void;
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

export function TriggerConfig1({ config, onChange }: TriggerConfigProps1) {
  const fields = config.inputFields ?? [{ key: '', value: '' }];

  const updateField = (index: number, prop: string, val: string) => {
    const updated = fields.map((f, i) => i === index ? { ...f, [prop]: val } : f);
    onChange({ ...config, inputFields: updated });
  };

  const addField = () => {
    onChange({ ...config, inputFields: [...fields, { key: '', value: '' }] });
  };

  const removeField = (index: number) => {
    onChange({ ...config, inputFields: fields.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
        Trigger
      </h2>
      <p className="text-xs text-gray-500">
        These fields will be available as <code>context.input.fieldName</code> in all nodes.
      </p>

      {fields.map((field, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            placeholder="field name"
            value={field.key}
            onChange={e => updateField(i, 'key', e.target.value)}
            className="w-28 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 font-mono text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
          <textarea
            placeholder="value"
            value={field.value}
            onChange={e => updateField(i, 'value', e.target.value)}
            className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 font-mono text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
            rows={2}
          />
          <button onClick={() => removeField(i)} className="text-gray-400 hover:text-red-500 mt-1">✕</button>
        </div>
      ))}

      <button onClick={addField} className="text-sm text-blue-600 hover:underline">
        + Add Field
      </button>
    </div>
  );
}