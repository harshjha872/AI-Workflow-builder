import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";
import { IconXFilled } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { deleteEdge, setEdges } from "../../store/workflowSlice";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  animated,
  data,
}: any) {
  const dispatch = useAppDispatch();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
    offset: 20,
  });

  const onDelete = (id: string) => {
    dispatch(deleteEdge(id));
  };
  return (
    <>
      <BaseEdge
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        className={animated ? "react-flow__edge-path animated" : ""}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <button onClick={() => onDelete(id)}>
            <IconXFilled color="red" size={20} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
