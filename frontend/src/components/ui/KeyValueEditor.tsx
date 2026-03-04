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
    onChange({ ...value, '': '' });
  };

  return (
    <div className="space-y-1">
      {entries.map(([k, v], index) => (
        <div key={index} className="flex gap-1">
          <input
            className="w-1/2 rounded-md border px-2 py-1 text-xs"
            placeholder="Header"
            defaultValue={k}
            onChange={(e) => update(index, e.target.value, v)}
          />
          <input
            className="w-1/2 rounded-md border px-2 py-1 text-xs"
            placeholder="Value"
            defaultValue={v}
            onChange={(e) => update(index, k, e.target.value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="mt-1 text-[11px] font-medium text-slate-600"
      >
        + Add header
      </button>
    </div>
  );
}

