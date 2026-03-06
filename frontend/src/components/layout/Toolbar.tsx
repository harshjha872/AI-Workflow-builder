import { ArrowLeft, Play, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { setName } from "../../store/workflowSlice";

interface ToolbarProps {
  onRun: () => void;
}

export function Toolbar({ onRun }: ToolbarProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { name, isSaving, isSaved } = useAppSelector((s) => s.workflow);
  const { status } = useAppSelector((s) => s.execution);

  const isRunning = status === "RUNNING";

  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <input
        className="min-w-0 flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        value={name}
        onChange={(e) => dispatch(setName(e.target.value))}
      />
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-slate-800 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors"
        disabled={isSaving || isSaved}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Saving…" : isSaved ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        onClick={onRun}
        disabled={isRunning}
        className="inline-flex items-center gap-2 rounded-md border border-emerald-600 dark:border-emerald-700 bg-emerald-600 dark:bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-emerald-400 dark:disabled:bg-emerald-800 transition-colors"
      >
        <Play className="h-4 w-4" />
        Run
      </button>
    </header>
  );
}
