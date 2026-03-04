interface BadgeProps {
  status: string;
}

export function StatusBadge({ status }: BadgeProps) {
  const colorMap: Record<string, string> = {
    IDLE: 'bg-slate-700 text-slate-100',
    RUNNING: 'bg-blue-600 text-white',
    SUCCESS: 'bg-emerald-600 text-white',
    ERROR: 'bg-red-600 text-white'
  };

  const cls = colorMap[status] ?? colorMap.IDLE;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

