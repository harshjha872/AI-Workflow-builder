interface KeyValueEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export function KeyValueEditor({ value, onChange }: KeyValueEditorProps) {
  const entries = Object.entries(value ?? {});

  const update = (index: number, key: string, val: string) => {
    const next: Record<string, string> = {};
    entries.forEach(([k, v], i) => {
      if (i === index) {
        if (key) {
          next[key] = val;
        }
      } else {
        next[k] = v;
      }
    });
    onChange(next);
  };

  const addRow = () => {
    onChange({ ...value, "": "" });
  };

  return (
    <div className="space-y-1">
      {entries.map(([k, v], index) => (
        <div key={index} className="flex gap-1">
          <input
            className="w-1/2 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
            placeholder="Header"
            defaultValue={k}
            onChange={(e) => update(index, e.target.value, v)}
          />
          <input
            className="w-1/2 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
            placeholder="Value"
            defaultValue={v}
            onChange={(e) => update(index, k, e.target.value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="mt-1 text-[11px] font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        + Add header
      </button>
    </div>
  );
}
