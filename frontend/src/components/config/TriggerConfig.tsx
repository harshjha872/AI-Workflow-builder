import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface TriggerConfigProps {
  config: { triggerType: string; inputSchema: string };
  onChange: (cfg: TriggerConfigProps['config']) => void;
}

export function TriggerConfig({ config, onChange }: TriggerConfigProps) {
  const { register, watch } = useForm<TriggerConfigProps['config']>({
    defaultValues: config
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as TriggerConfigProps['config']));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800">Trigger</h2>
      <label className="block space-y-1">
        <span className="text-slate-600">Trigger Type</span>
        <select
          {...register('triggerType')}
          className="w-full rounded-md border px-2 py-1 text-xs"
        >
          <option value="manual">Manual</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600">Input Schema</span>
        <textarea
          {...register('inputSchema')}
          rows={4}
          className="w-full rounded-md border px-2 py-1 font-mono text-xs"
        />
      </label>
    </div>
  );
}

