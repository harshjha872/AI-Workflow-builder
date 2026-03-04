import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

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
    defaultValues: config
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as OutputConfigShape));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800">Output</h2>
      <label className="block space-y-1">
        <span className="text-slate-600">Output Keys (comma separated)</span>
        <input
          {...register('outputKeys', {
            setValueAs: (val: string | string[]) =>
              Array.isArray(val) ? val : val.split(',').map((v) => v.trim()).filter(Boolean)
          })}
          className="w-full rounded-md border px-2 py-1 text-xs"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600">Format</span>
        <select
          {...register('format')}
          className="w-full rounded-md border px-2 py-1 text-xs"
        >
          <option value="json">JSON</option>
          <option value="text">Text</option>
          <option value="markdown">Markdown</option>
        </select>
      </label>
    </div>
  );
}

