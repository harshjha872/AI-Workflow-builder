import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface LLMConfig {
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  outputKey: string;
  maxTokens: number;
}

interface Props {
  config: LLMConfig;
  onChange: (cfg: LLMConfig) => void;
}

export function LLMCallConfig({ config, onChange }: Props) {
  const { register, watch } = useForm<LLMConfig>({
    defaultValues: config,
  });

  useEffect(() => {
    const sub = watch((values) => onChange(values as LLMConfig));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  return (
    <div className="space-y-3 p-4 text-xs">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        LLM Call
      </h2>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">Provider</span>
        <select
          {...register("provider")}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">Model</span>
        <input
          {...register("model")}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">
          System Prompt
        </span>
        <textarea
          {...register("systemPrompt")}
          rows={3}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">
          User Prompt
          <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
            supports &#123;&#123;context.key&#125;&#125;
          </span>
        </span>
        <textarea
          {...register("userPrompt")}
          rows={4}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-slate-400">Output Key</span>
        <input
          {...register("outputKey")}
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
    </div>
  );
}
