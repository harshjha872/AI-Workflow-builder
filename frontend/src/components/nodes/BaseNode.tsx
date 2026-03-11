import { Handle, Position } from "@xyflow/react";
import { ReactNode } from "react";
import { useAppSelector } from "../../store";
import { statusColors } from "../../utils/statusColors";
import { useAppDispatch } from "../../store";

interface BaseNodeProps {
  id: string;
  data: { label: string };
  children?: ReactNode;
  showTargetHandle?: boolean;
  showSourceHandle?: boolean;
}

export function BaseNode({
  id,
  data,
  children,
  showTargetHandle = true,
  showSourceHandle = true,
}: BaseNodeProps) {
  const status = useAppSelector((s) => s.execution.nodeStatuses[id]);
  const statusClass = statusColors[status ?? "default"] ?? statusColors.default;
  const dispatch = useAppDispatch();

  return (
    <div
      className={`w-60 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.2)] transition-colors ${statusClass}`}
    >
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="h-2 w-2 bg-slate-500"
        />
      )}
      {/* <div className="flex items-center justify-between"> */}
      <div className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200">
        {data.label}
      </div>
      <div className="px-3 pb-3 text-xs text-slate-600 dark:text-zinc-400">
        {children}
      </div>
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="h-2 w-2 bg-slate-500"
        />
      )}
    </div>
  );
}
