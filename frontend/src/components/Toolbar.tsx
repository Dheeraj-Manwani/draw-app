import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type BackgroundType } from "@/types/canvas";
import {
  ZoomIn,
  ZoomOut,
  Check,
  X,
  Undo,
  Redo,
  LogIn,
  Share2,
} from "lucide-react";
import {
  exportToPNG,
  exportToSVG,
  exportToJSON,
  downloadFile,
} from "@/lib/export-utils";
import { type CanvasElement } from "@/types/canvas";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";
import HamburgerMenu from "./HamburgerMenu";
import { ThemeToggle } from "./ThemeToggle";
import UserAvatar from "./UserAvatar";
import { islandClass } from "./ToolPalette";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  backgroundType: string;
  elements: CanvasElement[];
  drawingName: string;
  onDrawingNameChange: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToContent: () => void;
  onBackgroundTypeChange: (type: BackgroundType) => void;
  onNewCanvas: () => void;
  onOpen: () => void;
  onShare: () => void;
  onClearCanvas: () => void;
  isSignedIn?: boolean;
  onShowLoginModal?: () => void;
  textInput?: {
    element: CanvasElement;
    position: { x: number; y: number };
    isEditing?: boolean;
  } | null;
  showDrawingInstruction?: boolean;
}

export default function Toolbar({
  canUndo,
  canRedo,
  zoom,
  backgroundType,
  elements,
  drawingName,
  onDrawingNameChange,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitToContent,
  onBackgroundTypeChange,
  onNewCanvas,
  onOpen,
  onShare,
  onClearCanvas,
  isSignedIn = true,
  onShowLoginModal,
  textInput,
  showDrawingInstruction = false,
}: ToolbarProps) {
  const { theme } = useTheme();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(drawingName);
  const isMobile = useIsMobile();

  const handleExport = (format: "png" | "svg" | "json") => {
    let content: string;
    let filename: string;
    let mimeType: string;

    const baseFilename = drawingName || "untitled-drawing";
    const backgroundColor = "#ffffff"; // Default white background

    switch (format) {
      case "png":
        content = exportToPNG(
          elements,
          backgroundType as any,
          backgroundColor,
          { format: "png" },
          theme
        );
        filename = `${baseFilename}.png`;
        mimeType = "image/png";

        // For PNG, we need to trigger download differently
        const link = document.createElement("a");
        link.download = filename;
        link.href = content;
        link.click();
        return;

      case "svg":
        content = exportToSVG(elements, backgroundType as any, backgroundColor);
        filename = `${baseFilename}.svg`;
        mimeType = "image/svg+xml";
        break;

      case "json":
        content = exportToJSON(
          elements,
          backgroundType as any,
          backgroundColor
        );
        filename = `${baseFilename}.json`;
        mimeType = "application/json";
        break;
    }

    downloadFile(content, filename, mimeType);
  };

  const handleNameEdit = () => {
    setTempName(drawingName);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    onDrawingNameChange(tempName || "Untitled drawing");
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(drawingName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  const ghostBtn =
    "h-8 w-8 p-0 rounded-lg text-gray-700 dark:text-[#ced4da] hover:bg-gray-100 dark:hover:bg-[#31303b] disabled:opacity-40 transition-colors";

  return (
    <>
      {/* Centered helper hint below the top toolbar */}
      {(textInput || showDrawingInstruction) && (
        <div className="pointer-events-none fixed left-1/2 top-[4.25rem] z-30 -translate-x-1/2 transform">
          <p className="text-sm font-medium text-gray-500 dark:text-[#9a9aa6]">
            {textInput
              ? "Click anywhere else to finalize the text"
              : "Click and drag, release when you're finished"}
          </p>
        </div>
      )}

      {/* Top-left: menu + drawing name */}
      <div className="fixed left-4 top-4 z-40 flex items-center gap-2">
        <div className={cn("rounded-xl p-1", islandClass)}>
          <HamburgerMenu
            onNew={onNewCanvas}
            onOpen={onOpen}
            onExport={handleExport}
            onBackgroundTypeChange={onBackgroundTypeChange}
            onShare={onShare}
            onClearCanvas={onClearCanvas}
            backgroundType={backgroundType}
          />
        </div>

        {!isMobile && (
          <div className={cn("rounded-xl px-1 py-1", islandClass)}>
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleNameSave}
                  className="h-8 w-44 border-0 bg-transparent px-2 text-sm font-medium text-black focus-visible:ring-0 dark:text-white"
                  placeholder="Untitled drawing"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNameSave}
                  className="h-8 w-8 rounded-lg p-0 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNameCancel}
                  className="h-8 w-8 rounded-lg p-0 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={handleNameEdit}
                className="flex h-8 max-w-[16rem] items-center rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-[#ced4da] dark:hover:bg-[#31303b]"
                title="Rename drawing"
              >
                <span className="truncate">
                  {drawingName || "Untitled drawing"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Top-right: theme, share, user */}
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2">
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-xl px-1 py-1",
            islandClass
          )}
        >
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className={cn(ghostBtn, isMobile && "h-7 w-7")}
            title="Share / Export"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className={cn("rounded-full p-0.5", islandClass)}>
          {isSignedIn ? (
            <UserAvatar size="sm" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={cn(ghostBtn, "rounded-full")}
              title="Login"
              onClick={onShowLoginModal}
            >
              <LogIn className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom-left: zoom + undo/redo */}
      <div
        className={cn(
          "fixed bottom-4 left-4 z-40 flex items-center gap-2",
          isMobile && "bottom-3 left-3 gap-1.5"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-xl px-0.5 py-0.5",
            islandClass
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className={ghostBtn}
            onClick={onZoomOut}
            data-testid="button-zoom-out"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            className="min-w-[3.25rem] rounded-lg px-1 py-1 text-center text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:text-[#ced4da] dark:hover:bg-[#31303b]"
            data-testid="text-zoom-level"
            onClick={onFitToContent}
            title="Reset / fit to content"
          >
            {Math.round(zoom * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            className={ghostBtn}
            onClick={onZoomIn}
            data-testid="button-zoom-in"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={cn(
            "flex items-center rounded-xl px-0.5 py-0.5",
            islandClass
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            disabled={!canUndo}
            className={ghostBtn}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={!canRedo}
            className={ghostBtn}
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
