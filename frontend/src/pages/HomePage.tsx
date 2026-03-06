import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { executionsApi } from "../api/executions";
import { workflowsApi, type WorkflowSummary } from "../api/workflows";

export function HomePage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      const list = await workflowsApi.list();
      setWorkflows(list);
    })();
  }, []);

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this workflow?")) return;
    await workflowsApi.delete(id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
            AI Workflow Builder
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Build and run AI-powered automation workflows in minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/editor")}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </button>
      </header>

      {workflows.length === 0 ? (
        <section className="mt-16 flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-2 text-sm font-medium text-slate-800 dark:text-zinc-200">
            No workflows yet.
          </p>
          <p className="mb-4 text-sm text-slate-500 dark:text-zinc-400">
            Build your first AI automation in minutes.
          </p>
          <button
            type="button"
            onClick={() => navigate("/editor")}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </button>
        </section>
      ) : (
        <section className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <article
              key={wf.id}
              className="group flex flex-col justify-between rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {wf.name}
                </h2>
                {wf.description && (
                  <p className="mb-2 text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {wf.description}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Updated {new Date(wf.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/editor/${wf.id}`)}
                  className="text-xs font-medium text-slate-900 dark:text-zinc-300 underline-offset-2 hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Open Editor
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(wf.id)}
                  className="text-xs text-red-500 dark:text-red-400 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
