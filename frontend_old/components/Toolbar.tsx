"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type BackgroundType } from "@/types/canvas";
import { ZoomIn, ZoomOut, Edit3, Check, X, Undo, Redo } from "lucide-react";
import {
  exportToPNG,
  exportToSVG,
  exportToJSON,
  downloadFile,
} from "@/lib/export-utils";
import { type CanvasElement } from "@/types/canvas";
import HamburgerMenu from "./HamburgerMenu";
import { ThemeToggle } from "./ThemeToggle";

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
}: ToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(drawingName);

  const handleExport = (format: "png" | "svg" | "json") => {
    let content: string;
    let filename: string;
    let mimeType: string;

    const baseFilename = drawingName || "untitled-drawing";
    const backgroundColor = "#ffffff"; // Default white background

    switch (format) {
      case "png":
        content = exportToPNG(elements, backgroundType as any, backgroundColor);
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

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm">
      {/* Left Section - Hamburger Menu & Undo/Redo */}
      <div className="flex items-center gap-2">
        <HamburgerMenu
          onNew={onNewCanvas}
          onOpen={onOpen}
          onExport={handleExport}
          onBackgroundTypeChange={onBackgroundTypeChange}
          onShare={onShare}
          backgroundType={backgroundType}
        />

        {/* Undo/Redo Buttons */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canRedo}
            className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Center Section - Drawing Name */}
      <div className="flex items-center justify-center flex-1 px-4">
        <div className="flex items-center gap-2 min-w-0 max-w-2xl">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameSave}
                className="text-2xl font-bold bg-background border-primary/20 focus:border-primary min-w-0 max-w-96 text-center p-0"
                placeholder="Untitled drawing"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNameSave}
                className="p-1 h-8 w-8 text-green-600 hover:bg-green-50"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNameCancel}
                className="p-1 h-8 w-8 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={handleNameEdit}
              className="flex items-center gap-2 px-4 py-2 hover:bg-accent transition-colors group"
            >
              <h1 className="text-xl font-bold text-foreground min-w-0 truncate max-w-2xl text-center">
                {drawingName || "Untitled drawing"}
              </h1>
              <Edit3 className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Right Section - Zoom Controls & Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={onZoomOut}
            data-testid="button-zoom-out"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            className="text-sm font-medium min-w-12 text-center px-3 py-1 bg-background rounded"
            data-testid="text-zoom-level"
            onClick={onFitToContent}
            variant="default"
          >
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={onZoomIn}
            data-testid="button-zoom-in"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
