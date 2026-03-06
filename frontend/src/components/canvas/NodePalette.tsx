import {
  Brain,
  GitBranch,
  Globe2,
  Play,
  Settings2,
  Upload,
} from "lucide-react";

type PaletteItemProps = {
  type: string;
  icon: React.ReactNode;
  label: string;
  description: string;
};

function PaletteItem({ type, icon, label, description }: PaletteItemProps) {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/node-type", type);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
          {icon}
        </span>
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {label}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export function NodePalette() {
  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 transition-colors">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Node Types
      </h2>
      <div className="space-y-2">
        <PaletteItem
          type="trigger"
          icon={<Play className="h-4 w-4 text-emerald-600" />}
          label="Trigger"
          description="Start the workflow manually or via webhook."
        />
        <PaletteItem
          type="llmCall"
          icon={<Brain className="h-4 w-4 text-indigo-600" />}
          label="LLM Call"
          description="Call an LLM provider like OpenAI."
        />
        <PaletteItem
          type="httpRequest"
          icon={<Globe2 className="h-4 w-4 text-sky-600" />}
          label="HTTP Request"
          description="Call external APIs over HTTP."
        />
        <PaletteItem
          type="condition"
          icon={<GitBranch className="h-4 w-4 text-amber-600" />}
          label="Condition"
          description="Branch based on an expression."
        />
        <PaletteItem
          type="transform"
          icon={<Settings2 className="h-4 w-4 text-purple-600" />}
          label="Transform"
          description="Run custom JS transforms."
        />
        <PaletteItem
          type="output"
          icon={<Upload className="h-4 w-4 text-rose-600" />}
          label="Output"
          description="Collect final workflow outputs."
        />
      </div>
    </aside>
  );
}
