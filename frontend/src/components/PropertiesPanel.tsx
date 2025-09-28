import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  MoreHorizontal,
  Settings,
  X,
} from "lucide-react";
import { type CanvasElement } from "@/types/canvas";
import ColorPickerModal from "./ColorPickerModal";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onElementDelete: (id: string) => void;
  onElementDuplicate: (element: CanvasElement) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onClearSelection: () => void;
}

// Main colors shown in the properties panel
const mainStrokeColors = [
  { color: "#1e293b", label: "Black" },
  { color: "#dc2626", label: "Red" },
  { color: "#16a34a", label: "Green" },
  { color: "#2563eb", label: "Blue" },
  { color: "#9333ea", label: "Purple" },
];

const mainFillColors = [
  { color: "transparent", label: "Transparent" },
  { color: "#1e293b", label: "Black" },
  { color: "#dc2626", label: "Red" },
  { color: "#16a34a", label: "Green" },
  { color: "#2563eb", label: "Blue" },
  { color: "#9333ea", label: "Purple" },
];

// All colors for the modal
const allStrokeColors = [
  { color: "#1e293b", label: "Black" },
  { color: "#475569", label: "Slate" },
  { color: "#6b7280", label: "Gray" },
  { color: "#9ca3af", label: "Light Gray" },
  { color: "#d1d5db", label: "Very Light Gray" },
  { color: "#f3f4f6", label: "Lightest Gray" },
  { color: "#ffffff", label: "White" },
  { color: "#dc2626", label: "Red" },
  { color: "#ef4444", label: "Light Red" },
  { color: "#f87171", label: "Lighter Red" },
  { color: "#fecaca", label: "Very Light Red" },
  { color: "#991b1b", label: "Dark Red" },
  { color: "#7f1d1d", label: "Darker Red" },
  { color: "#ea580c", label: "Orange" },
  { color: "#fb923c", label: "Light Orange" },
  { color: "#fdba74", label: "Lighter Orange" },
  { color: "#fed7aa", label: "Very Light Orange" },
  { color: "#c2410c", label: "Dark Orange" },
  { color: "#9a3412", label: "Darker Orange" },
  { color: "#ca8a04", label: "Yellow" },
  { color: "#eab308", label: "Light Yellow" },
  { color: "#fde047", label: "Lighter Yellow" },
  { color: "#fef3c7", label: "Very Light Yellow" },
  { color: "#a16207", label: "Dark Yellow" },
  { color: "#713f12", label: "Darker Yellow" },
  { color: "#16a34a", label: "Green" },
  { color: "#22c55e", label: "Light Green" },
  { color: "#4ade80", label: "Lighter Green" },
  { color: "#bbf7d0", label: "Very Light Green" },
  { color: "#15803d", label: "Dark Green" },
  { color: "#14532d", label: "Darker Green" },
  { color: "#10b981", label: "Emerald" },
  { color: "#34d399", label: "Light Emerald" },
  { color: "#6ee7b7", label: "Lighter Emerald" },
  { color: "#a7f3d0", label: "Very Light Emerald" },
  { color: "#059669", label: "Dark Emerald" },
  { color: "#064e3b", label: "Darker Emerald" },
  { color: "#2563eb", label: "Blue" },
  { color: "#3b82f6", label: "Light Blue" },
  { color: "#60a5fa", label: "Lighter Blue" },
  { color: "#dbeafe", label: "Very Light Blue" },
  { color: "#1d4ed8", label: "Dark Blue" },
  { color: "#1e3a8a", label: "Darker Blue" },
  { color: "#0ea5e9", label: "Sky" },
  { color: "#38bdf8", label: "Light Sky" },
  { color: "#7dd3fc", label: "Lighter Sky" },
  { color: "#bae6fd", label: "Very Light Sky" },
  { color: "#0284c7", label: "Dark Sky" },
  { color: "#0c4a6e", label: "Darker Sky" },
  { color: "#9333ea", label: "Purple" },
  { color: "#a855f7", label: "Light Purple" },
  { color: "#c084fc", label: "Lighter Purple" },
  { color: "#e9d5ff", label: "Very Light Purple" },
  { color: "#7c3aed", label: "Dark Purple" },
  { color: "#581c87", label: "Darker Purple" },
  { color: "#ec4899", label: "Pink" },
  { color: "#f472b6", label: "Light Pink" },
  { color: "#f9a8d4", label: "Lighter Pink" },
  { color: "#fce7f3", label: "Very Light Pink" },
  { color: "#db2777", label: "Dark Pink" },
  { color: "#831843", label: "Darker Pink" },
  { color: "#f59e0b", label: "Amber" },
  { color: "#fbbf24", label: "Light Amber" },
  { color: "#fcd34d", label: "Lighter Amber" },
  { color: "#fef3c7", label: "Very Light Amber" },
  { color: "#d97706", label: "Dark Amber" },
  { color: "#92400e", label: "Darker Amber" },
  { color: "#84cc16", label: "Lime" },
  { color: "#a3e635", label: "Light Lime" },
  { color: "#bef264", label: "Lighter Lime" },
  { color: "#ecfccb", label: "Very Light Lime" },
  { color: "#65a30d", label: "Dark Lime" },
  { color: "#365314", label: "Darker Lime" },
  { color: "#14b8a6", label: "Teal" },
  { color: "#2dd4bf", label: "Light Teal" },
  { color: "#5eead4", label: "Lighter Teal" },
  { color: "#ccfbf1", label: "Very Light Teal" },
  { color: "#0d9488", label: "Dark Teal" },
  { color: "#134e4a", label: "Darker Teal" },
  { color: "#0891b2", label: "Cyan" },
  { color: "#22d3ee", label: "Light Cyan" },
  { color: "#67e8f9", label: "Lighter Cyan" },
  { color: "#cffafe", label: "Very Light Cyan" },
  { color: "#0e7490", label: "Dark Cyan" },
  { color: "#164e63", label: "Darker Cyan" },
  { color: "#f43f5e", label: "Rose" },
  { color: "#fb7185", label: "Light Rose" },
  { color: "#fda4af", label: "Lighter Rose" },
  { color: "#fed7d7", label: "Very Light Rose" },
  { color: "#e11d48", label: "Dark Rose" },
  { color: "#881337", label: "Darker Rose" },
];

