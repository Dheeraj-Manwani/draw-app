import { Button } from "@/components/ui/button";
import {
  MousePointer,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Pencil,
  Type,
  Eraser,
  Diamond,
  Hand,
  Lock,
  Zap,
  MoreHorizontal,
  Shapes,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ToolPaletteProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  onGenerateDrawing: () => void;
  onAIDiagram: () => void;
  toolLocked: boolean;
  onToggleToolLock: () => void;
  isEmpty?: boolean;
}

const tools = [
  { id: "hand", icon: Hand, label: "Hand (panning tool)", shortcut: "H" },
  { id: "select", icon: MousePointer, label: "Selection", shortcut: "1" },
  { id: "rectangle", icon: Square, label: "Rectangle", shortcut: "2" },
  { id: "diamond", icon: Diamond, label: "Diamond", shortcut: "3" },
  { id: "ellipse", icon: Circle, label: "Ellipse", shortcut: "4" },
  { id: "arrow", icon: ArrowRight, label: "Arrow", shortcut: "5" },
  { id: "line", icon: Minus, label: "Line", shortcut: "6" },
  { id: "freehand", icon: Pencil, label: "Draw", shortcut: "7" },
  { id: "text", icon: Type, label: "Text", shortcut: "8" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "0" },
  { id: "laser", icon: Zap, label: "Laser pointer", shortcut: "K" },
];

// Shared island styling so every floating panel feels consistent
export const islandClass =
  "bg-white/95 dark:bg-[#232329]/95 backdrop-blur-md border border-gray-200 dark:border-[#33333d] shadow-[0_1px_10px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_14px_rgba(0,0,0,0.55)]";

