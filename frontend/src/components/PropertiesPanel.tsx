import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ArrowDownToLine,
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  Copy,
  Trash2,
  MoreHorizontal,
  Settings,
  Italic,
  Underline,
  Pencil,
  Code,
  X,
} from "lucide-react";
import { type CanvasElement } from "@/types/canvas";
import { measureTextSize } from "@/lib/canvas-utils";
import {
  TEXT_FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  DEFAULT_FONT_FAMILY,
} from "@/lib/fonts";
import ColorPickerModal from "./ColorPickerModal";
import { islandClass } from "./ToolPalette";
import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Small inline icons for the Edges / Fill-style controls so they visually match
// the swatches in the reference design rather than relying on generic glyphs.
const SharpEdgeIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
    <path
      d="M4 9V5a1 1 0 0 1 1-1h4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const RoundEdgeIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
    <path
      d="M4 9V8a4 4 0 0 1 4-4h1"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const HachureIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4">
    <defs>
      <clipPath id="hachure-clip">
        <rect x="3" y="3" width="14" height="14" rx="2" />
      </clipPath>
    </defs>
    <rect
      x="3.75"
      y="3.75"
      width="12.5"
      height="12.5"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <g clipPath="url(#hachure-clip)" stroke="currentColor" strokeWidth="1.25">
      <path d="M-2 6 L8 -4 M-2 12 L14 -4 M-2 18 L20 -4 M4 18 L20 2 M10 18 L20 8" />
    </g>
  </svg>
);

const CrossHatchIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4">
    <defs>
      <clipPath id="crosshatch-clip">
        <rect x="3" y="3" width="14" height="14" rx="2" />
      </clipPath>
    </defs>
    <rect
      x="3.75"
      y="3.75"
      width="12.5"
      height="12.5"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <g clipPath="url(#crosshatch-clip)" stroke="currentColor" strokeWidth="1">
      {/* "/" diagonals */}
      <path d="M3 11 L11 3 M3 17 L17 3 M9 17 L17 9" />
      {/* "\" diagonals */}
      <path d="M3 9 L11 17 M3 3 L17 17 M9 3 L17 11" />
    </g>
  </svg>
);

const SolidFillIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4">
    <rect x="4" y="4" width="12" height="12" rx="2.5" fill="currentColor" />
  </svg>
);

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  onElementsUpdate: (
    updatesById: Record<string, Partial<CanvasElement>>
  ) => void;
  onElementDelete: (id: string) => void;
  onElementDuplicate: (element: CanvasElement) => void;
  onBringToFront: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onSendToBack: (id: string) => void;
  onClearSelection: () => void;
}

// Which properties actually make sense for each element type. The panel renders
// a section only if the capability is present for *every* selected element
// (intersection), so e.g. an image never shows stroke/fill controls and a mixed
// selection only shows what they share.
type Capability =
  | "stroke"
  | "fill"
  | "edges"
  | "sloppiness"
  | "strokeWidth"
  | "strokeStyle"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "fontStyle"
  | "textDecoration"
  | "opacity";

const ELEMENT_CAPS: Record<string, Capability[]> = {
  rectangle: ["stroke", "fill", "edges", "sloppiness", "strokeWidth", "strokeStyle", "opacity"],
  ellipse: ["stroke", "fill", "sloppiness", "strokeWidth", "strokeStyle", "opacity"],
  diamond: ["stroke", "fill", "edges", "sloppiness", "strokeWidth", "strokeStyle", "opacity"],
  line: ["stroke", "sloppiness", "strokeWidth", "strokeStyle", "opacity"],
  arrow: ["stroke", "sloppiness", "strokeWidth", "strokeStyle", "opacity"],
  freehand: ["stroke", "strokeWidth", "strokeStyle", "opacity"],
  text: [
    "stroke",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "textDecoration",
    "opacity",
  ],
  image: ["opacity"],
  embed: ["opacity"],
  eraser: [],
  laser: [],
};

// Main colors shown in the properties panel (Excalidraw-style palette)
const mainStrokeColors = [
  { color: "#1e1e1e", label: "Ink" },
  { color: "#e03131", label: "Red" },
  { color: "#2f9e44", label: "Green" },
  { color: "#1971c2", label: "Blue" },
  { color: "#f08c00", label: "Orange" },
];

