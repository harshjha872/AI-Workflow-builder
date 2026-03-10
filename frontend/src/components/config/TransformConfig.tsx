import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { VariablePicker } from "../ui/VariablePicker";

interface TransformConfigShape {
  code: string;
  outputKey: string;
}

interface Props {
  config: TransformConfigShape;
  onChange: (cfg: TransformConfigShape) => void;
}

export function TransformConfig({ config, onChange }: Props) {
  const [activePicker, setActivePicker] = useState<
    keyof TransformConfigShape | null
  >(null);
  const ref = useRef<HTMLDivElement>(null);

  const { register, watch, setValue, getValues } =
    useForm<TransformConfigShape>({
      defaultValues: config,
    });

  useEffect(() => {
    const sub = watch((values) => onChange(values as TransformConfigShape));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setActivePicker(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const insertVariable = (path: string, field: keyof TransformConfigShape) => {
    setValue(field, path);
    setActivePicker(null);
  };

  return (
    <div className="space-y-3 p-4 text-xs" ref={ref}>
      <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
        Transform
      </h2>
      <label className="block relative space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Code</span>
        <div className="flex items-center">
          <textarea
            autoComplete="off"
            onClick={() =>
              setActivePicker(activePicker === "code" ? null : "code")
            }
            {...register("code")}
            rows={5}
            className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 font-mono text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
        </div>
        {activePicker === "code" && !getValues("code") && (
          <div className="absolute left-0 top-full mt-1 z-10 w-full">
            <VariablePicker
              onSelect={(path) => insertVariable(path, "code")}
            />
          </div>
        )}
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
