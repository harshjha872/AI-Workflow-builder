import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { VariablePicker } from "../ui/VariablePicker";

/** Add or remove models here — the dropdown updates automatically. */
const PROVIDER_MODELS: Record<string, string[]> = {
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
  ],
  anthropic: [
    "claude-sonnet-4-20250514",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
  ],
  gemini: [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-pro-preview-05-06",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ],
};

interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
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
  const [showPicker, setShowPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { register, watch, setValue, getValues } = useForm<LLMConfig>({
    defaultValues: config,
  });

  const selectedProvider = watch("provider");
  const models = PROVIDER_MODELS[selectedProvider] ?? [];

  useEffect(() => {
    const sub = watch((values) => onChange(values as LLMConfig));
    return () => sub.unsubscribe();
  }, [onChange, watch]);

  // When provider changes, auto-select its first model
  useEffect(() => {
    const available = PROVIDER_MODELS[selectedProvider] ?? [];
    if (available.length > 0 && !available.includes(config.model)) {
      setValue("model", available[0]);
    }
  }, [selectedProvider]);

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const insertVariable = (path: string) => {
    const current = config.userPrompt ?? "";
    setValue("userPrompt", current + path);
    setShowPicker(false);
  };

  return (
    <div className="space-y-3 p-4 text-xs" ref={ref}>
      <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
        LLM Call
      </h2>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Provider</span>
        <select
          {...register("provider")}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Gemini</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">Model</span>
        <select
          {...register("model")}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        >
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">
          API Key
          <span className="ml-1 text-[10px] text-red-400">*required</span>
        </span>
        <input
          type="password"
          placeholder="Enter your API key"
          {...register("apiKey")}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs font-mono focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">
          System Prompt
        </span>
        <textarea
          {...register("systemPrompt")}
          rows={3}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
      </label>
      <label className="block relative space-y-1">
        <span className="text-slate-600 dark:text-zinc-400">
          User Prompt
          <span className="ml-1 text-[10px] text-slate-400 dark:text-zinc-500">
            supports &#123;&#123;context.key&#125;&#125;
          </span>
        </span>
        <textarea
          autoComplete="off"
          onClick={() => setShowPicker(!showPicker)}
          {...register("userPrompt")}
          rows={4}
          className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
        {showPicker && !getValues("userPrompt") && (
          <div className="absolute left-0 top-full mt-1 z-10 w-full">
            <VariablePicker onSelect={insertVariable} />
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
