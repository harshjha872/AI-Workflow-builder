import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface TransformConfigShape {
  code: string;
  outputKey: string;
}

interface Props {
  config: TransformConfigShape;
  onChange: (cfg: TransformConfigShape) => void;
}

export function TransformConfig({ config, onChange }: Props) {
  const { register, watch } = useForm<TransformConfigShape>({
    defaultValues: config
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as TransformConfigShape));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800">Transform</h2>
      <label className="block space-y-1">
        <span className="text-slate-600">Code</span>
        <textarea
          {...register('code')}
          rows={5}
          className="w-full rounded-md border px-2 py-1 font-mono text-xs"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600">Output Key</span>
        <input
          {...register('outputKey')}
          className="w-full rounded-md border px-2 py-1 text-xs"
        />
      </label>
    </div>
  );
}

