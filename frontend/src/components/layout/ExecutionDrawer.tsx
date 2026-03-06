import { useAppSelector } from "../../store";
import { StatusBadge } from "../ui/Badge";

export function ExecutionDrawer() {
  const { isDrawerOpen, status, logs } = useAppSelector((s) => s.execution);

  if (!isDrawerOpen) return null;

  return (
    <div className="h-64 border-t border-slate-200 dark:border-zinc-800 bg-slate-950 px-4 py-3 text-slate-100 transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <StatusBadge status={status} />
      </div>
      <div className="h-full overflow-y-auto text-xs font-mono">
        {logs.map((log) => (
          <div
            key={`${log.nodeId}-${log.type}-${log.startedAt ?? ""}`}
            className="mb-2"
          >
            <span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
              {log.type}
            </span>
            <span className="mr-2 text-slate-300">Node {log.nodeId}</span>
            {log.error && <span className="text-red-400">{log.error}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
