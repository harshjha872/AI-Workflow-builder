import { useAppSelector } from "../../store";
import { Edge, Node } from "@xyflow/react";

interface VariablePickerProps {
  onSelect: (path: string) => void;
}

export function VariablePicker({ onSelect }: VariablePickerProps) {
  const selectedNodeId = useAppSelector((s) => s.workflow.selectedNodeId);
  const AllNodes = useAppSelector((s) => s.workflow.nodes);
  const AllEdges = useAppSelector((s) => s.workflow.edges);

  const ancestorNodes = getAncestorNodes(selectedNodeId, AllNodes, AllEdges);
  // build list of available variables from ancestors' outputKeys + trigger inputFields
  const variables = buildVariableList(ancestorNodes, selectedNodeId);

  return (
    variables.length > 0 && (
      <div className="border border-slate-200 dark:border-zinc-700 rounded-lg shadow-lg bg-white dark:bg-zinc-900 w-64 max-h-64 overflow-y-auto text-sm">
        {variables.map((v) => (
          <button
            key={v.path}
            onClick={() => onSelect(v.path)}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 flex justify-between transition-colors"
          >
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {v.path}
            </span>
            <span className="text-slate-400 dark:text-zinc-500 text-xs">
              {v.source}
            </span>
          </button>
        ))}
      </div>
    )
  );
}

// builds the list of all referenceable paths
function buildVariableList(nodes: Array<Node>, selectedNodeId: string | null) {
  const vars = [] as Array<{ path: string; source: any }>;

  nodes.forEach((node: Node) => {
    if (node.type === "trigger") {
      const fields = node.data.config.inputFields ?? [];
      fields
        .filter((f: any) => f.key)
        .forEach((f: any) => {
          vars.push({
            path: `{{context.input.${f.key}}}`,
            source: "Trigger",
          });
        });
    } else if (node.data.config.outputKey && node.id !== selectedNodeId) {
      vars.push({
        path: `{{context.${node.data.config.outputKey}}}`,
        source: node.data.label,
      });
    }
  });

  return vars;
}

function getAncestorNodes(
  selectedNodeId: string | null,
  nodes: Array<Node>,
  edges: Array<Edge>,
): Array<Node> {
  if (!selectedNodeId) return [];

  const ancestors = new Set<string>();
  const queue = [selectedNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    // Find all edges where the current node is the target
    const incomingEdges = edges.filter((e) => e.target === currentId);

    for (const edge of incomingEdges) {
      if (!ancestors.has(edge.source)) {
        ancestors.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  return nodes.filter((n) => ancestors.has(n.id));
}