const allFillColors = [
  { color: "transparent", label: "Transparent" },
  { color: "#ffffff", label: "White" },
  { color: "#f8fafc", label: "Light Gray" },
  { color: "#f1f5f9", label: "Very Light Gray" },
  { color: "#e2e8f0", label: "Gray" },
  { color: "#cbd5e1", label: "Medium Gray" },
  { color: "#94a3b8", label: "Dark Gray" },
  { color: "#64748b", label: "Darker Gray" },
  { color: "#475569", label: "Slate" },
  { color: "#334155", label: "Dark Slate" },
  { color: "#1e293b", label: "Very Dark Slate" },
  { color: "#0f172a", label: "Black" },
  { color: "#fef2f2", label: "Light Red" },
  { color: "#fee2e2", label: "Very Light Red" },
  { color: "#fecaca", label: "Red" },
  { color: "#f87171", label: "Medium Red" },
  { color: "#ef4444", label: "Dark Red" },
  { color: "#dc2626", label: "Darker Red" },
  { color: "#b91c1c", label: "Very Dark Red" },
  { color: "#991b1b", label: "Darkest Red" },
  { color: "#7f1d1d", label: "Very Darkest Red" },
  { color: "#fff7ed", label: "Light Orange" },
  { color: "#ffedd5", label: "Very Light Orange" },
  { color: "#fed7aa", label: "Orange" },
  { color: "#fdba74", label: "Medium Orange" },
  { color: "#fb923c", label: "Dark Orange" },
  { color: "#f97316", label: "Darker Orange" },
  { color: "#ea580c", label: "Very Dark Orange" },
  { color: "#c2410c", label: "Darkest Orange" },
  { color: "#9a3412", label: "Very Darkest Orange" },
  { color: "#fefce8", label: "Light Yellow" },
  { color: "#fef9c3", label: "Very Light Yellow" },
  { color: "#fef08a", label: "Yellow" },
  { color: "#fde047", label: "Medium Yellow" },
  { color: "#facc15", label: "Dark Yellow" },
  { color: "#eab308", label: "Darker Yellow" },
  { color: "#ca8a04", label: "Very Dark Yellow" },
  { color: "#a16207", label: "Darkest Yellow" },
  { color: "#713f12", label: "Very Darkest Yellow" },
  { color: "#f0fdf4", label: "Light Green" },
  { color: "#dcfce7", label: "Very Light Green" },
  { color: "#bbf7d0", label: "Green" },
  { color: "#86efac", label: "Medium Green" },
  { color: "#4ade80", label: "Dark Green" },
  { color: "#22c55e", label: "Darker Green" },
  { color: "#16a34a", label: "Very Dark Green" },
  { color: "#15803d", label: "Darkest Green" },
  { color: "#14532d", label: "Very Darkest Green" },
  { color: "#ecfdf5", label: "Light Emerald" },
  { color: "#d1fae5", label: "Very Light Emerald" },
  { color: "#a7f3d0", label: "Emerald" },
  { color: "#6ee7b7", label: "Medium Emerald" },
  { color: "#34d399", label: "Dark Emerald" },
  { color: "#10b981", label: "Darker Emerald" },
  { color: "#059669", label: "Very Dark Emerald" },
  { color: "#047857", label: "Darkest Emerald" },
  { color: "#064e3b", label: "Very Darkest Emerald" },
  { color: "#eff6ff", label: "Light Blue" },
  { color: "#dbeafe", label: "Very Light Blue" },
  { color: "#bfdbfe", label: "Blue" },
  { color: "#93c5fd", label: "Medium Blue" },
  { color: "#60a5fa", label: "Dark Blue" },
  { color: "#3b82f6", label: "Darker Blue" },
  { color: "#2563eb", label: "Very Dark Blue" },
  { color: "#1d4ed8", label: "Darkest Blue" },
  { color: "#1e3a8a", label: "Very Darkest Blue" },
  { color: "#f0f9ff", label: "Light Sky" },
  { color: "#e0f2fe", label: "Very Light Sky" },
  { color: "#bae6fd", label: "Sky" },
  { color: "#7dd3fc", label: "Medium Sky" },
  { color: "#38bdf8", label: "Dark Sky" },
  { color: "#0ea5e9", label: "Darker Sky" },
  { color: "#0284c7", label: "Very Dark Sky" },
  { color: "#0369a1", label: "Darkest Sky" },
  { color: "#0c4a6e", label: "Very Darkest Sky" },
  { color: "#faf5ff", label: "Light Purple" },
  { color: "#f3e8ff", label: "Very Light Purple" },
  { color: "#e9d5ff", label: "Purple" },
  { color: "#c084fc", label: "Medium Purple" },
  { color: "#a855f7", label: "Dark Purple" },
  { color: "#9333ea", label: "Darker Purple" },
  { color: "#7c3aed", label: "Very Dark Purple" },
  { color: "#6b21a8", label: "Darkest Purple" },
  { color: "#581c87", label: "Very Darkest Purple" },
  { color: "#fdf2f8", label: "Light Pink" },
  { color: "#fce7f3", label: "Very Light Pink" },
  { color: "#fbcfe8", label: "Pink" },
  { color: "#f9a8d4", label: "Medium Pink" },
  { color: "#f472b6", label: "Dark Pink" },
  { color: "#ec4899", label: "Darker Pink" },
  { color: "#db2777", label: "Very Dark Pink" },
  { color: "#be185d", label: "Darkest Pink" },
  { color: "#831843", label: "Very Darkest Pink" },
  { color: "#fffbeb", label: "Light Amber" },
  { color: "#fef3c7", label: "Very Light Amber" },
  { color: "#fde68a", label: "Amber" },
  { color: "#fcd34d", label: "Medium Amber" },
  { color: "#fbbf24", label: "Dark Amber" },
  { color: "#f59e0b", label: "Darker Amber" },
  { color: "#d97706", label: "Very Dark Amber" },
  { color: "#b45309", label: "Darkest Amber" },
  { color: "#92400e", label: "Very Darkest Amber" },
  { color: "#f7fee7", label: "Light Lime" },
  { color: "#ecfccb", label: "Very Light Lime" },
  { color: "#d9f99d", label: "Lime" },
  { color: "#bef264", label: "Medium Lime" },
  { color: "#a3e635", label: "Dark Lime" },
  { color: "#84cc16", label: "Darker Lime" },
  { color: "#65a30d", label: "Very Dark Lime" },
  { color: "#4d7c0f", label: "Darkest Lime" },
  { color: "#365314", label: "Very Darkest Lime" },
  { color: "#f0fdfa", label: "Light Teal" },
  { color: "#ccfbf1", label: "Very Light Teal" },
  { color: "#99f6e4", label: "Teal" },
  { color: "#5eead4", label: "Medium Teal" },
  { color: "#2dd4bf", label: "Dark Teal" },
  { color: "#14b8a6", label: "Darker Teal" },
  { color: "#0d9488", label: "Very Dark Teal" },
  { color: "#0f766e", label: "Darkest Teal" },
  { color: "#134e4a", label: "Very Darkest Teal" },
  { color: "#ecfeff", label: "Light Cyan" },
  { color: "#cffafe", label: "Very Light Cyan" },
  { color: "#a5f3fc", label: "Cyan" },
  { color: "#67e8f9", label: "Medium Cyan" },
  { color: "#22d3ee", label: "Dark Cyan" },
  { color: "#06b6d4", label: "Darker Cyan" },
  { color: "#0891b2", label: "Very Dark Cyan" },
  { color: "#0e7490", label: "Darkest Cyan" },
  { color: "#164e63", label: "Very Darkest Cyan" },
  { color: "#fff1f2", label: "Light Rose" },
  { color: "#ffe4e6", label: "Very Light Rose" },
  { color: "#fecdd3", label: "Rose" },
  { color: "#fda4af", label: "Medium Rose" },
  { color: "#fb7185", label: "Dark Rose" },
  { color: "#f43f5e", label: "Darker Rose" },
  { color: "#e11d48", label: "Very Dark Rose" },
  { color: "#be123c", label: "Darkest Rose" },
  { color: "#881337", label: "Very Darkest Rose" },
];

