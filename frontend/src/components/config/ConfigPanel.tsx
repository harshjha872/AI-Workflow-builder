import { useAppDispatch, useAppSelector } from "../../store";
import { deleteNode, updateNodeConfig } from "../../store/workflowSlice";
import { TriggerConfig1 } from "./TriggerConfig";
import { LLMCallConfig } from "./LLMCallConfig";
import { HttpRequestConfig } from "./HttpRequestConfig";
import { ConditionConfig } from "./ConditionConfig";
import { TransformConfig } from "./TransformConfig";
import { OutputConfig } from "./OutputConfig";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";

const CONFIG_FORMS: Record<string, React.ComponentType<any>> = {
  trigger: TriggerConfig1,
  llmCall: LLMCallConfig,
  httpRequest: HttpRequestConfig,
  condition: ConditionConfig,
  transform: TransformConfig,
  output: OutputConfig,
};

export function ConfigPanel() {
  const dispatch = useAppDispatch();
  const { selectedNodeId, nodes } = useAppSelector((s) => s.workflow);
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const Form = CONFIG_FORMS[node.type ?? ""] ?? null;
  if (!Form) return null;

  const onDelete = (nodeId: string) => {
    dispatch(deleteNode(nodeId));
  };

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
      <Form
        config={node.data.config}
        onChange={(cfg: unknown) =>
          dispatch(updateNodeConfig({ nodeId: node.id, config: cfg }))
        }
      />
      <div className="px-4 pt-2">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-red-500">
          Delete
        </h2>
        <p className="text-xs text-gray-500 pt-3">
          Delete the node and all connected edges. This action cannot be undone.
        </p>
        <Button variant="outline" size="sm" onClick={() => onDelete(node.id)} className="mt-3 rounded-md">
          <IconTrash /> Delete node
        </Button>
      </div>
    </aside>
  );
}
