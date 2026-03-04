import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsApi, type WorkflowSummary } from '../../api/workflows';

export function WorkflowSidebar() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      const list = await workflowsApi.list();
      setWorkflows(list);
    })();
  }, []);

  return (
    <aside className="flex w-64 flex-col border-r bg-slate-50">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-sm font-semibold text-slate-700">Workflows</h2>
        <button
          type="button"
          onClick={() => navigate('/editor')}
          className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs font-medium"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {workflows.length === 0 ? (
          <div className="mt-8 text-center text-xs text-slate-500">
            No workflows yet.
            <br />
            Build your first AI automation.
          </div>
        ) : (
          <ul className="space-y-1">
            {workflows.map((wf) => (
              <li key={wf.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/editor/${wf.id}`)}
                  className="w-full rounded-md border bg-white px-3 py-2 text-left text-xs hover:border-slate-300"
                >
                  <div className="font-medium text-slate-800">{wf.name}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Updated {new Date(wf.updatedAt).toLocaleString()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

