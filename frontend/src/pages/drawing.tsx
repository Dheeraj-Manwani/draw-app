import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useCanvas } from "@/hooks/useCanvas";
import { useElementSync } from "@/hooks/useElementSync";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import ToolPalette from "@/components/ToolPalette";
import PropertiesPanel from "@/components/PropertiesPanel";
import AIDiagramModal from "@/components/AIDiagramModal";
import LottieLoader from "@/components/LottieLoader";
import MetaTags from "@/components/MetaTags";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import LoginModal from "@/components/LoginModal";
import { type CanvasElement } from "@/types/canvas";
import { useTheme } from "@/contexts/ThemeContext";
import { getInitialStrokeColor } from "@/utils/themeUtils";
import { getContentCenter, getElementsBounds } from "@/lib/canvas-geometry";
import { openDrawingFromFile, shareDrawing } from "@/lib/drawing-io";

// Generate a unique room ID for this session
const ROOM_ID = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Approximate viewport used when centering content (zoom/pan math).
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

export default function Drawing() {
  const { toast } = useToast();
  const { theme } = useTheme();
  // Clerk auth temporarily disabled — treat user as signed in
  const isSignedIn = true;

  const [match] = useRoute("/drawing/:id");
  const [drawingName, setDrawingName] = useState("Untitled drawing");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [textInput, setTextInput] = useState<{
    element: CanvasElement;
    position: { x: number; y: number };
    isEditing?: boolean;
  } | null>(null);

  const handleTextInputChange = useCallback(
    (newTextInput: typeof textInput) => setTextInput(newTextInput),
    []
  );

  // Determine if we're on the "/" route (no params) or "/drawing/:id" route
  const isDefaultRoute = !match; // No match means we're on "/"
  const currentRoomId = isDefaultRoute ? "default_drawing" : ROOM_ID;

  const {
    state,
    addElement,
    updateElement,
    deleteElement,
    deleteMultiElements,
    selectElement,
    selectMultipleElements,
    clearSelection,
    setTool,
    setZoom,
    setPan,
    setBackgroundType,
    setBackgroundColor,
    toggleToolLock,
    undo,
    redo,
    canUndo,
    canRedo,
    getSelectedElements,
    saveToLocalStorage,
    loadFromLocalStorage,
  } = useCanvas();

  // Fetch elements for the room - only for non-default routes
  const { isLoading } = useQuery({
    queryKey: ["/api/rooms", ROOM_ID, "elements"],
    enabled: !isDefaultRoute,
  });

  // Element CRUD with optimistic local updates + best-effort backend sync
  const { handleElementCreate, handleElementUpdate, handleElementDelete } =
    useElementSync({
      roomId: ROOM_ID,
      isDefaultRoute,
      addElement,
      updateElement,
      deleteElement,
    });

  // Scroll back to the densest cluster of content
  const scrollToContent = useCallback(() => {
    const center = getContentCenter(state.elements);
    if (!center) return;
    setPan(
      VIEWPORT_WIDTH / 2 - center.x * state.zoom,
      VIEWPORT_HEIGHT / 2 - center.y * state.zoom
    );
  }, [state.elements, state.zoom, setPan]);

  const handleCursorMove = useCallback(() => {
    // Cursor broadcasting (collaboration) is currently disabled.
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(
    () => setZoom(state.zoom * 1.2),
    [state.zoom, setZoom]
  );
  const handleZoomOut = useCallback(
    () => setZoom(state.zoom * 0.8),
    [state.zoom, setZoom]
  );

  const handleFitToContent = useCallback(() => {
    const bounds = getElementsBounds(state.elements);
    if (!bounds) {
      setZoom(1);
      setPan(0, 0);
      return;
    }

    const contentCenterX = (bounds.minX + bounds.maxX) / 2;
    const contentCenterY = (bounds.minY + bounds.maxY) / 2;
    const newZoom = 1.0;

    setZoom(newZoom);
    setPan(
      VIEWPORT_WIDTH / 2 - contentCenterX * newZoom,
      VIEWPORT_HEIGHT / 2 - contentCenterY * newZoom
    );
  }, [state.elements, setZoom, setPan]);

  const handleElementDuplicate = useCallback(
    (element: CanvasElement) => {
      handleElementCreate({
        ...element,
        id: `element_${Date.now()}_${Math.random()}`,
        x: element.x + 20,
        y: element.y + 20,
        zIndex: state.elements.length,
      });
    },
    [handleElementCreate, state.elements.length]
  );

  // Layer ordering
  const handleBringToFront = useCallback(
    (id: string) => {
      const maxZIndex = Math.max(...state.elements.map((el) => el.zIndex));
      handleElementUpdate(id, { zIndex: maxZIndex + 1 });
    },
    [state.elements, handleElementUpdate]
  );

  const handleSendToBack = useCallback(
    (id: string) => {
      const minZIndex = Math.min(...state.elements.map((el) => el.zIndex));
      handleElementUpdate(id, { zIndex: minZIndex - 1 });
    },
    [state.elements, handleElementUpdate]
  );

  const handleDrawingNameChange = useCallback(
    (name: string) => {
      setDrawingName(name);

      if (isDefaultRoute) {
        const savedData = loadFromLocalStorage("default_drawing");
        if (savedData) {
          savedData.name = name;
          saveToLocalStorage("default_drawing", savedData);
        } else {
          saveToLocalStorage("default_drawing", {
            elements: state.elements,
            name,
            backgroundType: state.backgroundType,
            backgroundColor: state.backgroundColor,
          });
        }
      } else {
        localStorage.setItem(`drawing_name_${currentRoomId}`, name);
      }
    },
    [
      isDefaultRoute,
      loadFromLocalStorage,
      saveToLocalStorage,
      state.elements,
      state.backgroundType,
      state.backgroundColor,
      currentRoomId,
    ]
  );

  const handleSave = useCallback(() => {
    if (isDefaultRoute) {
      saveToLocalStorage("default_drawing", {
        elements: state.elements,
        name: drawingName,
        backgroundType: state.backgroundType,
        backgroundColor: state.backgroundColor,
        lastSaved: new Date().toISOString(),
      });
    } else {
      localStorage.setItem(
        `canvas_${currentRoomId}`,
        JSON.stringify(state.elements)
      );
      localStorage.setItem(`drawing_name_${currentRoomId}`, drawingName);
    }
    toast(`${drawingName} saved - Your drawing has been saved locally`);
  }, [
    state.elements,
    state.backgroundType,
    state.backgroundColor,
    drawingName,
    toast,
    isDefaultRoute,
    saveToLocalStorage,
    currentRoomId,
  ]);

  const handleNewCanvas = useCallback(() => {
    state.elements.forEach((element) => handleElementDelete(element.id));
    clearSelection();
    setZoom(1);
    setPan(0, 0);
    setDrawingName("Untitled drawing");

    if (isDefaultRoute) {
      localStorage.removeItem("default_drawing");
    }
  }, [
    state.elements,
    handleElementDelete,
    clearSelection,
    setZoom,
    setPan,
    isDefaultRoute,
  ]);

  const handleClearCanvas = useCallback(() => {
    if (state.elements.length > 0) {
      deleteMultiElements(state.elements.map((element) => element.id));
    }
    clearSelection();
    setZoom(1);
    setPan(0, 0);

    if (isDefaultRoute) {
      localStorage.removeItem("default_drawing");
    }
    toast("Canvas cleared");
  }, [
    state.elements,
    deleteMultiElements,
    clearSelection,
    setZoom,
    setPan,
    isDefaultRoute,
    toast,
  ]);

  // Insert an AI-generated Mermaid diagram as a text element at viewport center
  const handleInsertAIDiagram = useCallback(
    (diagramData: string) => {
      const viewportCenterX = -state.panX / state.zoom + 400;
      const viewportCenterY = -state.panY / state.zoom + 300;

      handleElementCreate({
        id: `ai_diagram_${Date.now()}_${Math.random()}`,
        type: "text",
        x: viewportCenterX - 200,
        y: viewportCenterY - 150,
        width: 400,
        height: 300,
        angle: 0,
        strokeColor: getInitialStrokeColor(theme),
        fillColor: "transparent",
        strokeWidth: 1,
        strokeStyle: "solid",
        opacity: 1,
        locked: false,
        zIndex: state.elements.length + 1,
        text: diagramData,
        fontSize: 12,
        fontWeight: "normal",
      });
      toast(
        "Diagram Inserted: Your AI-generated diagram has been added to the canvas."
      );
    },
    [
      state.panX,
      state.panY,
      state.zoom,
      state.elements.length,
      handleElementCreate,
      toast,
      theme,
    ]
  );

  // Load saved drawing metadata on mount
  useEffect(() => {
    if (isDefaultRoute) {
      const savedData = loadFromLocalStorage("default_drawing");
      if (savedData) {
        if (savedData.name) setDrawingName(savedData.name);
        if (savedData.backgroundType)
          setBackgroundType(savedData.backgroundType);
        if (savedData.backgroundColor)
          setBackgroundColor(savedData.backgroundColor);
      }
    } else {
      const savedName = localStorage.getItem(`drawing_name_${currentRoomId}`);
      if (savedName) setDrawingName(savedName);
    }
  }, [
    isDefaultRoute,
    loadFromLocalStorage,
    setBackgroundType,
    setBackgroundColor,
    currentRoomId,
  ]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(handleSave, 30000);
    return () => clearInterval(interval);
  }, [handleSave]);

  // Auto-save to localStorage when elements change (default route only)
  useEffect(() => {
    if (isDefaultRoute && state.elements.length > 0) {
      saveToLocalStorage("default_drawing", {
        elements: state.elements,
        name: drawingName,
        backgroundType: state.backgroundType,
        backgroundColor: state.backgroundColor,
        lastSaved: new Date().toISOString(),
      });
    }
  }, [
    state.elements,
    isDefaultRoute,
    drawingName,
    state.backgroundType,
    state.backgroundColor,
    saveToLocalStorage,
  ]);

  useKeyboardShortcuts({
    undo,
    redo,
    onSave: handleSave,
    onNewCanvas: handleNewCanvas,
    getSelectedElements,
    onElementDuplicate: handleElementDuplicate,
    onElementDelete: handleElementDelete,
  });

  if (isLoading && !isDefaultRoute) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex flex-col items-center gap-4">
          <LottieLoader size={80} />
          <div className="text-muted-foreground font-medium">
            Loading Draw It...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background dark:bg-[#121212]">
      <MetaTags
        title={
          drawingName ? `${drawingName} - Draw It` : "Draw It - Collaborative Drawing"
        }
        description={
          drawingName
            ? `Collaborate on "${drawingName}" with Draw It. Create beautiful drawings in real-time with others.`
            : "Create beautiful drawings and collaborate in real-time with Draw It. Share your creativity with others and bring your ideas to life."
        }
        type="website"
      />

      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={state.zoom}
        backgroundType={state.backgroundType}
        elements={state.elements}
        drawingName={drawingName}
        onDrawingNameChange={handleDrawingNameChange}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToContent={handleFitToContent}
        onBackgroundTypeChange={setBackgroundType}
        onNewCanvas={handleNewCanvas}
        onClearCanvas={handleClearCanvas}
        isSignedIn={isSignedIn}
        onShowLoginModal={() => setShowLoginModal(true)}
        onOpen={() =>
          openDrawingFromFile({
            currentElements: state.elements,
            onElementDelete: handleElementDelete,
            onElementCreate: handleElementCreate,
            onClearSelection: clearSelection,
            onDrawingNameChange: handleDrawingNameChange,
            onBackgroundTypeChange: setBackgroundType,
            onBackgroundColorChange: setBackgroundColor,
            toast,
          })
        }
        onShare={() =>
          shareDrawing({
            drawingName,
            elements: state.elements,
            backgroundType: state.backgroundType,
            backgroundColor: state.backgroundColor,
            toast,
          })
        }
        textInput={textInput}
        showDrawingInstruction={
          state.elements.length === 0 &&
          state.tool !== "select" &&
          state.tool !== "hand" &&
          !textInput
        }
      />

      <div className="absolute inset-0 overflow-hidden">
        <Canvas
          elements={state.elements}
          selectedElementIds={state.selectedElementIds}
          tool={state.tool}
          zoom={state.zoom}
          panX={state.panX}
          panY={state.panY}
          gridVisible={state.gridVisible}
          backgroundType={state.backgroundType}
          backgroundColor={state.backgroundColor}
          collaborativeUsers={[]}
          toolLocked={state.toolLocked}
          onElementCreate={handleElementCreate}
          onElementUpdate={handleElementUpdate}
          onElementSelect={selectElement}
          onSelectMultipleElements={selectMultipleElements}
          onElementDelete={handleElementDelete}
          onClearSelection={clearSelection}
          onPanChange={setPan}
          onZoomChange={setZoom}
          onCursorMove={handleCursorMove}
          onToolChange={setTool}
          onScrollToContent={scrollToContent}
          onTextInputChange={handleTextInputChange}
        />

        {/* Onboarding Overlay - Show when canvas is empty */}
        <OnboardingOverlay
          isVisible={state.elements.length === 0}
          currentTool={state.tool}
        />
      </div>

      {/* Properties Panel - self-positioned floating island (left) */}
      <PropertiesPanel
        selectedElements={getSelectedElements()}
        onElementUpdate={handleElementUpdate}
        onElementDelete={handleElementDelete}
        onElementDuplicate={handleElementDuplicate}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onClearSelection={clearSelection}
      />

      {/* Tool Palette - top-center floating island */}
      <ToolPalette
        currentTool={state.tool}
        onToolChange={setTool}
        onGenerateDrawing={() => setIsGenerateModalOpen(true)}
        onAIDiagram={() => setIsGenerateModalOpen(true)}
        toolLocked={state.toolLocked}
        onToggleToolLock={toggleToolLock}
        isEmpty={state.elements.length === 0}
      />

      {/* AI Diagram Modal */}
      <AIDiagramModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onInsertDiagram={handleInsertAIDiagram}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
