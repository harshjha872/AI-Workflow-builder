import { Handle, Position } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function ConditionNode(props: any) {
  const { data } = props;
  const { config } = data;

  return (
    <BaseNode {...props} showSourceHandle={false}>
      <div className="font-medium text-amber-700 dark:text-amber-400 mb-1">
        Condition
      </div>
      <div className="line-clamp-2 text-[11px] text-slate-600 dark:text-zinc-400">
        {config.expression}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-end items-center relative h-5">
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mr-2">
            True
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-2 h-2 !bg-emerald-500 !-right-4"
          />
        </div>
        <div className="flex justify-end items-center relative h-5">
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mr-2">
            False
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="w-2 h-2 !bg-amber-500 !-right-4"
          />
        </div>
        <div className="flex justify-end items-center relative h-5">
          <span className="text-[10px] font-medium text-red-600 dark:text-red-400 mr-2">
            Error
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="error"
            className="w-2 h-2 !bg-red-500 !-right-4"
          />
        </div>
      </div>
    </BaseNode>
  );
}
