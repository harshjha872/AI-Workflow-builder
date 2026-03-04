import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

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
    defaultValues: config
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as ConditionConfigShape));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800">Condition</h2>
      <label className="block space-y-1">
        <span className="text-slate-600">Expression</span>
        <textarea
          {...register('expression')}
          rows={3}
          className="w-full rounded-md border px-2 py-1 font-mono text-xs"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600">True Path Node ID</span>
        <input
          {...register('truePath')}
          className="w-full rounded-md border px-2 py-1 text-xs"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600">False Path Node ID</span>
        <input
          {...register('falsePath')}
          className="w-full rounded-md border px-2 py-1 text-xs"
        />
      </label>
    </div>
  );
}