export default function PropertiesPanel({
  selectedElements,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  onBringToFront,
  onSendToBack,
  onClearSelection,
}: PropertiesPanelProps) {
  const hasSelection = selectedElements.length > 0;
  const selectedElement = selectedElements[0];
  const [isStrokeColorModalOpen, setIsStrokeColorModalOpen] = useState(false);
  const [isFillColorModalOpen, setIsFillColorModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);

  const updateSelectedElements = (updates: Partial<CanvasElement>) => {
    selectedElements.forEach((element) => {
      onElementUpdate(element.id, updates);
    });
  };

  if (!hasSelection) {
    return (
      <aside className="w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 shadow-lg p-6 overflow-y-auto h-full">
        <div className="flex items-center justify-center h-32 text-gray-600 dark:text-gray-400 text-sm">
          Select an element to edit properties
        </div>
      </aside>
    );
  }

  return (
    <>
      {(isMobile && isPropertiesPanelOpen) || !isMobile ? (
        <aside
          className={cn(
            "w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 shadow-lg p-6 overflow-y-auto h-full",
            isMobile && "pb-24"
          )}
        >
          <div className="space-y-4">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Properties
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearSelection();
                  if (isMobile) {
                    setIsPropertiesPanelOpen(false);
                  }
                }}
                className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200"
                title="Close properties panel"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>

            {/* Element Info */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-black dark:text-white">
                {/* Selection */}
                {selectedElements.length === 1 &&
                  `${
                    selectedElement.type.charAt(0).toUpperCase() +
                    selectedElement.type.slice(1)
                  }`}
              </h3>
              {/* <div
                className="text-sm text-gray-600 dark:text-gray-400"
                data-testid="text-selection-info"
              >
                {selectedElements.length === 1
                  ? `${
                      selectedElement.type.charAt(0).toUpperCase() +
                      selectedElement.type.slice(1)
                    } selected`
                  : `${selectedElements.length} elements selected`}
              </div> */}
            </div>

            {/* Stroke Properties - Only show for elements that have strokes */}
            {!["eraser", "laser"].includes(selectedElement.type) && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-3 text-black dark:text-white flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  Stroke
                </h3>

                {/* Stroke Color */}
                <div className="mb-3">
                  <Label className="text-xs font-medium text-black dark:text-white mb-2 block">
                    Color
                  </Label>
                  <div className="flex items-center gap-2">
                    {mainStrokeColors.map(({ color, label }) => (
                      <button
                        key={color}
                        className={`w-7 h-7 rounded-md border-2 transition-all duration-200 hover:scale-110 ${
                          selectedElement.strokeColor === color
                            ? "border-black dark:border-white shadow-md ring-2 ring-primary/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          updateSelectedElements({ strokeColor: color })
                        }
                        title={label}
                        data-testid={`stroke-color-${color}`}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStrokeColorModalOpen(true)}
                      className="w-7 h-7 p-0 flex items-center justify-center border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                      title="More colors"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="mb-3">
                  <Label className="text-xs font-medium text-black dark:text-white mb-2 block">
                    Width: {selectedElement.strokeWidth}px
                  </Label>
                  <Slider
                    value={[selectedElement.strokeWidth]}
                    onValueChange={([value]) =>
                      updateSelectedElements({ strokeWidth: value })
                    }
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                    data-testid="slider-stroke-width"
                  />
                </div>

                {/* Stroke Style */}
                <div className="mb-3">
                  <Label className="text-xs font-medium text-black dark:text-white mb-2 block">
                    Style
                  </Label>
                  <div className="flex gap-2">
                    {["solid", "dashed", "dotted"].map((style) => (
                      <Button
                        key={style}
                        variant={
                          selectedElement.strokeStyle === style
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updateSelectedElements({ strokeStyle: style as any })
                        }
                        className="text-xs capitalize text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                        data-testid={`stroke-style-${style}`}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fill Properties - Only show for elements that can have fills */}
            {!["freehand", "line", "arrow", "eraser", "laser"].includes(
              selectedElement.type
            ) && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-3 text-black dark:text-white flex items-center">
                  <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                  Fill
                </h3>

                {/* Fill Color */}
                <div className="mb-3">
                  <Label className="text-xs font-medium text-black dark:text-white mb-2 block">
                    Fill Color
                  </Label>
                  <div className="flex items-center gap-2">
                    {mainFillColors.map(({ color, label }) => (
                      <button
                        key={color}
                        className={`w-7 h-7 rounded-md border-2 transition-all duration-200 hover:scale-110 ${
                          selectedElement.fillColor === color
                            ? "border-black dark:border-white shadow-md ring-2 ring-primary/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        } ${
                          color === "transparent"
                            ? "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 relative"
                            : ""
                        }`}
                        style={{
                          backgroundColor:
                            color === "transparent" ? undefined : color,
                        }}
                        onClick={() =>
                          updateSelectedElements({ fillColor: color })
                        }
                        title={label}
                        data-testid={`fill-color-${color}`}
                      >
                        {color === "transparent" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-0.5 bg-gray-500 dark:bg-gray-400 rotate-45"></div>
                          </div>
                        )}
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFillColorModalOpen(true)}
                      className="w-7 h-7 p-0 flex items-center justify-center border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                      title="More colors"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Text Properties (for text elements) */}
            {selectedElement.type === "text" && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-3 text-black dark:text-white flex items-center">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                  Text
                </h3>

                {/* Font Size */}
                <div className="mb-3">
                  <Label className="text-xs font-medium text-black dark:text-white mb-2 block">
                    Size: {selectedElement.fontSize || 16}px
                  </Label>
                  <Slider
                    value={[selectedElement.fontSize || 16]}
                    onValueChange={([value]) =>
                      updateSelectedElements({ fontSize: value })
                    }
                    min={8}
                    max={72}
                    step={1}
                    className="w-full"
                    data-testid="slider-font-size"
                  />
                </div>

                {/* Font Weight */}
                <div className="mb-3">
                  <Label className="text-xs font-medium text-black dark:text-white mb-2 block">
                    Weight
                  </Label>
                  <div className="flex gap-2">
                    {["normal", "bold"].map((weight) => (
                      <Button
                        key={weight}
                        variant={
                          selectedElement.fontWeight === weight
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updateSelectedElements({ fontWeight: weight as any })
                        }
                        className="text-xs capitalize text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                        data-testid={`font-weight-${weight}`}
                      >
                        {weight}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={cn("bg-gray-100 dark:bg-gray-700 rounded-lg p-3")}>
              <h3 className="text-sm font-semibold mb-3 text-black dark:text-white flex items-center">
                <div className="w-2 h-2 bg-destructive rounded-full mr-2"></div>
                Actions
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onElementDuplicate(selectedElement)}
                  className="text-xs text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  data-testid="button-duplicate"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onElementDelete(selectedElement.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-600"
                  data-testid="button-delete"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBringToFront(selectedElement.id)}
                  className="text-xs text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  data-testid="button-bring-to-front"
                >
                  <ArrowUp className="w-3 h-3 mr-1" />
                  To Front
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendToBack(selectedElement.id)}
                  className="text-xs text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  data-testid="button-send-to-back"
                >
                  <ArrowDown className="w-3 h-3 mr-1" />
                  To Back
                </Button>
              </div>
            </div>
          </div>

          {/* Color Picker Modals - Only show if the corresponding properties are visible */}
          {!["eraser", "laser"].includes(selectedElement.type) && (
            <ColorPickerModal
              isOpen={isStrokeColorModalOpen}
              onClose={() => setIsStrokeColorModalOpen(false)}
              onColorSelect={(color) =>
                updateSelectedElements({ strokeColor: color })
              }
              selectedColor={selectedElement.strokeColor}
              title="Choose Stroke Color"
              colors={allStrokeColors}
            />
          )}

          {!["freehand", "line", "arrow", "eraser", "laser"].includes(
            selectedElement.type
          ) && (
            <ColorPickerModal
              isOpen={isFillColorModalOpen}
              onClose={() => setIsFillColorModalOpen(false)}
              onColorSelect={(color) =>
                updateSelectedElements({ fillColor: color })
              }
              selectedColor={selectedElement.fillColor}
              title="Choose Fill Color"
              colors={allFillColors}
            />
          )}
        </aside>
      ) : (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-lg text-black dark:text-white"
            onClick={() => setIsPropertiesPanelOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Properties
          </Button>
        </div>
      )}
    </>
  );
}
