import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";
import { IconXFilled } from "@tabler/icons-react";
import { deleteEdge } from "@/store/workflowSlice";
import { useAppDispatch } from "@/store";
import { Button } from "../ui/button";

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

  const onDelete = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
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
          <Button
            variant="ghost"
            size='icon-sm'
            className="pointer-events-auto cursor-pointer flex items-center justify-center translate-y-[2px] rounded-full"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => onDelete(e, id)}
          >
            <IconXFilled color="red" size={30} />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
