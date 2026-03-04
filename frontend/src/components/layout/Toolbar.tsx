import { ArrowLeft, Play, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setName } from '../../store/workflowSlice';

interface ToolbarProps {
  onRun: () => void;
}

export function Toolbar({ onRun }: ToolbarProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { name, isSaving, isSaved } = useAppSelector((s) => s.workflow);
  const { status } = useAppSelector((s) => s.execution);

  const isRunning = status === 'RUNNING';

  return (
    <header className="flex items-center gap-4 border-b bg-white px-4 py-2">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <input
        className="min-w-0 flex-1 rounded-md border px-3 py-1 text-sm"
        value={name}
        onChange={(e) => dispatch(setName(e.target.value))}
      />
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border bg-slate-900 px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
        disabled={isSaving || isSaved}
      >
        <Save className="h-4 w-4" />
        {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save'}
      </button>
      <button
        type="button"
        onClick={onRun}
        disabled={isRunning}
        className="inline-flex items-center gap-2 rounded-md border bg-emerald-600 px-3 py-1 text-sm font-medium text-white disabled:bg-emerald-400"
      >
        <Play className="h-4 w-4" />
        Run
      </button>
    </header>
  );
}

