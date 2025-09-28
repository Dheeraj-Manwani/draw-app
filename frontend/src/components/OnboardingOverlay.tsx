import { Button } from "@/components/ui/button";
import {
  MousePointer,
  Square,
  Circle,
  PenTool,
  Type,
  ArrowRight,
  Minus,
  Diamond,
  Hand,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface OnboardingOverlayProps {
  isVisible: boolean;
  currentTool: string;
}

const tools = [
  {
    icon: MousePointer,
    label: "Select",
    shortcut: "1",
    description: "Select and move elements",
  },
  {
    icon: Square,
    label: "Rectangle",
    shortcut: "2",
    description: "Draw rectangles and squares",
  },
  {
    icon: Circle,
    label: "Ellipse",
    shortcut: "3",
    description: "Draw circles and ovals",
  },
  {
    icon: Diamond,
    label: "Diamond",
    shortcut: "4",
    description: "Draw diamond shapes",
  },
  {
    icon: ArrowRight,
    label: "Arrow",
    shortcut: "5",
    description: "Draw arrows and lines",
  },
  {
    icon: Minus,
    label: "Line",
    shortcut: "6",
    description: "Draw straight lines",
  },
  {
    icon: PenTool,
    label: "Freehand",
    shortcut: "7",
    description: "Draw freehand sketches",
  },
  {
    icon: Type,
    label: "Text",
    shortcut: "8",
    description: "Add text to your drawing",
  },
];

const shortcuts = [
  { keys: ["Ctrl", "Z"], description: "Undo" },
  { keys: ["Ctrl", "Y"], description: "Redo" },
  { keys: ["Delete"], description: "Delete selected" },
  { keys: ["Ctrl", "A"], description: "Select all" },
  { keys: ["Space"], description: "Pan around" },
  { keys: ["Ctrl", "+"], description: "Zoom in" },
  { keys: ["Ctrl", "-"], description: "Zoom out" },
];

export default function OnboardingOverlay({
  isVisible,
  currentTool,
}: OnboardingOverlayProps) {
  const isMobile = useIsMobile();
  // Hide onboarding when a tool other than "select" is selected
  if (!isVisible || (currentTool !== "select" && currentTool !== "hand"))
    return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Main Instructions */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center min-w-80",
          isMobile && "-translate-y-2/3"
        )}
      >
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 max-w-md mx-4">
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Welcome to Draw It!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Start creating beautiful drawings and diagrams
              </p>
            </div>

            {/* Quick Start */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Quick Start
              </h3>
              <div className="text-left space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Pick a tool from the bottom toolbar
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click and drag to draw on the canvas
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Select elements to edit their properties
                  </span>
                </div>
              </div>
            </div>

            {/* Start Drawing Button */}
            {/* <Button
              onClick={onStartDrawing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Start Drawing
            </Button> */}
          </div>
        </div>
      </div>

      {/* Tool Palette Arrow */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 animate-pulse shadow-2xl shadow-blue-500/50 dark:shadow-blue-400/50 ring-2 ring-blue-500/30 dark:ring-blue-400/30 hover:shadow-blue-500/70 dark:hover:shadow-blue-400/70">
            Tools are here
          </div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gray-400 dark:border-t-gray-500"></div>
        </div>
      </div>

      {/* Available Tools */}
      {/* <div className="absolute top-20 left-8 max-w-xs">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
            Available Tools
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {tools.slice(0, 6).map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.label}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 dark:text-white truncate">
                      {tool.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tool.shortcut}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div> */}

      {/* Keyboard Shortcuts */}
      {/* <div className="absolute top-20 right-8 max-w-xs">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
            Keyboard Shortcuts
          </h3>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {shortcut.description}
                </span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <kbd
                      key={keyIndex}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Tips */}
      {/* <div className="absolute bottom-32 left-8 max-w-sm">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
            💡 Pro Tips
          </h3>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div>
              • Hold{" "}
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                Shift
              </kbd>{" "}
              while drawing to create perfect shapes
            </div>
            <div>
              • Use{" "}
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                Space
              </kbd>{" "}
              + drag to pan around the canvas
            </div>
            <div>• Double-click text elements to edit them</div>
            <div>• Right-click for context menus</div>
          </div>
        </div>
      </div> */}
    </div>
  );
}
