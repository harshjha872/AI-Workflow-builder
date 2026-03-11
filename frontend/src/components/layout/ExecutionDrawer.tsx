import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { StatusBadge } from "../ui/Badge";
import { JsonViewer } from "../ui/JsonViewer";
import { closeDrawer } from "../../store/executionSlice";

export function ExecutionDrawer() {
  const { isDrawerOpen, status, logs, executionId } = useAppSelector((s) => s.execution);
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isDrawerOpen) return null;

  const nodeOutputs = logs
    .filter((log) => log.status === "SUCCESS" && log.output !== undefined)
    .reduce((acc, log) => {
      // Find the corresponding node_start log to get the nodeType
      const startLog = logs.find(l => l.nodeId === log.nodeId && l.type === 'node_start');
      const key = startLog?.nodeType ? `${startLog.nodeType}` : log.nodeId;
      acc[key] = log.output;
      return acc;
    }, {} as Record<string, unknown>);

  return (
    <div className={`flex flex-col border-t border-slate-200 dark:border-zinc-800 bg-zinc-900 text-slate-100 transition-all duration-300 ease-in-out ${isExpanded ? 'h-72' : 'h-[50px] overflow-hidden'}`}>
      {/* Drawer Header */}
      <div 
        className="flex items-center justify-between border-b border-zinc-800 px-4 h-[50px] shrink-0 bg-zinc-950/50 cursor-pointer hover:bg-zinc-900 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-sm">Execution Panel</h3>
          <StatusBadge status={status} />
          {executionId && <span className="text-xs text-zinc-500 font-mono hidden sm:inline">{executionId}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); dispatch(closeDrawer()); }}
            className="p-1 hover:bg-red-900/50 rounded text-zinc-400 hover:text-red-400 transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-1/2 flex-col border-r border-zinc-800 p-4 pt-3">
            <div className="mb-2">
              <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">Logs</h3>
            </div>
            <div className="h-full flex-1 overflow-y-auto text-xs font-mono pr-2">
              {logs.map((log) => {
                const time = log.startedAt ? new Date(log.startedAt).toLocaleTimeString() : "";
                return (
                  <div
                    key={`${log.nodeId}-${log.type}-${log.startedAt ?? ""}`}
                    className="mb-2 flex items-start flex-wrap gap-2"
                  >
                    {time && <span className="text-zinc-500 whitespace-nowrap">[{time}]</span>}
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${
                      log.status === 'ERROR' ? 'bg-red-950 text-red-400 border border-red-900/50' :
                      log.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' :
                      'bg-blue-950 text-blue-400 border border-blue-900/50'
                    }`}>
                      {log.type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-300 font-medium py-0.5">Node {log.nodeId}</span>
                    {log.error && <span className="text-red-400 break-all py-0.5 w-full bg-red-950/30 p-2 rounded text-[11px] mt-1">{log.error}</span>}
                  </div>
                );
              })}
              {logs.length === 0 && <div className="text-zinc-500 italic mt-2">No logs yet...</div>}
            </div>
          </div>
          
          <div className="flex w-1/2 flex-col p-4 pt-3 bg-zinc-900/50">
            <div className="mb-2">
              <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">Node Outputs</h3>
            </div>
            <div className="h-full flex-1 overflow-y-auto bg-zinc-950/80 rounded-lg p-3 border border-zinc-800/80 shadow-inner">
              {Object.keys(nodeOutputs).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {Object.entries(nodeOutputs).map(([key, value]) => (
                    <JsonViewer key={key} data={value} name={key} />
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 italic text-xs font-mono">No outputs generated yet...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