export default function ToolPalette({
  currentTool,
  onToolChange,
  onGenerateDrawing,
  onAIDiagram,
  toolLocked,
  onToggleToolLock,
  isEmpty = false,
}: ToolPaletteProps) {
  const isMobile = useIsMobile();
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showShapesTools, setShowShapesTools] = useState(false);
  const moreToolsRef = useRef<HTMLDivElement>(null);
  const shapesToolsRef = useRef<HTMLDivElement>(null);

  // Define tools that should be grouped under "more" on mobile
  const moreTools = ["eraser", "laser"];

  // Define tools that should be grouped under "shapes" on mobile
  const shapesTools = ["rectangle", "diamond", "ellipse", "arrow", "line"];

  // Filter tools based on mobile/desktop
  const visibleTools = isMobile
    ? tools.filter(
        (tool) => !moreTools.includes(tool.id) && !shapesTools.includes(tool.id)
      )
    : tools;

  // Tooltip sits below the bar on desktop (bar is at top) and above on mobile
  const tooltipPos = isMobile ? "bottom-full mb-2" : "top-full mt-2";
  const tooltipArrow = isMobile
    ? "top-full border-t-4 border-t-gray-900 dark:border-t-[#2b2b33]"
    : "bottom-full border-b-4 border-b-gray-900 dark:border-b-[#2b2b33]";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreToolsRef.current &&
        !moreToolsRef.current.contains(event.target as Node)
      ) {
        setShowMoreTools(false);
      }
      if (
        shapesToolsRef.current &&
        !shapesToolsRef.current.contains(event.target as Node)
      ) {
        setShowShapesTools(false);
      }
    };

    if (showMoreTools || showShapesTools) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreTools, showShapesTools]);

  // Base styling for a single tool button
  const toolButtonClass = (isActive: boolean, accent?: "eraser" | "laser") =>
    cn(
      "relative flex items-center justify-center rounded-lg transition-all duration-150",
      isMobile ? "h-9 w-9" : "h-9 w-9",
      isActive
        ? "bg-[#6965db] text-white shadow-sm hover:bg-[#6965db] hover:text-white dark:bg-[#46437e] dark:hover:bg-[#46437e]"
        : "text-gray-700 dark:text-[#ced4da] hover:bg-gray-100 dark:hover:bg-[#31303b]",
      accent === "eraser" &&
        isActive &&
        "bg-red-500 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-600",
      accent === "laser" &&
        isActive &&
        "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-500 hover:to-orange-500 dark:from-red-500 dark:to-orange-500"
    );

  const renderShortcut = (shortcut?: string) =>
    shortcut ? (
      <span className="pointer-events-none absolute bottom-0 right-1 text-[9px] font-medium leading-none text-gray-400 dark:text-[#7a7a86]">
        {shortcut}
      </span>
    ) : null;

  const tooltip = (label: string) => (
    <div
      className={cn(
        "absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 dark:bg-[#2b2b33]",
        tooltipPos
      )}
    >
      {label}
      <div
        className={cn(
          "absolute left-1/2 h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-transparent",
          tooltipArrow
        )}
      />
    </div>
  );

  return (
    <div
      className={cn(
        "fixed z-40 left-1/2 -translate-x-1/2 transform",
        isMobile ? "bottom-4" : "top-4"
      )}
    >
      <div
        className={cn(
          "rounded-xl px-1.5 py-1.5",
          islandClass,
          isEmpty && currentTool === "select"
            ? "ring-2 ring-[#6965db]/40 dark:ring-[#6965db]/50"
            : ""
        )}
      >
        <div className="flex items-center gap-1">
          {/* Lock button */}
          <div className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                toolButtonClass(toolLocked),
                "p-0",
                toolLocked &&
                  "bg-[#6965db] text-white dark:bg-[#46437e]"
              )}
              onClick={onToggleToolLock}
              data-testid="tool-lock"
            >
              <Lock className="h-4 w-4" />
            </Button>
            {tooltip(
              toolLocked
                ? "Keep selected tool active after drawing"
                : "Keep selected tool active after drawing"
            )}
          </div>

          {/* Separator */}
          <div className="mx-0.5 h-6 w-px bg-gray-200 dark:bg-[#3a3a44]" />

          {/* Tools */}
          {visibleTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.id;
            const accent =
              tool.id === "eraser"
                ? "eraser"
                : tool.id === "laser"
                ? "laser"
                : undefined;

            return (
              <div key={tool.id} className="group relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(toolButtonClass(isActive, accent), "p-0")}
                  onClick={() => onToolChange(tool.id)}
                  title={tool.label}
                  data-testid={`tool-${tool.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {renderShortcut(tool.shortcut)}
                </Button>
                {tooltip(tool.label)}
              </div>
            );
          })}

          {/* Shapes tools button for mobile */}
          {isMobile && (
            <div className="group relative" ref={shapesToolsRef}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  toolButtonClass(shapesTools.includes(currentTool)),
                  "p-0"
                )}
                onClick={() => setShowShapesTools(!showShapesTools)}
                title="Shapes"
              >
                <Shapes className="h-4 w-4" />
              </Button>

              {showShapesTools && (
                <div
                  className={cn(
                    "absolute bottom-full right-0 mb-2 rounded-lg p-1.5 z-40",
                    islandClass
                  )}
                >
                  <div className="flex flex-col gap-1">
                    {shapesTools.map((toolId) => {
                      const tool = tools.find((t) => t.id === toolId);
                      if (!tool) return null;
                      const Icon = tool.icon;
                      const isActive = currentTool === toolId;
                      return (
                        <Button
                          key={toolId}
                          variant="ghost"
                          size="icon"
                          className={cn(toolButtonClass(isActive), "p-0")}
                          onClick={() => {
                            onToolChange(toolId);
                            setShowShapesTools(false);
                          }}
                          title={tool.label}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* More tools button for mobile */}
          {isMobile && (
            <div className="group relative" ref={moreToolsRef}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  toolButtonClass(moreTools.includes(currentTool)),
                  "p-0"
                )}
                onClick={() => setShowMoreTools(!showMoreTools)}
                title="More tools"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {showMoreTools && (
                <div
                  className={cn(
                    "absolute bottom-full right-0 mb-2 rounded-lg p-1.5 z-40",
                    islandClass
                  )}
                >
                  <div className="flex flex-col gap-1">
                    {moreTools.map((toolId) => {
                      const tool = tools.find((t) => t.id === toolId);
                      if (!tool) return null;
                      const Icon = tool.icon;
                      const isActive = currentTool === toolId;
                      const accent =
                        toolId === "eraser"
                          ? "eraser"
                          : toolId === "laser"
                          ? "laser"
                          : undefined;
                      return (
                        <Button
                          key={toolId}
                          variant="ghost"
                          size="icon"
                          className={cn(toolButtonClass(isActive, accent), "p-0")}
                          onClick={() => {
                            onToolChange(toolId);
                            setShowMoreTools(false);
                          }}
                          title={tool.label}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
