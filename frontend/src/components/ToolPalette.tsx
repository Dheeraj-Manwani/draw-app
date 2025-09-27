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
  Lock,
  Zap,
} from "lucide-react";

interface ToolPaletteProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  onGenerateDrawing: () => void;
  onAIDiagram: () => void;
  toolLocked: boolean;
  onToggleToolLock: () => void;
}

const tools = [
  { id: "lock", icon: Lock, label: "Lock", shortcut: "" },
  { id: "hand", icon: Hand, label: "Hand", shortcut: "" },
  { id: "select", icon: MousePointer, label: "Select", shortcut: "1" },
  { id: "rectangle", icon: Square, label: "Rectangle", shortcut: "2" },
  { id: "diamond", icon: Diamond, label: "Diamond", shortcut: "3" },
  { id: "ellipse", icon: Circle, label: "Ellipse", shortcut: "4" },
  { id: "arrow", icon: ArrowRight, label: "Arrow", shortcut: "5" },
  { id: "line", icon: Minus, label: "Line", shortcut: "6" },
  { id: "freehand", icon: PenTool, label: "Freehand", shortcut: "7" },
  { id: "text", icon: Type, label: "Text", shortcut: "8" },
  // { id: "image", icon: Image, label: "Image", shortcut: "9" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "0" },
  // { id: "shapes", icon: Shapes, label: "More Shapes", shortcut: "" },
  // { id: "embed", icon: Link, label: "Embed" },
  // { id: "generate", icon: Sparkles, label: "Generate Drawing" },
  { id: "laser", icon: Zap, label: "Laser" },
];

export default function ToolPalette({
  currentTool,
  onToolChange,
  onGenerateDrawing,
  onAIDiagram,
  toolLocked,
  onToggleToolLock,
}: ToolPaletteProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ">
      <div className="backdrop-blur-sm rounded-2xl px-2 py-2 shadow-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-black dark:text-white">
        <div className="flex items-center gap-2">
          {/* Lock button */}
          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className={`p-3 transition-all duration-200 rounded-xl ${
                toolLocked
                  ? "bg-purple-600 text-white shadow-lg hover:bg-purple-600 hover:text-white"
                  : "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gray-700/50"
              }`}
              onClick={onToggleToolLock}
              title={toolLocked ? "Unlock Tool" : "Lock Tool"}
              data-testid="tool-lock"
            >
              <Lock className="w-10 h-10" />
            </Button>

            {/* Tool label on hover */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {toolLocked ? "Unlock Tool" : "Lock Tool"}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
            </div>
          </div>

          {/* Vertical separator */}
          <div className="w-px h-8 bg-gray-400 dark:bg-gray-600 mx-1" />

          {/* Other tools */}
          {tools
            .filter((tool) => tool.id !== "lock")
            .map((tool) => {
              const Icon = tool.icon;
              const isActive = currentTool === tool.id;
              const isEraser = tool.id === "eraser";
              const isGenerate = tool.id === "generate";
              const isLaser = tool.id === "laser";

              return (
                <div key={tool.id} className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-3 transition-all duration-200 rounded-xl ${
                      isActive
                        ? "bg-purple-600 text-white shadow-lg hover:bg-purple-600 hover:text-white"
                        : "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gray-700/50"
                    } ${
                      isEraser && isActive
                        ? "bg-red-600 text-white hover:bg-red-600 hover:text-white"
                        : ""
                    } ${
                      isEraser && !isActive
                        ? "hover:bg-red-600/20 hover:text-red-400"
                        : ""
                    } ${
                      isGenerate && !isActive
                        ? "hover:bg-primary/10 hover:text-primary"
                        : ""
                    } ${
                      isLaser && isActive
                        ? "bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-500/20"
                        : ""
                    } ${
                      isLaser && !isActive
                        ? "hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        : ""
                    }`}
                    onClick={() => {
                      if (isGenerate && onGenerateDrawing) {
                        onGenerateDrawing();
                      } else if (tool.id === "generate" && onAIDiagram) {
                        onAIDiagram();
                      } else {
                        onToolChange(tool.id);
                      }
                    }}
                    title={tool.label}
                    data-testid={`tool-${tool.id}`}
                  >
                    <Icon className="w-10 h-10" />
                  </Button>

                  {/* Tool label on hover */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {tool.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
