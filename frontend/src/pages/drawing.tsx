import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCanvas } from "@/hooks/useCanvas";
import { useWebSocket } from "@/hooks/useWebSocket";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import ToolPalette from "@/components/ToolPalette";
import PropertiesPanel from "@/components/PropertiesPanel";
import StatusBar from "@/components/StatusBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import GenerateDrawingModal from "@/components/GenerateDrawingModal";
import { geminiService } from "@/lib/geminiService";
import { type CanvasElement } from "@/types/canvas";

// Define CollaborativeUser type locally since @shared/schema is not available
// interface CollaborativeUser {
//   id: string;
//   username: string;
//   color: string;
//   cursor?: {
//     x: number;
//     y: number;
//   };
// }

// Generate a unique room ID for this session
const ROOM_ID = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Generate current user info with brand color
// const CURRENT_USER: CollaborativeUser = {
//   id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//   username: "You",
//   color: "#9D00FF",
// };

export default function Drawing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  // const [collaborativeUsers, setCollaborativeUsers] = useState<
  //   CollaborativeUser[]
  // >([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [drawingName, setDrawingName] = useState("Untitled drawing");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    state,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    clearSelection,
    setTool,
    setZoom,
    setPan,
    toggleGrid,
    setBackgroundType,
    setBackgroundColor,
    undo,
    redo,
    canUndo,
    canRedo,
    getSelectedElements,
  } = useCanvas();

  // Fetch elements for the room
  const { data: elements = [], isLoading } = useQuery({
    queryKey: ["/api/rooms", ROOM_ID, "elements"],
    enabled: true,
  });

  // Create element mutation
  const createElementMutation = useMutation({
    mutationFn: async (element: CanvasElement) => {
      const response = await apiRequest(
        "POST",
        `/api/rooms/${ROOM_ID}/elements`,
        element
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/rooms", ROOM_ID, "elements"],
      });
    },
  });

  // Update element mutation
  const updateElementMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CanvasElement>;
    }) => {
      const response = await apiRequest("PUT", `/api/elements/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/rooms", ROOM_ID, "elements"],
      });
    },
  });

  // Delete element mutation
  const deleteElementMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/elements/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/rooms", ROOM_ID, "elements"],
      });
    },
  });

  // WebSocket for real-time collaboration
  // const { isConnected, sendMessage, sendCursorPosition } = useWebSocket({
  //   roomId: ROOM_ID,
  //   user: CURRENT_USER,
  //   onMessage: (message) => {
  //     switch (message.type) {
  //       case "element-create":
  //         queryClient.invalidateQueries({
  //           queryKey: ["/api/rooms", ROOM_ID, "elements"],
  //         });
  //         break;
  //       case "element-update":
  //         queryClient.invalidateQueries({
  //           queryKey: ["/api/rooms", ROOM_ID, "elements"],
  //         });
  //         break;
  //       case "element-delete":
  //         queryClient.invalidateQueries({
  //           queryKey: ["/api/rooms", ROOM_ID, "elements"],
  //         });
  //         break;
  //     }
  //   },
  //   onUsersChange: setCollaborativeUsers,
  //   onCursorMove: (cursor) => {
  //     // Update collaborative users cursor positions
  //     setCollaborativeUsers((prev) =>
  //       prev.map((user) =>
  //         user.id === cursor.userId
  //           ? {
  //               ...user,
  //               cursor: {
  //                 x: cursor.x,
  //                 y: cursor.y,
  //                 userId: cursor.userId,
  //                 username: user.username,
  //                 color: user.color,
  //               },
  //             }
  //           : user
  //       )
  //     );
  //   },
  // });

  // Handle element creation
  const handleElementCreate = useCallback(
    (element: CanvasElement, onAdded?: () => void) => {
      addElement(element, onAdded);
      createElementMutation.mutate(element);

      // Broadcast to other users
      // sendMessage({
      //   type: "element-create",
      //   data: { element },
      // });
    },
    [
      addElement,
      createElementMutation,
      // sendMessage
    ]
  );

  // Handle element updates
  const handleElementUpdate = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      updateElement(id, updates);
      updateElementMutation.mutate({ id, updates });

      // Broadcast to other users
      // sendMessage({
      //   type: "element-update",
      //   data: { id, updates },
      // });
    },
    [
      updateElement,
      updateElementMutation,
      // sendMessage
    ]
  );

  // Calculate content center for scroll back functionality - finds highest density area
  const getContentCenter = useCallback(() => {
    if (state.elements.length === 0) return null;

    // Create a grid to find the highest density area
    const gridSize = 200; // Grid cell size
    const densityMap = new Map<string, number>();

    // Count elements in each grid cell
    state.elements.forEach((element) => {
      let elementX, elementY, elementWidth, elementHeight;

      if (element.type === "freehand" || element.type === "eraser") {
        // For freehand elements, calculate bounds from points
        const points = element.data?.points || [];
        if (points.length === 0) return;

        let minX = points[0].x;
        let maxX = points[0].x;
        let minY = points[0].y;
        let maxY = points[0].y;

        points.forEach((point: any) => {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        });

        elementX = minX;
        elementY = minY;
        elementWidth = maxX - minX;
        elementHeight = maxY - minY;
      } else {
        // For other elements, use element bounds
        elementX = element.x;
        elementY = element.y;
        elementWidth = element.width;
        elementHeight = element.height;
      }

      // Add this element to all grid cells it overlaps
      const startGridX = Math.floor(elementX / gridSize);
      const endGridX = Math.floor((elementX + elementWidth) / gridSize);
      const startGridY = Math.floor(elementY / gridSize);
      const endGridY = Math.floor((elementY + elementHeight) / gridSize);

      for (let gx = startGridX; gx <= endGridX; gx++) {
        for (let gy = startGridY; gy <= endGridY; gy++) {
          const key = `${gx},${gy}`;
          densityMap.set(key, (densityMap.get(key) || 0) + 1);
        }
      }
    });

    // Find the grid cell with highest density
    let maxDensity = 0;
    let bestGridX = 0;
    let bestGridY = 0;

    for (const [key, density] of densityMap) {
      if (density > maxDensity) {
        maxDensity = density;
        const [gx, gy] = key.split(",").map(Number);
        bestGridX = gx;
        bestGridY = gy;
      }
    }

    // Return center of the highest density grid cell
    return {
      x: (bestGridX + 0.5) * gridSize,
      y: (bestGridY + 0.5) * gridSize,
    };
  }, [state.elements]);

  // Scroll back to content
  const scrollToContent = useCallback(() => {
    const contentCenter = getContentCenter();
    if (contentCenter) {
      // Center the content in the viewport
      const canvasWidth = 800; // Approximate canvas width
      const canvasHeight = 600; // Approximate canvas height
      const newPanX = canvasWidth / 2 - contentCenter.x * state.zoom;
      const newPanY = canvasHeight / 2 - contentCenter.y * state.zoom;
      setPan(newPanX, newPanY);
    }
  }, [getContentCenter, state.zoom, setPan]);

  // Handle element deletion
  const handleElementDelete = useCallback(
    (id: string) => {
      deleteElement(id);
      deleteElementMutation.mutate(id);

      // Broadcast to other users
      // sendMessage({
      //   type: "element-delete",
      //   data: { id },
      // });
    },
    [
      deleteElement,
      deleteElementMutation,
      // sendMessage
    ]
  );

  // Handle cursor movement
  const handleCursorMove = useCallback(
    (x: number, y: number) => {
      setCursorPosition({ x, y });
      // sendCursorPosition(x, y);
    },
    [
      // sendCursorPosition
    ]
  );

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(state.zoom * 1.2);
  }, [state.zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(state.zoom * 0.8);
  }, [state.zoom, setZoom]);

  const handleFitToContent = useCallback(() => {
    // TODO: Implement fit to content logic
    setZoom(1);
    setPan(0, 0);
  }, [setZoom, setPan]);

  // Handle element duplication
  const handleElementDuplicate = useCallback(
    (element: CanvasElement) => {
      const duplicatedElement: CanvasElement = {
        ...element,
        id: `element_${Date.now()}_${Math.random()}`,
        x: element.x + 20,
        y: element.y + 20,
        zIndex: state.elements.length,
      };
      handleElementCreate(duplicatedElement);
    },
    [handleElementCreate, state.elements.length]
  );

  // Handle layer management
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

  // Handle drawing name change
  const handleDrawingNameChange = useCallback((name: string) => {
    setDrawingName(name);
    localStorage.setItem(`drawing_name_${ROOM_ID}`, name);
  }, []);

  // Handle saving
  const handleSave = useCallback(() => {
    setLastSaved(new Date());
    localStorage.setItem(`canvas_${ROOM_ID}`, JSON.stringify(state.elements));
    localStorage.setItem(`drawing_name_${ROOM_ID}`, drawingName);
    toast(`${drawingName} saved - Your drawing has been saved locally`);
  }, [state.elements, drawingName, toast]);

  // Handle new canvas
  const handleNewCanvas = useCallback(() => {
    // Clear all elements
    state.elements.forEach((element) => {
      handleElementDelete(element.id);
    });
    clearSelection();
    setZoom(1);
    setPan(0, 0);
    setDrawingName("Untitled drawing");
  }, [state.elements, handleElementDelete, clearSelection, setZoom, setPan]);

  // Handle generate drawing
  const handleGenerateDrawing = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);
      try {
        const generatedElements = await geminiService.generateDrawing(prompt);

        // Calculate viewport center for positioning
        const viewportCenterX = -state.panX / state.zoom + 400; // Approximate canvas center
        const viewportCenterY = -state.panY / state.zoom + 300;

        // Position elements relative to viewport center
        generatedElements.forEach((element, index) => {
          const offsetX = (index % 3) * 50; // Spread elements slightly
          const offsetY = Math.floor(index / 3) * 50;

          const positionedElement: CanvasElement = {
            ...element,
            id: `generated_${Date.now()}_${index}`,
            x: viewportCenterX + element.x - 400 + offsetX, // Center around viewport
            y: viewportCenterY + element.y - 300 + offsetY,
            zIndex: state.elements.length + index,
          };

          handleElementCreate(positionedElement);
        });

        // toast({
        //   title: "Drawing Generated!",
        //   description: `Successfully generated ${generatedElements.length} elements from your prompt.`,
        // });

        setIsGenerateModalOpen(false);
      } catch (error) {
        console.error("Error generating drawing:", error);
        // toast({
        //   title: "Generation Failed",
        //   description:
        //     error instanceof Error
        //       ? error.message
        //       : "Failed to generate drawing. Please try again.",
        //   variant: "destructive",
        // });
      } finally {
        setIsGenerating(false);
      }
    },
    [
      state.panX,
      state.panY,
      state.zoom,
      state.elements.length,
      handleElementCreate,
      toast,
    ]
  );

  // Load saved drawing name on mount
  useEffect(() => {
    const savedName = localStorage.getItem(`drawing_name_${ROOM_ID}`);
    if (savedName) {
      setDrawingName(savedName);
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case "y":
            e.preventDefault();
            redo();
            break;
          case "s":
            e.preventDefault();
            handleSave();
            break;
          case "n":
            e.preventDefault();
            handleNewCanvas();
            break;
          case "d":
            e.preventDefault();
            const selected = getSelectedElements();
            selected.forEach(handleElementDuplicate);
            break;
        }
      }

      // Tool shortcuts
      // switch (e.key) {
      //   case "v":
      //     setTool("select");
      //     break;
      //   case "h":
      //     setTool("hand");
      //     break;
      //   case "r":
      //     setTool("rectangle");
      //     break;
      //   case "o":
      //     setTool("ellipse");
      //     break;
      //   case "l":
      //     setTool("line");
      //     break;
      //   case "a":
      //     setTool("arrow");
      //     break;
      //   case "p":
      //     setTool("freehand");
      //     break;
      //   case "t":
      //     setTool("text");
      //     break;
      //   case "Delete":
      //   case "Backspace":
      //     getSelectedElements().forEach((element) =>
      //       handleElementDelete(element.id)
      //     );
      //     break;
      // }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    handleSave,
    handleNewCanvas,
    getSelectedElements,
    handleElementDuplicate,
    setTool,
    handleElementDelete,
  ]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full gradient-brand animate-pulse"></div>
          <div className="text-muted-foreground font-medium">
            Loading Draw It...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background dark:bg-gray-900">
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
        onOpen={() => {
          // TODO: Implement open functionality
          console.log("Open file");
        }}
        onShare={() => {
          // TODO: Implement share functionality
          console.log("Share drawing");
        }}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <ToolPalette
          currentTool={state.tool}
          onToolChange={setTool}
          onGenerateDrawing={() => setIsGenerateModalOpen(true)}
        />

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
          onElementCreate={handleElementCreate}
          onElementUpdate={handleElementUpdate}
          onElementSelect={selectElement}
          onElementDelete={handleElementDelete}
          onClearSelection={clearSelection}
          onPanChange={setPan}
          onZoomChange={setZoom}
          onCursorMove={handleCursorMove}
          onToolChange={setTool}
          onScrollToContent={scrollToContent}
        />

        {/* Properties Panel - Absolutely positioned */}
        {state.selectedElementIds.length > 0 && (
          <div className="absolute top-0 right-0 h-full z-50">
            <PropertiesPanel
              selectedElements={getSelectedElements()}
              onElementUpdate={handleElementUpdate}
              onElementDelete={handleElementDelete}
              onElementDuplicate={handleElementDuplicate}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
            />
          </div>
        )}
      </div>

      <StatusBar
        elements={state.elements}
        cursorPosition={cursorPosition}
        isConnected={false}
        lastSaved={lastSaved}
        collaborativeUsers={[]}
      />

      {/* Generate Drawing Modal */}
      <GenerateDrawingModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleGenerateDrawing}
        isGenerating={isGenerating}
      />
    </div>
  );
}
