import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { KeyValueEditor } from "../ui/KeyValueEditor";
import { VariablePicker } from "../ui/VariablePicker";
import { useAppSelector } from "../../store";

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
  const [showPicker, setShowPicker] = useState(false);
  const ref = useRef(null);

  const { register, watch, setValue, getValues } = useForm<HttpConfig>({
    defaultValues: config,
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as HttpConfig));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setShowPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const insertVariable = (path: string) => {
    setValue("url", path);
    setShowPicker(false);

    // insert at cursor position
    // const el = ref.current;
    // const start = el.selectionStart;
    // const newVal = value.slice(0, start) + path + value.slice(start);
    // onChange(newVal);
    // setShowPicker(false);
  };

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
        HTTP Request
      </h2>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Method</span>
        <select
          {...register("method")}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </label>
      <label ref={ref} className="block relative space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">URL</span>
        <div className="flex items-center">
          <input
            autoComplete="off"
            onClick={() => setShowPicker(!showPicker)}
            {...register("url")}
            className="relative w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
        </div>
        {showPicker && !getValues("url") && (
          <div className="absolute left-0 top-12 z-10">
            <VariablePicker onSelect={insertVariable} />
          </div>
        )}
      </label>
      <div className="space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Headers</span>
        <KeyValueEditor
          value={config.headers}
          onChange={(headers) => setValue("headers", headers)}
        />
      </div>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Body</span>
        <textarea
          {...register("body")}
          rows={3}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Output Key</span>
        <input
          {...register("outputKey")}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
    </div>
  );
}
