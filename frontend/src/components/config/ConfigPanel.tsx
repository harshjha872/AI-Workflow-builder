import { useAppDispatch, useAppSelector } from "../../store";
import { updateNodeConfig } from "../../store/workflowSlice";
import { TriggerConfig } from "./TriggerConfig";
import { LLMCallConfig } from "./LLMCallConfig";
import { HttpRequestConfig } from "./HttpRequestConfig";
import { ConditionConfig } from "./ConditionConfig";
import { TransformConfig } from "./TransformConfig";
import { OutputConfig } from "./OutputConfig";

const CONFIG_FORMS: Record<string, React.ComponentType<any>> = {
  trigger: TriggerConfig,
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

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
      <Form
        config={node.data.config}
        onChange={(cfg: unknown) =>
          dispatch(updateNodeConfig({ nodeId: node.id, config: cfg }))
        }
      />
    </aside>
  );
}
