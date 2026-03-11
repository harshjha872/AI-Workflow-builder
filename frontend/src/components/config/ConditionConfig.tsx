import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { VariablePicker } from "../ui/VariablePicker";

interface ConditionConfigShape {
  expression: string;
  truePath: string;
  falsePath: string;
  errorPath: string;
}

interface Props {
  config: ConditionConfigShape;
  onChange: (cfg: ConditionConfigShape) => void;
}

export function ConditionConfig({ config, onChange }: Props) {
  const [activePicker, setActivePicker] = useState<
    keyof ConditionConfigShape | null
  >(null);
  const ref = useRef<HTMLDivElement>(null);

  const { register, watch, setValue, getValues } =
    useForm<ConditionConfigShape>({
      defaultValues: config,
    });

  useEffect(() => {
    const sub = watch((values) => onChange(values as ConditionConfigShape));
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

  const insertVariable = (path: string, field: keyof ConditionConfigShape) => {
    setValue(field, path);
    setActivePicker(null);
  };

  return (
    <div className="space-y-3 p-4 text-xs" ref={ref}>
      <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
        Condition
      </h2>
      <label className="block relative space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Expression</span>
        <div className="flex items-center">
          <textarea
            autoComplete="off"
            onClick={() =>
              setActivePicker(
                activePicker === "expression" ? null : "expression",
              )
            }
            {...register("expression")}
            rows={3}
            className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 font-mono text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
        </div>
        {activePicker === "expression" && !getValues("expression") && (
          <div className="absolute left-0 top-full mt-1 z-10 w-full">
            <VariablePicker
              onSelect={(path) => insertVariable(path, "expression")}
            />
          </div>
        )}
      </label>
      {/* <label className="block relative space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">
          True Path Node ID
        </span>
        <div className="flex items-center">
          <input
            autoComplete="off"
            onClick={() =>
              setActivePicker(activePicker === "truePath" ? null : "truePath")
            }
            {...register("truePath")}
            className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
        </div>
      </label>
      <label className="block relative space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">
          False Path Node ID
        </span>
        <div className="flex items-center">
          <input
            autoComplete="off"
            onClick={() =>
              setActivePicker(activePicker === "falsePath" ? null : "falsePath")
            }
            {...register("falsePath")}
            className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
        </div>
      </label>
      <label className="block relative space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">
          Error Path Node ID
        </span>
        <div className="flex items-center">
          <input
            autoComplete="off"
            onClick={() =>
              setActivePicker(activePicker === "errorPath" ? null : "errorPath")
            }
            {...register("errorPath")}
            className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
        </div>
      </label> */}
    </div>
  );
}
