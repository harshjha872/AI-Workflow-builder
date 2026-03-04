import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { KeyValueEditor } from '../ui/KeyValueEditor';

interface HttpConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  outputKey: string;
  timeoutMs: number;
}

interface Props {
  config: HttpConfig;
  onChange: (cfg: HttpConfig) => void;
}

export function HttpRequestConfig({ config, onChange }: Props) {
  const { register, watch, setValue } = useForm<HttpConfig>({
    defaultValues: config
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as HttpConfig));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800">HTTP Request</h2>
      <label className="block space-y-1">
        <span className="text-slate-600">Method</span>
        <select
          {...register('method')}
          className="w-full rounded-md border px-2 py-1 text-xs"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600">URL</span>
        <input {...register('url')} className="w-full rounded-md border px-2 py-1 text-xs" />
      </label>
      <div className="space-y-1">
        <span className="text-slate-600">Headers</span>
        <KeyValueEditor
          value={config.headers}
          onChange={(headers) => setValue('headers', headers)}
        />
      </div>
      <label className="block space-y-1">
        <span className="text-slate-600">Body</span>
        <textarea
          {...register('body')}
          rows={3}
          className="w-full rounded-md border px-2 py-1 text-xs"
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

