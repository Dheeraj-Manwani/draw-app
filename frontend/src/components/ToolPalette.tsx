import { Button } from "@/components/ui/button";
import {
  MousePointer,
  Square,
  Circle,
  Minus,
  ArrowRight,
  PenTool,
  Type,
  Eraser,
  Diamond,
  Hand,
  Image,
  Link,
  Sparkles,
} from "lucide-react";

interface ToolPaletteProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  onGenerateDrawing?: () => void;
}

const tools = [
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "hand", icon: Hand, label: "Hand" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "ellipse", icon: Circle, label: "Ellipse" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
  { id: "freehand", icon: PenTool, label: "Freehand" },
  { id: "text", icon: Type, label: "Text" },
  { id: "diamond", icon: Diamond, label: "Diamond" },
  { id: "image", icon: Image, label: "Image" },
  { id: "embed", icon: Link, label: "Embed" },
  { id: "generate", icon: Sparkles, label: "Generate Drawing" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
];

export default function ToolPalette({
  currentTool,
  onToolChange,
  onGenerateDrawing,
}: ToolPaletteProps) {
  return (
    <aside className="w-20 bg-card dark:bg-gray-800 border-r border-border dark:border-gray-700 flex flex-col items-center py-6 gap-3 shadow-sm">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentTool === tool.id;
        const isEraser = tool.id === "eraser";
        const isGenerate = tool.id === "generate";

        return (
          <div key={tool.id} className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className={`w-11 h-11 p-0 transition-all duration-200 rounded-xl ${
                isActive
                  ? "gradient-brand text-primary-foreground shadow-brand scale-110 "
                  : "hover:bg-muted/80 dark:hover:bg-gray-700 hover:text-foreground dark:text-gray-300 border border-transparent hover:scale-105 hover:shadow-md"
              } ${
                isEraser && isActive
                  ? "bg-destructive text-destructive-foreground border-destructive/20"
                  : ""
              } ${
                isEraser && !isActive
                  ? "hover:bg-destructive/10 hover:text-destructive dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  : ""
              } ${
                isGenerate && !isActive
                  ? "hover:bg-primary/10 hover:text-primary"
                  : ""
              }`}
              onClick={() => {
                if (isGenerate && onGenerateDrawing) {
                  onGenerateDrawing();
                } else {
                  onToolChange(tool.id);
                }
              }}
              title={tool.label}
              data-testid={`tool-${tool.id}`}
            >
              <Icon
                className={`w-8 h-8 transition-all duration-200 ${
                  isActive ? "scale-130 text-white " : "group-hover:scale-105"
                }`}
              />
            </Button>

            {/* Tool label on hover */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-popover dark:bg-gray-800 text-popover-foreground dark:text-white px-3 py-1.5 rounded-lg shadow-lg border dark:border-gray-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {tool.label}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover dark:bg-gray-800 rotate-45 border-l border-b dark:border-gray-700" />
            </div>

            {/* Separator before eraser */}
            {/* {index === tools.length - 2 && (
              <div className="w-10 h-px bg-border my-2" />
            )} */}
          </div>
        );
      })}
    </aside>
  );
}
