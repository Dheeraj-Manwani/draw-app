import { ElementType } from "@/types/elements";
import { IconButton } from "./IconButton";
import {
  Circle,
  MousePointer2,
  Pencil,
  RectangleHorizontalIcon,
  Slash,
} from "lucide-react";

export function Toolbar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: ElementType;
  setSelectedTool: (s: ElementType) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
      }}
    >
      <div className="flex gap-t">
        <IconButton
          onClick={() => {
            setSelectedTool(ElementType.CURSOR);
          }}
          activated={selectedTool === ElementType.CURSOR}
          icon={<MousePointer2 />}
        />
        <IconButton
          onClick={() => {
            setSelectedTool(ElementType.FREE);
          }}
          activated={selectedTool === ElementType.FREE}
          icon={<Pencil />}
        />
        <IconButton
          onClick={() => {
            setSelectedTool(ElementType.LINE);
          }}
          activated={selectedTool === ElementType.LINE}
          icon={<Slash />}
        />
        <IconButton
          onClick={() => {
            setSelectedTool(ElementType.RECTANGLE);
          }}
          activated={selectedTool === ElementType.RECTANGLE}
          icon={<RectangleHorizontalIcon />}
        ></IconButton>
        <IconButton
          onClick={() => {
            setSelectedTool(ElementType.CIRCLE);
          }}
          activated={selectedTool === ElementType.CIRCLE}
          icon={<Circle />}
        ></IconButton>
      </div>
    </div>
  );
}