const mainFillColors = [
  { color: "transparent", label: "Transparent" },
  { color: "#ffc9c9", label: "Red" },
  { color: "#b2f2bb", label: "Green" },
  { color: "#a5d8ff", label: "Blue" },
  { color: "#ffec99", label: "Yellow" },
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
  onElementsUpdate,
  onElementDelete,
  onElementDuplicate,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onClearSelection,
}: PropertiesPanelProps) {
  const hasSelection = selectedElements.length > 0;
  const selectedElement = selectedElements[0];

  // Capabilities common to the whole selection (intersection of per-type caps).
  const caps = useMemo(() => {
    let common: Capability[] | null = null;
    for (const el of selectedElements) {
      const set = ELEMENT_CAPS[el.type] ?? [];
      common =
        common === null ? set : common.filter((c) => set.includes(c));
    }
    return new Set<Capability>(common ?? []);
  }, [selectedElements]);
  const has = (c: Capability) => caps.has(c);

  const [isStrokeColorModalOpen, setIsStrokeColorModalOpen] = useState(false);
  const [isFillColorModalOpen, setIsFillColorModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);

  // Apply the same update to every selected element in one batched call.
  // Looping onElementUpdate dropped all but the last element (each call was
  // computed from the same stale snapshot).
  const updateSelectedElements = (updates: Partial<CanvasElement>) => {
    const byId: Record<string, Partial<CanvasElement>> = {};
    selectedElements.forEach((element) => {
      byId[element.id] = updates;
    });
    onElementsUpdate(byId);
  };

  // Font size/weight changes also resize the text box so the selection outline
  // and hit-box keep matching the rendered glyphs.
  const updateFontSize = (fontSize: number) => {
    const byId: Record<string, Partial<CanvasElement>> = {};
    selectedElements.forEach((el) => {
      if (el.type === "text") {
        const dims = measureTextSize(
          el.data?.text || "",
          fontSize,
          el.fontWeight ?? "normal",
          el.data?.fontFamily ?? DEFAULT_FONT_FAMILY,
          el.fontStyle ?? "normal"
        );
        byId[el.id] = { fontSize, width: dims.width, height: dims.height };
      } else {
        byId[el.id] = { fontSize };
      }
    });
    onElementsUpdate(byId);
  };

  // Font family lives on element.data, so merge into data (preserving text)
  // and re-measure since glyph widths differ between typefaces.
  const updateFontFamily = (fontFamily: string) => {
    const byId: Record<string, Partial<CanvasElement>> = {};
    selectedElements.forEach((el) => {
      if (el.type === "text") {
        const dims = measureTextSize(
          el.data?.text || "",
          el.fontSize ?? 16,
          el.fontWeight ?? "normal",
          fontFamily,
          el.fontStyle ?? "normal"
        );
        byId[el.id] = {
          data: { ...el.data, fontFamily },
          width: dims.width,
          height: dims.height,
        };
      }
    });
    onElementsUpdate(byId);
  };

  const updateFontWeight = (fontWeight: "normal" | "bold") => {
    const byId: Record<string, Partial<CanvasElement>> = {};
    selectedElements.forEach((el) => {
      if (el.type === "text") {
        const dims = measureTextSize(
          el.data?.text || "",
          el.fontSize ?? 16,
          fontWeight,
          el.data?.fontFamily ?? DEFAULT_FONT_FAMILY,
          el.fontStyle ?? "normal"
        );
        byId[el.id] = { fontWeight, width: dims.width, height: dims.height };
      } else {
        byId[el.id] = { fontWeight };
      }
    });
    onElementsUpdate(byId);
  };

  // Italic changes glyph metrics slightly, so re-measure the box. Underline does
  // not affect layout, so a plain property update is enough for it.
  const updateFontStyle = (fontStyle: "normal" | "italic") => {
    const byId: Record<string, Partial<CanvasElement>> = {};
    selectedElements.forEach((el) => {
      if (el.type === "text") {
        const dims = measureTextSize(
          el.data?.text || "",
          el.fontSize ?? 16,
          el.fontWeight ?? "normal",
          el.data?.fontFamily ?? DEFAULT_FONT_FAMILY,
          fontStyle
        );
        byId[el.id] = { fontStyle, width: dims.width, height: dims.height };
      } else {
        byId[el.id] = { fontStyle };
      }
    });
    onElementsUpdate(byId);
  };

  // Shared styling helpers for the floating panel
  const sectionLabel =
    "mb-1.5 block text-[11px] font-medium text-gray-500 dark:text-[#9a9aa6]";

  const swatchClass = (active: boolean) =>
    cn(
      "h-6 w-6 shrink-0 rounded-md border transition-transform hover:scale-110",
      active
        ? "border-transparent ring-2 ring-[#6965db] ring-offset-1 ring-offset-white dark:ring-offset-[#232329]"
        : "border-gray-300 dark:border-[#3a3a44]"
    );

  const pillClass = (active: boolean) =>
    cn(
      "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
      active
        ? "border-transparent bg-[#e0dfff] text-[#4a47b1] dark:bg-[#46437e] dark:text-white"
        : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-[#3a3a44] dark:text-[#ced4da] dark:hover:bg-[#31303b]"
    );

  // Return null if no elements are selected to prevent flickering
  if (!hasSelection) {
    return null;
  }

  return (
    <>
      {(isMobile && isPropertiesPanelOpen) || !isMobile ? (
        <aside
          className={cn(
            "fixed z-40 rounded-xl p-3",
            islandClass,
            isMobile
              ? "bottom-3 left-1/2 max-h-[62vh] w-[19rem] -translate-x-1/2 overflow-y-auto"
              : "left-4 top-[4.75rem] w-[14rem] max-h-[calc(100vh-7rem)] overflow-y-auto"
          )}
        >
          {/* Header (mobile gets a close affordance; desktop stays minimal) */}
          {isMobile && (
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-black dark:text-white">
                Properties
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onClearSelection();
                  setIsPropertiesPanelOpen(false);
                }}
                className="h-7 w-7 rounded-lg p-0 hover:bg-gray-100 dark:hover:bg-[#31303b]"
                title="Close"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-[#9a9aa6]" />
              </Button>
            </div>
          )}

          <div className="space-y-3.5">
            {/* Stroke color */}
            {has("stroke") && (
              <div>
                <Label className={sectionLabel}>Stroke</Label>
                <div className="flex items-center gap-1.5">
                  {mainStrokeColors.map(({ color, label }) => (
                    <button
                      key={color}
                      className={swatchClass(
                        selectedElement.strokeColor === color
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        updateSelectedElements({ strokeColor: color })
                      }
                      title={label}
                      data-testid={`stroke-color-${color}`}
                    />
                  ))}
                  <div className="mx-0.5 h-6 w-px bg-gray-200 dark:bg-[#3a3a44]" />
                  <button
                    onClick={() => setIsStrokeColorModalOpen(true)}
                    className={cn(
                      swatchClass(false),
                      "flex items-center justify-center"
                    )}
                    style={{ backgroundColor: selectedElement.strokeColor }}
                    title="More colors"
                  >
                    <MoreHorizontal className="h-3 w-3 mix-blend-difference text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Background / fill color */}
            {has("fill") && (
              <div>
                <Label className={sectionLabel}>Background</Label>
                <div className="flex items-center gap-1.5">
                  {mainFillColors.map(({ color, label }) => (
                    <button
                      key={color}
                      className={cn(
                        swatchClass(selectedElement.fillColor === color),
                        color === "transparent" && "bg-transparent"
                      )}
                      style={{
                        backgroundColor:
                          color === "transparent" ? undefined : color,
                        backgroundImage:
                          color === "transparent"
                            ? "linear-gradient(45deg,#bbb 25%,transparent 25%),linear-gradient(-45deg,#bbb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#bbb 75%),linear-gradient(-45deg,transparent 75%,#bbb 75%)"
                            : undefined,
                        backgroundSize:
                          color === "transparent" ? "8px 8px" : undefined,
                        backgroundPosition:
                          color === "transparent"
                            ? "0 0,0 4px,4px -4px,-4px 0"
                            : undefined,
                      }}
                      onClick={() =>
                        updateSelectedElements({ fillColor: color })
                      }
                      title={label}
                      data-testid={`fill-color-${color}`}
                    />
                  ))}
                  <div className="mx-0.5 h-6 w-px bg-gray-200 dark:bg-[#3a3a44]" />
                  <button
                    onClick={() => setIsFillColorModalOpen(true)}
                    className={cn(
                      swatchClass(false),
                      "flex items-center justify-center"
                    )}
                    style={{
                      backgroundColor:
                        selectedElement.fillColor === "transparent"
                          ? undefined
                          : selectedElement.fillColor,
                    }}
                    title="More colors"
                  >
                    <MoreHorizontal className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            )}

            {/* Fill style — only meaningful once a (non-transparent) fill is set */}
            {has("fill") &&
              selectedElement.fillColor &&
              selectedElement.fillColor !== "transparent" && (
                <div>
                  <Label className={sectionLabel}>Fill</Label>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { value: "solid", label: "Solid", Icon: SolidFillIcon },
                        { value: "hachure", label: "Hachure", Icon: HachureIcon },
                        {
                          value: "cross-hatch",
                          label: "Cross-hatch",
                          Icon: CrossHatchIcon,
                        },
                      ] as const
                    ).map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        onClick={() =>
                          updateSelectedElements({ fillStyle: value })
                        }
                        className={pillClass(
                          (selectedElement.fillStyle ?? "solid") === value
                        )}
                        title={label}
                        data-testid={`fill-style-${value}`}
                      >
                        <Icon />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Edges — sharp vs rounded corners */}
            {has("edges") && (
              <div>
                <Label className={sectionLabel}>Edges</Label>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { value: "sharp", label: "Sharp", Icon: SharpEdgeIcon },
                      { value: "round", label: "Round", Icon: RoundEdgeIcon },
                    ] as const
                  ).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateSelectedElements({ edges: value })}
                      className={pillClass(
                        (selectedElement.edges ?? "sharp") === value
                      )}
                      title={label}
                      data-testid={`edges-${value}`}
                    >
                      <Icon />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sloppiness — hand-drawn (rough.js) outline vs precise. On by
                default; toggling off renders crisp geometry. */}
            {has("sloppiness") && (
              <div>
                <Label className={sectionLabel}>Sloppiness</Label>
                <button
                  onClick={() =>
                    updateSelectedElements({
                      roughness:
                        (selectedElement.roughness ?? 1) > 0 ? 0 : 1,
                    })
                  }
                  className={cn(
                    pillClass((selectedElement.roughness ?? 1) > 0),
                    "w-auto gap-1.5 px-2.5 text-xs font-medium"
                  )}
                  title="Hand-drawn look"
                  data-testid="toggle-sloppiness"
                >
                  <Pencil className="h-4 w-4" />
                  {(selectedElement.roughness ?? 1) > 0 ? "Sloppy" : "Precise"}
                </button>
              </div>
            )}

            {/* Stroke width */}
            {has("strokeWidth") && (
              <div>
                <Label className={sectionLabel}>Stroke width</Label>
                <div className="flex items-center gap-1.5">
                  {[
                    { w: 1, label: "Thin" },
                    { w: 2, label: "Bold" },
                    { w: 4, label: "Extra bold" },
                  ].map(({ w, label }) => (
                    <button
                      key={w}
                      onClick={() => updateSelectedElements({ strokeWidth: w })}
                      className={pillClass(selectedElement.strokeWidth === w)}
                      title={label}
                      data-testid={`stroke-width-${w}`}
                    >
                      <span
                        className="block w-5 rounded-full bg-current"
                        style={{ height: Math.max(1, w) }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stroke style */}
            {has("strokeStyle") && (
              <div>
                <Label className={sectionLabel}>Stroke style</Label>
                <div className="flex items-center gap-1.5">
                  {(["solid", "dashed", "dotted"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => updateSelectedElements({ strokeStyle: style })}
                      className={pillClass(selectedElement.strokeStyle === style)}
                      title={style}
                      data-testid={`stroke-style-${style}`}
                    >
                      <span
                        className="block w-5 border-t-2 border-current"
                        style={{
                          borderStyle:
                            style === "solid"
                              ? "solid"
                              : style === "dashed"
                              ? "dashed"
                              : "dotted",
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Font family */}
            {has("fontFamily") && (
              <div>
                <Label className={sectionLabel}>Font family</Label>
                <div className="flex items-center gap-1.5">
                  {TEXT_FONT_OPTIONS.map((font) => {
                    const current =
                      selectedElement.data?.fontFamily ?? DEFAULT_FONT_FAMILY;
                    return (
                      <button
                        key={font.key}
                        onClick={() => updateFontFamily(font.fontFamily)}
                        className={pillClass(current === font.fontFamily)}
                        title={font.label}
                        data-testid={`font-family-${font.key}`}
                      >
                        {font.key === "hand" ? (
                          <Pencil className="h-4 w-4" />
                        ) : font.key === "code" ? (
                          <Code className="h-4 w-4" />
                        ) : (
                          <span
                            className="text-base leading-none"
                            style={{ fontFamily: font.fontFamily }}
                          >
                            A
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Font size — quick S / M / L / XL presets (drag the text box to
                fine-tune in between). */}
            {has("fontSize") && (
              <div>
                <Label className={sectionLabel}>Font size</Label>
                <div className="flex items-center gap-1.5">
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size.label}
                      onClick={() => updateFontSize(size.value)}
                      className={pillClass(
                        (selectedElement.fontSize || 16) === size.value
                      )}
                      title={`${size.label} (${size.value}px)`}
                      data-testid={`font-size-${size.label}`}
                    >
                      <span className="text-xs font-semibold">
                        {size.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(has("fontWeight") ||
              has("fontStyle") ||
              has("textDecoration")) && (
              <div>
                <Label className={sectionLabel}>Style</Label>
                <div className="flex items-center gap-1.5">
                  {has("fontWeight") && (
                    <button
                      onClick={() =>
                        updateFontWeight(
                          (selectedElement.fontWeight ?? "normal") === "bold"
                            ? "normal"
                            : "bold"
                        )
                      }
                      className={cn(
                        pillClass(selectedElement.fontWeight === "bold"),
                        "font-bold"
                      )}
                      title="Bold"
                      data-testid="font-weight-bold"
                    >
                      B
                    </button>
                  )}
                  {has("fontStyle") && (
                    <button
                      onClick={() =>
                        updateFontStyle(
                          (selectedElement.fontStyle ?? "normal") === "italic"
                            ? "normal"
                            : "italic"
                        )
                      }
                      className={pillClass(selectedElement.fontStyle === "italic")}
                      title="Italic"
                      data-testid="font-style-italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                  )}
                  {has("textDecoration") && (
                    <button
                      onClick={() =>
                        updateSelectedElements({
                          textDecoration:
                            (selectedElement.textDecoration ?? "none") ===
                            "underline"
                              ? "none"
                              : "underline",
                        })
                      }
                      className={pillClass(
                        selectedElement.textDecoration === "underline"
                      )}
                      title="Underline"
                      data-testid="text-decoration-underline"
                    >
                      <Underline className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Opacity */}
            {has("opacity") && (
            <div>
              <Label className={sectionLabel}>Opacity</Label>
              <Slider
                value={[Math.round((selectedElement.opacity ?? 1) * 100)]}
                onValueChange={([value]) =>
                  updateSelectedElements({ opacity: value / 100 })
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
                data-testid="slider-opacity"
              />
              <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-[#7a7a86]">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
            )}

            {/* Layers */}
            <div>
              <Label className={sectionLabel}>Layers</Label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSendToBack(selectedElement.id)}
                  className={pillClass(false)}
                  title="Send to back"
                  data-testid="button-send-to-back"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onSendBackward(selectedElement.id)}
                  className={pillClass(false)}
                  title="Send backward"
                  data-testid="button-send-backward"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onBringForward(selectedElement.id)}
                  className={pillClass(false)}
                  title="Bring forward"
                  data-testid="button-bring-forward"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onBringToFront(selectedElement.id)}
                  className={pillClass(false)}
                  title="Bring to front"
                  data-testid="button-bring-to-front"
                >
                  <ArrowUpToLine className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <Label className={sectionLabel}>Actions</Label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onElementDuplicate(selectedElement)}
                  className={pillClass(false)}
                  title="Duplicate"
                  data-testid="button-duplicate"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onElementDelete(selectedElement.id)}
                  className={cn(
                    pillClass(false),
                    "text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  )}
                  title="Delete"
                  data-testid="button-delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Color Picker Modals - Only show if the corresponding properties are visible */}
          {has("stroke") && (
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

          {has("fill") && (
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
      ) : isMobile ? (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 transform">
          <button
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#ced4da]",
              islandClass
            )}
            onClick={() => setIsPropertiesPanelOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Properties
          </button>
        </div>
      ) : null}
    </>
  );
}
