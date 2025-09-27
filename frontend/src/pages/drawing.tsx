import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useUser } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCanvas } from "@/hooks/useCanvas";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import ToolPalette from "@/components/ToolPalette";
import PropertiesPanel from "@/components/PropertiesPanel";
import AIDiagramModal from "@/components/AIDiagramModal";
import LottieLoader from "@/components/LottieLoader";
import MetaTags from "@/components/MetaTags";
import LoginModal from "@/components/LoginModal";
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
  const { isSignedIn, isLoaded } = useUser();
  const [match, params] = useRoute("/drawing/:id");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  // const [collaborativeUsers, setCollaborativeUsers] = useState<
  //   CollaborativeUser[]
  // >([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [drawingName, setDrawingName] = useState("Untitled drawing");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAIDiagramModalOpen, setIsAIDiagramModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Determine if we're on the "/" route (no params) or "/drawing/:id" route
  const isDefaultRoute = !match; // No match means we're on "/"
  const currentRoomId = isDefaultRoute ? "default_drawing" : ROOM_ID;

  const {
    state,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    selectMultipleElements,
    clearSelection,
    setTool,
    setZoom,
    setPan,
    toggleGrid,
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
    loadElements,
  } = useCanvas();

  // Fetch elements for the room - only for non-default routes
  const { data: elements = [], isLoading } = useQuery({
    queryKey: ["/api/rooms", ROOM_ID, "elements"],
    enabled: !isDefaultRoute, // Only enable API calls for non-default routes
  });

  // Create element mutation - only for non-default routes
  const createElementMutation = useMutation({
    mutationFn: async (element: CanvasElement) => {
      if (isDefaultRoute) {
        // For default route, just return the element without API call
        return element;
      }
      const response = await apiRequest(
        "POST",
        `/api/rooms/${ROOM_ID}/elements`,
        element
      );
      return response.json();
    },
    onSuccess: () => {
      if (!isDefaultRoute) {
        queryClient.invalidateQueries({
          queryKey: ["/api/rooms", ROOM_ID, "elements"],
        });
      }
    },
  });

  // Update element mutation - only for non-default routes
  const updateElementMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CanvasElement>;
    }) => {
      if (isDefaultRoute) {
        // For default route, just return the updates without API call
        return { id, updates };
      }
      const response = await apiRequest("PUT", `/api/elements/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      if (!isDefaultRoute) {
        queryClient.invalidateQueries({
          queryKey: ["/api/rooms", ROOM_ID, "elements"],
        });
      }
    },
  });

  // Delete element mutation - only for non-default routes
  const deleteElementMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDefaultRoute) {
        // For default route, just return the id without API call
        return { id };
      }
      const response = await apiRequest("DELETE", `/api/elements/${id}`);
      return response.json();
    },
    onSuccess: () => {
      if (!isDefaultRoute) {
        queryClient.invalidateQueries({
          queryKey: ["/api/rooms", ROOM_ID, "elements"],
        });
      }
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
    if (state.elements.length === 0) {
      setZoom(1);
      setPan(0, 0);
      return;
    }

    // Calculate bounding box of all elements
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    state.elements.forEach((element) => {
      let elementMinX: number,
        elementMinY: number,
        elementMaxX: number,
        elementMaxY: number;

      if (element.type === "freehand" || element.type === "eraser") {
        // For freehand elements, calculate bounds from points
        const points = element.data?.points || [];
        if (points.length === 0) return;

        // Initialize with first point
        const firstPoint = points[0];
        elementMinX = firstPoint.x;
        elementMaxX = firstPoint.x;
        elementMinY = firstPoint.y;
        elementMaxY = firstPoint.y;

        // Update bounds with remaining points
        points.slice(1).forEach((point: any) => {
          elementMinX = Math.min(elementMinX, point.x);
          elementMaxX = Math.max(elementMaxX, point.x);
          elementMinY = Math.min(elementMinY, point.y);
          elementMaxY = Math.max(elementMaxY, point.y);
        });
      } else {
        // For other elements, use element bounds
        elementMinX = element.x;
        elementMinY = element.y;
        elementMaxX = element.x + element.width;
        elementMaxY = element.y + element.height;
      }

      minX = Math.min(minX, elementMinX);
      minY = Math.min(minY, elementMinY);
      maxX = Math.max(maxX, elementMaxX);
      maxY = Math.max(maxY, elementMaxY);
    });

    // Add some padding around the content
    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    // Calculate viewport dimensions (approximate canvas size)
    const viewportWidth = 800;
    const viewportHeight = 600;

    // Calculate zoom to fit content in viewport
    const scaleX = viewportWidth / contentWidth;
    const scaleY = viewportHeight / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 3); // Cap zoom at 3x

    // Center the content in the viewport
    const newPanX = viewportWidth / 2 - contentCenterX * newZoom;
    const newPanY = viewportHeight / 2 - contentCenterY * newZoom;

    setZoom(newZoom);
    setPan(newPanX, newPanY);
  }, [state.elements, setZoom, setPan]);

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
  const handleDrawingNameChange = useCallback(
    (name: string) => {
      setDrawingName(name);

      if (isDefaultRoute) {
        // Update the name in localStorage for default route
        const savedData = loadFromLocalStorage("default_drawing");
        if (savedData) {
          savedData.name = name;
          saveToLocalStorage("default_drawing", savedData);
        } else {
          // Create new data if none exists
          const drawingData = {
            elements: state.elements,
            name: name,
            backgroundType: state.backgroundType,
            backgroundColor: state.backgroundColor,
          };
          saveToLocalStorage("default_drawing", drawingData);
        }
      } else {
        // Use existing behavior for non-default routes
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

  // Handle saving
  const handleSave = useCallback(() => {
    setLastSaved(new Date());

    if (isDefaultRoute) {
      // Save to localStorage for default route
      const drawingData = {
        elements: state.elements,
        name: drawingName,
        backgroundType: state.backgroundType,
        backgroundColor: state.backgroundColor,
        lastSaved: new Date().toISOString(),
      };
      saveToLocalStorage("default_drawing", drawingData);
      toast(`${drawingName} saved - Your drawing has been saved locally`);
    } else {
      // Save to localStorage for non-default routes (existing behavior)
      localStorage.setItem(
        `canvas_${currentRoomId}`,
        JSON.stringify(state.elements)
      );
      localStorage.setItem(`drawing_name_${currentRoomId}`, drawingName);
      toast(`${drawingName} saved - Your drawing has been saved locally`);
    }
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

    // Clear localStorage for default route
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

  // Handle clear canvas - more efficient way to clear all elements
  const handleClearCanvas = useCallback(() => {
    // Clear all elements by deleting them one by one (this ensures proper cleanup)
    if (state.elements.length > 0) {
      // Create a copy of elements to avoid mutation during iteration
      const elementsToDelete = [...state.elements];
      elementsToDelete.forEach((element) => {
        deleteElement(element.id);
      });
    }

    // Clear selection and reset view
    clearSelection();
    setZoom(1);
    setPan(0, 0);

    // Clear localStorage for default route
    if (isDefaultRoute) {
      localStorage.removeItem("default_drawing");
    }

    toast("Canvas cleared");
  }, [
    state.elements,
    deleteElement,
    clearSelection,
    setZoom,
    setPan,
    isDefaultRoute,
    toast,
  ]);

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

  // Handle AI diagram insertion
  const handleInsertAIDiagram = useCallback(
    (diagramData: string) => {
      // Calculate viewport center for positioning
      const viewportCenterX = -state.panX / state.zoom + 400;
      const viewportCenterY = -state.panY / state.zoom + 300;

      // Create a new text element with the Mermaid diagram
      const newElement: CanvasElement = {
        id: `ai_diagram_${Date.now()}_${Math.random()}`,
        type: "text",
        x: viewportCenterX - 200,
        y: viewportCenterY - 150,
        width: 400,
        height: 300,
        angle: 0,
        strokeColor: "#000000",
        fillColor: "transparent",
        strokeWidth: 1,
        strokeStyle: "solid",
        opacity: 1,
        locked: false,
        zIndex: state.elements.length + 1,
        text: diagramData,
        fontSize: 12,
        fontWeight: "normal",
      };

      handleElementCreate(newElement);
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
    ]
  );

  // Load saved drawing data on mount - different logic for default route
  useEffect(() => {
    if (isDefaultRoute) {
      // Load from localStorage for default route
      const savedData = loadFromLocalStorage("default_drawing");
      if (savedData) {
        if (savedData.name) {
          setDrawingName(savedData.name);
        }
        if (savedData.backgroundType) {
          setBackgroundType(savedData.backgroundType);
        }
        if (savedData.backgroundColor) {
          setBackgroundColor(savedData.backgroundColor);
        }
      }
    } else {
      // Load saved drawing name for non-default routes
      const savedName = localStorage.getItem(`drawing_name_${currentRoomId}`);
      if (savedName) {
        setDrawingName(savedName);
      }
    }
  }, [
    isDefaultRoute,
    loadFromLocalStorage,
    setBackgroundType,
    setBackgroundColor,
  ]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleSave]);

  // Auto-save to localStorage when elements change (for default route only)
  useEffect(() => {
    if (isDefaultRoute && state.elements.length > 0) {
      const drawingData = {
        elements: state.elements,
        name: drawingName,
        backgroundType: state.backgroundType,
        backgroundColor: state.backgroundColor,
        lastSaved: new Date().toISOString(),
      };
      saveToLocalStorage("default_drawing", drawingData);
    }
  }, [
    state.elements,
    isDefaultRoute,
    drawingName,
    state.backgroundType,
    state.backgroundColor,
    saveToLocalStorage,
  ]);

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
    <div className="h-screen flex flex-col bg-background dark:bg-gray-900">
      <MetaTags
        title={
          drawingName
            ? `${drawingName} - Draw It`
            : "Draw It - Collaborative Drawing"
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
        onOpen={() => {
          // Create file input for loading saved drawings
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const data = JSON.parse(e.target?.result as string);

                  // Validate the data structure
                  if (data.elements && Array.isArray(data.elements)) {
                    // Clear current canvas
                    state.elements.forEach((element) => {
                      handleElementDelete(element.id);
                    });
                    clearSelection();

                    // Load the drawing
                    data.elements.forEach((element: CanvasElement) => {
                      handleElementCreate(element);
                    });

                    // Update drawing name if provided
                    if (data.name) {
                      handleDrawingNameChange(data.name);
                    }

                    // Set background if provided
                    if (data.backgroundType) {
                      setBackgroundType(data.backgroundType);
                    }
                    if (data.backgroundColor) {
                      setBackgroundColor(data.backgroundColor);
                    }

                    toast(
                      `Drawing "${
                        data.name || "Untitled"
                      }" loaded successfully!`
                    );
                  } else {
                    toast(
                      "Invalid file format. Please select a valid drawing file.",
                      { variant: "destructive" }
                    );
                  }
                } catch (error) {
                  console.error("Error loading drawing:", error);
                  toast(
                    "Error loading drawing. Please check the file format.",
                    { variant: "destructive" }
                  );
                }
              };
              reader.readAsText(file);
            }
          };
          input.click();
        }}
        onShare={() => {
          // Create shareable drawing data
          const shareableData = {
            name: drawingName,
            elements: state.elements,
            backgroundType: state.backgroundType,
            backgroundColor: state.backgroundColor,
            createdAt: new Date().toISOString(),
            version: "1.0",
          };

          // Create a blob with the drawing data
          const blob = new Blob([JSON.stringify(shareableData, null, 2)], {
            type: "application/json",
          });

          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${drawingName
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}_drawing.json`;

          // Trigger download
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Also copy to clipboard if supported
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
              .writeText(JSON.stringify(shareableData, null, 2))
              .then(() => {
                toast("Drawing exported and copied to clipboard!");
              })
              .catch(() => {
                toast("Drawing exported successfully!");
              });
          } else {
            toast("Drawing exported successfully!");
          }
        }}
      />

      <div className="flex-1 overflow-hidden relative">
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

      {/* Tool Palette - Fixed at bottom */}
      <ToolPalette
        currentTool={state.tool}
        onToolChange={setTool}
        onGenerateDrawing={() => setIsGenerateModalOpen(true)}
        onAIDiagram={() => setIsAIDiagramModalOpen(true)}
        toolLocked={state.toolLocked}
        onToggleToolLock={toggleToolLock}
      />

      {/* 
      <StatusBar
        elements={state.elements}
        cursorPosition={cursorPosition}
        isConnected={false}
        lastSaved={lastSaved}
        collaborativeUsers={[]}
      /> */}

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
