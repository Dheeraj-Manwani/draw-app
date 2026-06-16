import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { type CanvasElement, type Point } from "@/types/canvas";
import {
  drawElement,
  drawGrid,
  screenToCanvas,
  measureTextSize,
  getTextFont,
} from "@/lib/canvas-utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getThemeBackgroundColor,
  getThemeAwareStrokeColor,
  getThemeAwareFillColor,
} from "@/utils/themeUtils";

// New elements store a single canonical (theme-neutral) stroke color. The
// theme-aware remap at draw time handles showing it light-on-dark, so the
// stored value no longer depends on which theme was active at creation (which
// previously surprised on export).
const DEFAULT_STROKE_COLOR = "#000000";
import ScrollToContentButton from "./ScrollToContentButton";
import ImageUploadModal from "./ImageUploadModal";
import EmbedLinkModal from "./EmbedLinkModal";
import EmbedPreview from "./EmbedPreview";
// Define CollaborativeUser type locally since @shared/schema is not available
interface CollaborativeUser {
  id: string;
  username: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
}

interface CanvasProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  tool: string;
  zoom: number;
  panX: number;
  panY: number;
  gridVisible: boolean;
  backgroundType: string;
  backgroundColor: string;
  collaborativeUsers: CollaborativeUser[];
  toolLocked: boolean;
  onElementCreate: (element: CanvasElement, onAdded?: () => void) => void;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onElementsUpdateLive: (
    updatesById: Record<string, Partial<CanvasElement>>
  ) => void;
  onCommitHistory: () => void;
  onElementSelect: (id: string, multiSelect?: boolean) => void;
  onSelectMultipleElements: (ids: string[], addToSelection?: boolean) => void;
  onElementsDelete: (ids: string[]) => void;
  onClearSelection: () => void;
  onPanChange: (panX: number, panY: number) => void;
  onZoomChange: (zoom: number) => void;
  onCursorMove: (x: number, y: number) => void;
  onToolChange: (tool: string) => void;
  onScrollToContent?: () => void;
  onTextInputChange?: (
    textInput: {
      element: CanvasElement;
      position: Point;
      isEditing?: boolean;
    } | null
  ) => void;
}

export default function Canvas({
  elements,
  selectedElementIds,
  tool,
  zoom,
  panX,
  panY,
  gridVisible: _gridVisible,
  backgroundType,
  backgroundColor,
  collaborativeUsers,
  toolLocked,
  onElementCreate,
  onElementUpdate,
  onElementsUpdateLive,
  onCommitHistory,
  onElementSelect,
  onSelectMultipleElements,
  onElementsDelete,
  onClearSelection,
  onPanChange,
  onZoomChange,
  onCursorMove,
  onToolChange,
  onScrollToContent,
  onTextInputChange,
}: CanvasProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(
    null
  );
  const [textInput, setTextInput] = useState<{
    element: CanvasElement;
    position: Point;
    isEditing?: boolean;
  } | null>(null);

  // Notify parent when textInput changes
  useEffect(() => {
    if (onTextInputChange) {
      onTextInputChange(textInput);
    }
  }, [textInput, onTextInputChange]);

  // Auto-resize textarea when textInput changes
  useEffect(() => {
    if (textInput && textareaRef.current) {
      const textarea = textareaRef.current;
      // Set initial height based on content
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [textInput]);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<CanvasElement | null>(
    null
  );
  const [isErasing, setIsErasing] = useState(false);
  const [erasedElements, setErasedElements] = useState<Set<string>>(new Set());
  const [eraserStroke, setEraserStroke] = useState<Point[]>([]);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
    null
  );
  const [lastTouchCenter, setLastTouchCenter] = useState<Point | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [moveStart, setMoveStart] = useState<Point | null>(null);
  const [originalElementPositions, setOriginalElementPositions] = useState<
    Map<
      string,
      { x: number; y: number; width: number; height: number; points?: Point[] }
    >
  >(new Map());
  const [cursorState, setCursorState] = useState<string>("default");
  const [laserElements, setLaserElements] = useState<CanvasElement[]>([]);
  const [isLaserDrawing, setIsLaserDrawing] = useState(false);
  const [currentLaserPath, setCurrentLaserPath] = useState<Point[]>([]);
  const [imageLoadCounter, setImageLoadCounter] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  // Elements ordered for stacking. Lower zIndex is drawn first (behind); hit
  // testing walks this in reverse so the topmost element wins. Used everywhere
  // we care about visual stacking so layer ordering actually takes effect.
  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  );

  // Axis-aligned bounds of an element in canvas coordinates, normalized so
  // negative width/height (lines/arrows) and point-based paths both work.
  const getElementCanvasBounds = useCallback((element: CanvasElement) => {
    if (
      element.type === "freehand" ||
      element.type === "eraser" ||
      element.type === "laser"
    ) {
      const points = (element.data?.points as Point[]) || [];
      if (points.length === 0) {
        return { x: element.x, y: element.y, width: 0, height: 0 };
      }
      let minX = points[0].x;
      let maxX = points[0].x;
      let minY = points[0].y;
      let maxY = points[0].y;
      for (const p of points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return {
      x: Math.min(element.x, element.x + element.width),
      y: Math.min(element.y, element.y + element.height),
      width: Math.abs(element.width),
      height: Math.abs(element.height),
    };
  }, []);

  // Function to determine cursor state
  const getCursorState = useCallback(() => {
    if (isMoving) return "move";
    if (isResizing && resizeHandle) {
      switch (resizeHandle) {
        case "nw":
        case "se":
          return "nw-resize";
        case "ne":
        case "sw":
          return "ne-resize";
        case "n":
        case "s":
          return "ns-resize";
        case "e":
        case "w":
          return "ew-resize";
        default:
          return "move";
      }
    }
    if (isPanning) return "grabbing";
    if (isSelecting) return "crosshair";
    if (tool === "hand") return "grab";
    if (tool === "select") return "default";
    if (tool === "eraser") return "pointer";
    if (tool === "laser") return "laser";
    return "crosshair";
  }, [isMoving, isResizing, resizeHandle, isPanning, isSelecting, tool]);

  // Check if any elements are visible in the current viewport
  const hasVisibleElements = useCallback(() => {
    if (elements.length === 0) return false;

    const canvas = canvasRef.current;
    if (!canvas) return false;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate the visible area in canvas coordinates
    const visibleLeft = -panX / zoom;
    const visibleTop = -panY / zoom;
    const visibleRight = visibleLeft + canvasWidth / zoom;
    const visibleBottom = visibleTop + canvasHeight / zoom;

    return elements.some((element) => {
      // Check if element intersects with visible area
      const elementRight = element.x + element.width;
      const elementBottom = element.y + element.height;

      return (
        element.x < visibleRight &&
        elementRight > visibleLeft &&
        element.y < visibleBottom &&
        elementBottom > visibleTop
      );
    });
  }, [elements, panX, panY, zoom]);

  const handleImageSelect = useCallback(
    (imageData: string) => {
      // Get the center of the canvas
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasWidth = canvas.width / zoom;
      const canvasHeight = canvas.height / zoom;
      const centerX = (-panX + canvasWidth / 2) / zoom;
      const centerY = (-panY + canvasHeight / 2) / zoom;

      // Create a temporary image to get dimensions
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const maxWidth = 200;
        const maxHeight = 200;

        let width = maxWidth;
        let height = maxWidth / aspectRatio;

        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }

        const newElement: CanvasElement = {
          id: `element_${Date.now()}_${Math.random()}`,
          type: "image",
          x: centerX - width / 2,
          y: centerY - height / 2,
          width,
          height,
          angle: 0,
          strokeColor: "transparent",
          fillColor: "transparent",
          strokeWidth: 0,
          strokeStyle: "solid",
          opacity: 1,
          locked: false,
          zIndex: elements.length,
          imageData,
          onImageLoad: () => {
            // Force a redraw by incrementing the counter
            setImageLoadCounter((prev) => prev + 1);
          },
        };

        onElementCreate(newElement);
      };
      img.src = imageData;
    },
    [zoom, panX, panY, elements.length, onElementCreate]
  );

  const handleEmbedSubmit = useCallback(
    (url: string) => {
      // Get the center of the canvas
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasWidth = canvas.width / zoom;
      const canvasHeight = canvas.height / zoom;
      const centerX = (-panX + canvasWidth / 2) / zoom;
      const centerY = (-panY + canvasHeight / 2) / zoom;

      // Determine embed type from URL
      let embedType = "unknown";
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
          embedType = "youtube";
        } else if (hostname.includes("twitter.com")) {
          embedType = "twitter";
        } else if (hostname.includes("x.com")) {
          embedType = "x";
        } else if (hostname.includes("instagram.com")) {
          embedType = "instagram";
        } else if (hostname.includes("facebook.com")) {
          embedType = "facebook";
        } else if (hostname.includes("tiktok.com")) {
          embedType = "tiktok";
        } else if (hostname.includes("linkedin.com")) {
          embedType = "linkedin";
        } else if (hostname.includes("pinterest.com")) {
          embedType = "pinterest";
        }
      } catch (error) {
        console.error("Error parsing URL:", error);
      }

      const newElement: CanvasElement = {
        id: `element_${Date.now()}_${Math.random()}`,
        type: "embed",
        x: centerX - 200, // Default width of 400px
        y: centerY - 150, // Default height of 300px
        width: 400,
        height: 300,
        angle: 0,
        strokeColor: "transparent",
        fillColor: "transparent",
        strokeWidth: 0,
        strokeStyle: "solid",
        opacity: 1,
        locked: false,
        zIndex: elements.length,
        embedUrl: url,
        embedType,
      };

      onElementCreate(newElement);
    },
    [zoom, panX, panY, elements.length, onElementCreate]
  );

  const getMousePos = useCallback((e: MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const drawSelectionRectangle = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!isSelecting || !selectionRect) return;

      const { startX, startY, endX, endY } = selectionRect;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      ctx.save();
      ctx.strokeStyle = "hsl(221, 83%, 53%)";
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Draw selection rectangle
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);

      ctx.restore();
    },
    [isSelecting, selectionRect]
  );

  // Helper function to calculate distance from point to line
  const distanceToLine = useCallback(
    (
      px: number,
      py: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ): number => {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) {
        param = dot / lenSq;
      }

      let xx, yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = px - xx;
      const dy = py - yy;
      return Math.sqrt(dx * dx + dy * dy);
    },
    []
  );

  const drawHoverPreview = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (
        tool === "select" &&
        hoveredElement &&
        // Text elements show no border/box — they're edited directly.
        hoveredElement.type !== "text" &&
        !selectedElementIds.includes(hoveredElement.id)
      ) {
        let x, y, width, height;

        if (
          hoveredElement.type === "freehand" ||
          hoveredElement.type === "eraser" ||
          hoveredElement.type === "laser"
        ) {
          // Calculate bounding box from path points
          const points = hoveredElement.data?.points || [];
          if (points.length === 0) return;

          let minX = points[0].x;
          let maxX = points[0].x;
          let minY = points[0].y;
          let maxY = points[0].y;

          for (const point of points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          }

          x = minX * zoom + panX;
          y = minY * zoom + panY;
          width = (maxX - minX) * zoom;
          height = (maxY - minY) * zoom;
        } else {
          // Use element bounds for other types
          x = hoveredElement.x * zoom + panX;
          y = hoveredElement.y * zoom + panY;
          width = hoveredElement.width * zoom;
          height = hoveredElement.height * zoom;
        }

        ctx.save();

        // Special handling for arrows and lines
        if (hoveredElement.type === "arrow" || hoveredElement.type === "line") {
          // Draw a thicker line preview for arrows and lines
          ctx.strokeStyle = "hsl(221, 83%, 53%)";
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);

          const startX = x;
          const startY = y;
          const endX = x + width;
          const endY = y + height;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // For arrows, also draw a preview arrowhead
          if (hoveredElement.type === "arrow") {
            const headlen = 15;
            const angle = Math.atan2(endY - startY, endX - startX);

            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headlen * Math.cos(angle - Math.PI / 6),
              endY - headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headlen * Math.cos(angle + Math.PI / 6),
              endY - headlen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        } else {
          // Standard hover highlight for other elements
          ctx.strokeStyle = "hsl(221, 83%, 53%)";
          ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);

          // Draw hover highlight
          ctx.fillRect(x, y, width, height);
          ctx.strokeRect(x, y, width, height);
        }

        ctx.restore();
      }
    },
    [tool, hoveredElement, selectedElementIds, zoom, panX, panY]
  );

  const drawBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    // Fill background color - use theme-aware background
    const themeBackgroundColor = getThemeBackgroundColor(theme);
    ctx.fillStyle = themeBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (backgroundType === "none") return;

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panX / zoom, panY / zoom);

    const gridSize = 20;
    const canvasWidth = canvas.width / zoom;
    const canvasHeight = canvas.height / zoom;

    // Calculate the visible area in canvas coordinates
    const visibleLeft = -panX / zoom;
    const visibleTop = -panY / zoom;
    const visibleRight = visibleLeft + canvasWidth;
    const visibleBottom = visibleTop + canvasHeight;

    // Calculate pattern start positions to cover the entire visible area
    const startX = Math.floor(visibleLeft / gridSize) * gridSize;
    const startY = Math.floor(visibleTop / gridSize) * gridSize;
    const endX = Math.ceil(visibleRight / gridSize) * gridSize;
    const endY = Math.ceil(visibleBottom / gridSize) * gridSize;

    // Theme-aware grid colors
    ctx.strokeStyle = theme === "dark" ? "#374151" : "#e5e7eb";
    ctx.lineWidth = 1;

    switch (backgroundType) {
      case "grid":
        drawGrid(ctx, canvasWidth, canvasHeight, 1, -panX / zoom, -panY / zoom);
        break;
      case "dots":
        ctx.fillStyle = theme === "dark" ? "#6b7280" : "#d1d5db";
        for (let x = startX; x < endX; x += gridSize) {
          for (let y = startY; y < endY; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case "squares":
        for (let x = startX; x < endX; x += gridSize) {
          for (let y = startY; y < endY; y += gridSize) {
            ctx.strokeRect(x, y, gridSize, gridSize);
          }
        }
        break;
      case "lines":
        // Horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
        }
        // Vertical lines
        for (let x = startX; x < endX; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, startY);
          ctx.lineTo(x, endY);
          ctx.stroke();
        }
        break;
      case "isometric":
        const isoSize = gridSize * 2;
        for (let x = startX; x < endX; x += isoSize) {
          for (let y = startY; y < endY; y += isoSize) {
            // Draw isometric diamond
            ctx.beginPath();
            ctx.moveTo(x, y + isoSize / 2);
            ctx.lineTo(x + isoSize / 2, y);
            ctx.lineTo(x + isoSize, y + isoSize / 2);
            ctx.lineTo(x + isoSize / 2, y + isoSize);
            ctx.closePath();
            ctx.stroke();
          }
        }
        break;
    }

    ctx.restore();
  }, [backgroundType, backgroundColor, zoom, panX, panY, theme]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    // Set up transformation for elements
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panX / zoom, panY / zoom);

    // Draw all elements with theme-aware colors, in stacking order. Skip any
    // element currently marked for erasing so it visibly disappears mid-stroke.
    sortedElements.forEach((element) => {
      if (isErasing && erasedElements.has(element.id)) return;
      // While editing a text element, the live <textarea> shows its content —
      // skip the canvas copy so the text isn't rendered twice (offset/distorted).
      if (textInput?.isEditing && textInput.element.id === element.id) return;
      const themeAwareElement = {
        ...element,
        strokeColor: getThemeAwareStrokeColor(element.strokeColor, theme),
        fillColor: getThemeAwareFillColor(element.fillColor, theme),
      };
      drawElement(ctx, themeAwareElement);
    });

    // Draw current element being created with theme-aware colors
    if (currentElement) {
      const themeAwareCurrentElement = {
        ...currentElement,
        strokeColor: getThemeAwareStrokeColor(
          currentElement.strokeColor,
          theme
        ),
        fillColor: getThemeAwareFillColor(currentElement.fillColor, theme),
      };
      drawElement(ctx, themeAwareCurrentElement);
    }

    // Draw laser elements with special styling
    laserElements.forEach((laserElement) => {
      const timeElapsed = Date.now() - (laserElement.data?.startTime || 0);
      const fadeProgress = Math.min(timeElapsed / 2000, 1); // 2 second fade
      const opacity = 0.8 * (1 - fadeProgress);

      if (opacity > 0) {
        const laserElementWithOpacity = {
          ...laserElement,
          opacity,
          strokeColor: "#ff0000", // Always red for laser
          strokeWidth: 3,
        };
        drawElement(ctx, laserElementWithOpacity);
      }
    });

    // Draw current laser path being drawn
    if (isLaserDrawing && currentLaserPath.length > 0) {
      const currentLaserElement = {
        id: "current_laser",
        type: "laser" as const,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        angle: 0,
        strokeColor: "#ff0000",
        fillColor: "transparent",
        strokeWidth: 3,
        strokeStyle: "solid" as const,
        opacity: 0.8,
        locked: false,
        zIndex: 1000,
        data: { points: currentLaserPath },
      };
      drawElement(ctx, currentLaserElement);
    }

    // Restore context
    ctx.restore();

    // Draw selection handles
    drawSelectionHandles(ctx);

    // Draw eraser hover preview
    drawEraserHoverPreview(ctx);

    // Draw hover preview for select tool
    drawHoverPreview(ctx);

    // Draw eraser stroke
    drawEraserStroke(ctx);

    // Draw selection rectangle
    drawSelectionRectangle(ctx);

    // Draw collaborative cursors
    drawCollaborativeCursors(ctx);
  }, [
    elements,
    sortedElements,
    currentElement,
    selectedElementIds,
    zoom,
    panX,
    panY,
    collaborativeUsers,
    tool,
    hoveredElement,
    isErasing,
    erasedElements,
    eraserStroke,
    textInput,
    drawBackground,
    theme,
    laserElements,
    isLaserDrawing,
    currentLaserPath,
    imageLoadCounter,
    isSelecting,
    selectionRect,
    drawSelectionRectangle,
    drawHoverPreview,
  ]);

  const drawSelectionHandles = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const selectedElements = elements.filter((el) =>
        selectedElementIds.includes(el.id)
      );

      selectedElements.forEach((element) => {
        // Text elements show no selection rectangle or resize handles — the
        // only affordance is double-clicking to edit them in place.
        if (element.type === "text") return;

        let x, y, width, height;

        if (
          element.type === "freehand" ||
          element.type === "eraser" ||
          element.type === "laser"
        ) {
          // Calculate bounding box from path points
          const points = element.data?.points || [];
          if (points.length === 0) return;

          let minX = points[0].x;
          let maxX = points[0].x;
          let minY = points[0].y;
          let maxY = points[0].y;

          for (const point of points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          }

          x = minX * zoom + panX;
          y = minY * zoom + panY;
          width = (maxX - minX) * zoom;
          height = (maxY - minY) * zoom;
        } else {
          // Use element bounds for other types (including images)
          x = element.x * zoom + panX;
          y = element.y * zoom + panY;
          width = element.width * zoom;
          height = element.height * zoom;
        }

        // Draw selection rectangle
        ctx.save();
        ctx.strokeStyle = "hsl(221, 83%, 53%)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, width, height);

        // For path-based elements, also draw a subtle background to make them easier to see
        if (
          element.type === "freehand" ||
          element.type === "eraser" ||
          element.type === "laser"
        ) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.05)";
          ctx.fillRect(x, y, width, height);
        }

        // Draw handles
        const handleSize = 8;
        ctx.fillStyle = "hsl(221, 83%, 53%)";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        // For arrows and lines, draw special start/end handles
        if (element.type === "arrow" || element.type === "line") {
          const startX = x;
          const startY = y;
          const endX = x + width;
          const endY = y + height;

          const handles = [
            { x: startX - handleSize / 2, y: startY - handleSize / 2 },
            { x: endX - handleSize / 2, y: endY - handleSize / 2 },
          ];

          handles.forEach((handle, index) => {
            // Draw circular handles for start/end points
            ctx.beginPath();
            ctx.arc(
              handle.x + handleSize / 2,
              handle.y + handleSize / 2,
              handleSize / 2,
              0,
              2 * Math.PI
            );
            ctx.fill();
            ctx.stroke();

            // Add a small indicator for start vs end
            if (index === 0) {
              // Start handle - draw a small circle in the center
              ctx.fillStyle = "white";
              ctx.beginPath();
              ctx.arc(
                handle.x + handleSize / 2,
                handle.y + handleSize / 2,
                2,
                0,
                2 * Math.PI
              );
              ctx.fill();
              ctx.fillStyle = "hsl(221, 83%, 53%)"; // Reset fill style
            } else if (element.type === "arrow") {
              // End handle for arrow - draw a small arrow indicator
              ctx.fillStyle = "white";
              ctx.beginPath();
              ctx.moveTo(
                handle.x + handleSize / 2,
                handle.y + handleSize / 2 - 2
              );
              ctx.lineTo(
                handle.x + handleSize / 2 + 2,
                handle.y + handleSize / 2 + 2
              );
              ctx.lineTo(
                handle.x + handleSize / 2 - 2,
                handle.y + handleSize / 2 + 2
              );
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = "hsl(221, 83%, 53%)"; // Reset fill style
            }
          });
        } else {
          // Standard rectangular handles for other elements
          const handles = [
            { x: x - handleSize / 2, y: y - handleSize / 2 },
            { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2 },
            { x: x + width - handleSize / 2, y: y - handleSize / 2 },
            {
              x: x + width - handleSize / 2,
              y: y + height / 2 - handleSize / 2,
            },
            { x: x + width - handleSize / 2, y: y + height - handleSize / 2 },
            {
              x: x + width / 2 - handleSize / 2,
              y: y + height - handleSize / 2,
            },
            { x: x - handleSize / 2, y: y + height - handleSize / 2 },
            { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2 },
          ];

          handles.forEach((handle) => {
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
          });
        }

        ctx.restore();
      });
    },
    [elements, selectedElementIds, zoom, panX, panY]
  );

  const drawEraserHoverPreview = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Skip the red box + "X" for path-based strokes (freehand/eraser/laser):
      // their x/y/width/height are 0 so the box would be wrong, and the cross
      // over a thin stroke just looks noisy.
      if (
        tool === "eraser" &&
        hoveredElement &&
        hoveredElement.type !== "freehand" &&
        hoveredElement.type !== "eraser" &&
        hoveredElement.type !== "laser"
      ) {
        const x = hoveredElement.x * zoom + panX;
        const y = hoveredElement.y * zoom + panY;
        const width = hoveredElement.width * zoom;
        const height = hoveredElement.height * zoom;

        ctx.save();
        ctx.strokeStyle = "#ef4444";
        ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Draw red highlight
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);

        // Draw "X" in center
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x + width / 2 - 10, y + height / 2 - 10);
        ctx.lineTo(x + width / 2 + 10, y + height / 2 + 10);
        ctx.moveTo(x + width / 2 + 10, y + height / 2 - 10);
        ctx.lineTo(x + width / 2 - 10, y + height / 2 + 10);
        ctx.stroke();

        ctx.restore();
      }
    },
    [tool, hoveredElement, zoom, panX, panY]
  );

  const drawEraserStroke = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (tool === "eraser" && isErasing && eraserStroke.length > 0) {
        ctx.save();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.7;

        ctx.beginPath();
        const startPoint = eraserStroke[0];
        ctx.moveTo(startPoint.x * zoom + panX, startPoint.y * zoom + panY);

        for (let i = 1; i < eraserStroke.length; i++) {
          const point = eraserStroke[i];
          ctx.lineTo(point.x * zoom + panX, point.y * zoom + panY);
        }

        ctx.stroke();
        ctx.restore();
      }
    },
    [tool, isErasing, eraserStroke, zoom, panX, panY]
  );

  const drawCollaborativeCursors = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      collaborativeUsers.forEach((user) => {
        if (user.cursor) {
          const x = user.cursor.x * zoom + panX;
          const y = user.cursor.y * zoom + panY;

          ctx.save();
          ctx.fillStyle = user.color;

          // Draw cursor
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 20, y + 7);
          ctx.lineTo(x + 7, y + 10);
          ctx.lineTo(x, y + 20);
          ctx.closePath();
          ctx.fill();

          // Draw username label
          ctx.fillStyle = user.color;
          ctx.font = "12px Inter, sans-serif";
          const textWidth = ctx.measureText(user.username).width;
          ctx.fillRect(x + 8, y + 16, textWidth + 8, 20);

          ctx.fillStyle = "white";
          ctx.fillText(user.username, x + 12, y + 30);

          ctx.restore();
        }
      });
    },
    [collaborativeUsers, zoom, panX, panY]
  );

  // Helper function to check if an element intersects with selection rectangle
  const getElementsInSelectionRect = useCallback(
    (rect: { startX: number; startY: number; endX: number; endY: number }) => {
      const x = Math.min(rect.startX, rect.endX);
      const y = Math.min(rect.startY, rect.endY);
      const width = Math.abs(rect.endX - rect.startX);
      const height = Math.abs(rect.endY - rect.startY);

      return elements.filter((element) => {
        let elementX, elementY, elementWidth, elementHeight;

        if (
          element.type === "freehand" ||
          element.type === "eraser" ||
          element.type === "laser"
        ) {
          // For path-based elements, calculate bounds from points
          const points = element.data?.points || [];
          if (points.length === 0) return false;

          let minX = points[0].x;
          let maxX = points[0].x;
          let minY = points[0].y;
          let maxY = points[0].y;

          for (const point of points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          }

          elementX = minX * zoom + panX;
          elementY = minY * zoom + panY;
          elementWidth = (maxX - minX) * zoom;
          elementHeight = (maxY - minY) * zoom;
        } else {
          // For other elements, use element bounds. Normalize so lines/arrows
          // with negative width/height (drawn right-to-left or upward) still get
          // a valid box and can be marquee-selected.
          const left = Math.min(element.x, element.x + element.width);
          const top = Math.min(element.y, element.y + element.height);
          elementX = left * zoom + panX;
          elementY = top * zoom + panY;
          elementWidth = Math.abs(element.width) * zoom;
          elementHeight = Math.abs(element.height) * zoom;
        }

        // Check if element intersects with selection rectangle
        return (
          elementX < x + width &&
          elementX + elementWidth > x &&
          elementY < y + height &&
          elementY + elementHeight > y
        );
      });
    },
    [elements, zoom, panX, panY]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const mousePos = getMousePos(e);
      const canvasPos = screenToCanvas(mousePos, zoom, panX, panY);

      // If we're editing text and click elsewhere, finalize the text
      if (textInput) {
        const currentText = textareaRef.current?.value || "";
        handleTextSubmit(currentText);
        return;
      }

      if (tool === "select") {
        // Check if clicking on a resize handle first
        const handle = getResizeHandleAtPoint(mousePos);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStart(canvasPos);
          // Snapshot the original geometry of every selected element so the
          // resize can be computed from an absolute start (stable scaling for
          // path elements, single undo entry on release).
          const snapshot = new Map<
            string,
            {
              x: number;
              y: number;
              width: number;
              height: number;
              points?: Point[];
            }
          >();
          selectedElementIds.forEach((id) => {
            const el = elements.find((e) => e.id === id);
            if (!el) return;
            const isPath =
              el.type === "freehand" ||
              el.type === "eraser" ||
              el.type === "laser";
            if (isPath) {
              const b = getElementCanvasBounds(el);
              snapshot.set(id, {
                x: b.x,
                y: b.y,
                width: b.width,
                height: b.height,
                points: el.data?.points ? [...el.data.points] : [],
              });
            } else {
              snapshot.set(id, {
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
              });
            }
          });
          setOriginalElementPositions(snapshot);
          // Set appropriate resize cursor
          switch (handle) {
            case "nw":
            case "se":
              setCursorState("nw-resize");
              break;
            case "ne":
            case "sw":
              setCursorState("ne-resize");
              break;
            case "n":
            case "s":
              setCursorState("ns-resize");
              break;
            case "e":
            case "w":
              setCursorState("ew-resize");
              break;
            default:
              setCursorState("move");
          }
          return;
        }

        // Check if clicking on an element
        const clickedElement = getElementAtPoint(canvasPos);

        if (clickedElement) {
          // Shift-click toggles membership. A plain click on an element that is
          // already part of the selection keeps the whole selection so a
          // multi-selection can be dragged as a group; clicking a different
          // element replaces the selection with just that one.
          if (e.shiftKey) {
            onElementSelect(clickedElement.id, true);
          } else if (!selectedElementIds.includes(clickedElement.id)) {
            onElementSelect(clickedElement.id, false);
          }
          setIsMoving(true);
          setMoveStart(canvasPos);
          setCursorState("move");
        } else {
          // Start selection rectangle
          if (!e.shiftKey) {
            onClearSelection();
          }
          setIsSelecting(true);
          setSelectionRect({
            startX: mousePos.x,
            startY: mousePos.y,
            endX: mousePos.x,
            endY: mousePos.y,
          });
          setCursorState("crosshair");
        }
      } else if (tool === "hand") {
        // Hand tool - start panning
        setIsPanning(true);
        setDragStart(mousePos);
        setCursorState("grabbing");
      } else if (tool === "eraser") {
        // Handle eraser tool - start erasing mode. Elements touched by the
        // stroke are marked (and hidden from the render) and deleted in a
        // single batch on mouse up, so a whole erase pass is one undo step.
        setIsErasing(true);
        setEraserStroke([canvasPos]);

        const clickedElement = getElementAtPoint(canvasPos);
        setErasedElements(
          clickedElement ? new Set([clickedElement.id]) : new Set()
        );
      } else if (tool === "text") {
        // Handle text tool - create text input
        const newElement: CanvasElement = {
          id: `element_${Date.now()}_${Math.random()}`,
          type: "text",
          x: canvasPos.x,
          y: canvasPos.y,
          width: 200,
          height: 50, // Increased height to better accommodate multi-line text
          angle: 0,
          strokeColor: DEFAULT_STROKE_COLOR,
          fillColor: "transparent",
          strokeWidth: 2,
          strokeStyle: "solid",
          opacity: 1,
          locked: false,
          zIndex: elements.length,
          fontSize: 16,
          fontWeight: "normal",
          data: { text: "", fontFamily: "Inter, sans-serif" },
        };

        setTextInput({
          element: newElement,
          position: canvasPos,
          isEditing: false,
        });
      } else if (tool === "image") {
        // Handle image tool - open upload modal
        setIsImageUploadOpen(true);
      } else if (tool === "embed") {
        // Handle embed tool - open link modal
        setIsEmbedModalOpen(true);
      } else if (tool === "laser") {
        // Start laser drawing
        setIsLaserDrawing(true);
        setCurrentLaserPath([canvasPos]);
      } else {
        // Start drawing new element
        setIsDrawing(true);
        setDragStart(canvasPos);

        const newElement: CanvasElement = {
          id: `element_${Date.now()}_${Math.random()}`,
          type: tool as any,
          x: canvasPos.x,
          y: canvasPos.y,
          width: 0,
          height: 0,
          angle: 0,
          strokeColor: DEFAULT_STROKE_COLOR,
          fillColor: "transparent",
          strokeWidth: 2,
          strokeStyle: "solid",
          opacity: 1,
          locked: false,
          zIndex: elements.length,
          data: tool === "freehand" ? { points: [canvasPos] } : undefined,
        };

        setCurrentElement(newElement);
      }
    },
    [
      tool,
      getMousePos,
      zoom,
      panX,
      panY,
      elements,
      selectedElementIds,
      getElementCanvasBounds,
      onElementSelect,
      onClearSelection,
      theme,
      textInput,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const mousePos = getMousePos(e);
      const canvasPos = screenToCanvas(mousePos, zoom, panX, panY);

      // Update cursor state
      const newCursorState = getCursorState();
      if (newCursorState !== cursorState) {
        setCursorState(newCursorState);
      }

      // Send cursor position for collaboration (throttled)
      if (onCursorMove) {
        onCursorMove(canvasPos.x, canvasPos.y);
      }

      // Handle eraser functionality
      if (tool === "eraser") {
        if (isErasing) {
          // Add point to eraser stroke
          const newStroke = [...eraserStroke, canvasPos];
          setEraserStroke(newStroke);

          // Check for elements that intersect with the eraser stroke
          elements.forEach((element) => {
            if (!erasedElements.has(element.id)) {
              let intersects = false;

              if (
                element.type === "freehand" ||
                element.type === "eraser" ||
                element.type === "laser"
              ) {
                // For path-based elements, check if eraser stroke intersects with any path points
                const points = element.data?.points || [];
                // ~15 screen px, converted to canvas units so the felt radius
                // stays constant regardless of zoom.
                const eraserRadius = 15 / zoom;

                for (const pathPoint of points) {
                  for (const eraserPoint of newStroke) {
                    const distance = Math.sqrt(
                      Math.pow(eraserPoint.x - pathPoint.x, 2) +
                        Math.pow(eraserPoint.y - pathPoint.y, 2)
                    );
                    if (distance <= eraserRadius) {
                      intersects = true;
                      break;
                    }
                  }
                  if (intersects) break;
                }
              } else if (element.type === "line" || element.type === "arrow") {
                // For lines and arrows, check if eraser stroke intersects with the line
                const startX = element.x;
                const startY = element.y;
                const endX = element.x + element.width;
                const endY = element.y + element.height;
                const eraserRadius = 15 / zoom;

                for (const eraserPoint of newStroke) {
                  const distance = distanceToLine(
                    eraserPoint.x,
                    eraserPoint.y,
                    startX,
                    startY,
                    endX,
                    endY
                  );
                  if (distance <= eraserRadius) {
                    intersects = true;
                    break;
                  }
                }
              } else {
                // For other elements, check if eraser stroke intersects with rectangular bounds
                const eraserRadius = 15 / zoom;
                for (const eraserPoint of newStroke) {
                  if (
                    eraserPoint.x >= element.x - eraserRadius &&
                    eraserPoint.x <= element.x + element.width + eraserRadius &&
                    eraserPoint.y >= element.y - eraserRadius &&
                    eraserPoint.y <= element.y + element.height + eraserRadius
                  ) {
                    intersects = true;
                    break;
                  }
                }
              }

              if (intersects) {
                // Mark for deletion; actual removal is batched on mouse up.
                setErasedElements((prev) => new Set([...prev, element.id]));
              }
            }
          });
        } else {
          // Show hover preview when not erasing
          const hoveredEl = getElementAtPoint(canvasPos);
          setHoveredElement(hoveredEl);
        }
      } else if (tool === "laser" && isLaserDrawing) {
        // Add point to current laser path
        setCurrentLaserPath((prev) => [...prev, canvasPos]);
      } else if (isSelecting && selectionRect) {
        // Update selection rectangle
        setSelectionRect((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            endX: mousePos.x,
            endY: mousePos.y,
          };
        });
      } else {
        // Show hover effect for elements when in select mode
        if (tool === "select") {
          const hoveredEl = getElementAtPoint(canvasPos);
          setHoveredElement(hoveredEl);

          // Check if hovering over resize handles when in select mode
          if (selectedElementIds.length > 0) {
            const handle = getResizeHandleAtPoint(mousePos);
            if (handle) {
              switch (handle) {
                case "nw":
                case "se":
                  setCursorState("nw-resize");
                  break;
                case "ne":
                case "sw":
                  setCursorState("ne-resize");
                  break;
                case "n":
                case "s":
                  setCursorState("ns-resize");
                  break;
                case "e":
                case "w":
                  setCursorState("ew-resize");
                  break;
                case "start":
                case "end":
                  setCursorState("crosshair"); // Use crosshair for start/end handles
                  break;
                default:
                  setCursorState("default");
              }
            } else {
              setCursorState(hoveredEl ? "move" : "default");
            }
          } else {
            setCursorState(hoveredEl ? "move" : "default");
          }
        } else {
          setHoveredElement(null);
        }
      }

      if (isPanning && dragStart) {
        const deltaX = mousePos.x - dragStart.x;
        const deltaY = mousePos.y - dragStart.y;
        onPanChange(panX + deltaX, panY + deltaY);
        setDragStart(mousePos);
      } else if (isMoving && moveStart) {
        // Snapshot the original geometry on the first move frame, and use that
        // same snapshot immediately so there's no one-frame lag.
        let positions = originalElementPositions;
        if (positions.size === 0) {
          positions = new Map();
          selectedElementIds.forEach((id) => {
            const element = elements.find((el) => el.id === id);
            if (!element) return;
            const isPath =
              element.type === "freehand" ||
              element.type === "eraser" ||
              element.type === "laser";
            positions.set(id, {
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              points:
                isPath && element.data?.points
                  ? [...element.data.points]
                  : undefined,
            });
          });
          setOriginalElementPositions(positions);
        }

        // canvasPos and moveStart are both already in canvas units (screenToCanvas
        // divided by zoom), so the delta is the final canvas-space delta — do NOT
        // divide by zoom again.
        const deltaX = canvasPos.x - moveStart.x;
        const deltaY = canvasPos.y - moveStart.y;

        // Build one batched update so every selected element moves together
        // (looping single updates dropped all but the last element).
        const updates: Record<string, Partial<CanvasElement>> = {};
        selectedElementIds.forEach((id) => {
          const originalPos = positions.get(id);
          if (!originalPos) return;
          const element = elements.find((el) => el.id === id);
          if (!element) return;

          const isPath =
            element.type === "freehand" ||
            element.type === "eraser" ||
            element.type === "laser";
          if (isPath) {
            const originalPoints = originalPos.points || [];
            updates[id] = {
              data: {
                ...element.data,
                points: originalPoints.map((point: Point) => ({
                  x: point.x + deltaX,
                  y: point.y + deltaY,
                })),
              },
            };
          } else {
            updates[id] = {
              x: originalPos.x + deltaX,
              y: originalPos.y + deltaY,
            };
          }
        });
        if (Object.keys(updates).length > 0) onElementsUpdateLive(updates);
      } else if (isResizing && dragStart && resizeHandle) {
        // Absolute resize from the snapshot captured on mouse down. dragStart is
        // already in canvas units, so the delta is final — no extra /zoom.
        const deltaX = canvasPos.x - dragStart.x;
        const deltaY = canvasPos.y - dragStart.y;

        const updates: Record<string, Partial<CanvasElement>> = {};
        selectedElementIds.forEach((id) => {
          const element = elements.find((el) => el.id === id);
          const orig = originalElementPositions.get(id);
          if (!element || !orig) return;

          const isPath =
            element.type === "freehand" ||
            element.type === "eraser" ||
            element.type === "laser";

          // Arrows/lines: drag the start or end endpoint directly.
          if (
            (element.type === "arrow" || element.type === "line") &&
            (resizeHandle === "start" || resizeHandle === "end")
          ) {
            if (resizeHandle === "start") {
              updates[id] = {
                x: orig.x + deltaX,
                y: orig.y + deltaY,
                width: orig.width - deltaX,
                height: orig.height - deltaY,
              };
            } else {
              updates[id] = {
                width: orig.width + deltaX,
                height: orig.height + deltaY,
              };
            }
            return;
          }

          // Box resize: compute the new bounding box from the original.
          let nx = orig.x;
          let ny = orig.y;
          let nw = orig.width;
          let nh = orig.height;
          switch (resizeHandle) {
            case "nw":
              nx = orig.x + deltaX;
              ny = orig.y + deltaY;
              nw = orig.width - deltaX;
              nh = orig.height - deltaY;
              break;
            case "n":
              ny = orig.y + deltaY;
              nh = orig.height - deltaY;
              break;
            case "ne":
              ny = orig.y + deltaY;
              nw = orig.width + deltaX;
              nh = orig.height - deltaY;
              break;
            case "e":
              nw = orig.width + deltaX;
              break;
            case "se":
              nw = orig.width + deltaX;
              nh = orig.height + deltaY;
              break;
            case "s":
              nh = orig.height + deltaY;
              break;
            case "sw":
              nx = orig.x + deltaX;
              nw = orig.width - deltaX;
              nh = orig.height + deltaY;
              break;
            case "w":
              nx = orig.x + deltaX;
              nw = orig.width - deltaX;
              break;
          }
          nw = Math.max(10, nw);
          nh = Math.max(10, nh);

          if (isPath) {
            // Scale the path points to fit the new bounding box.
            const originalPoints = orig.points || [];
            const sx = orig.width > 0 ? nw / orig.width : 1;
            const sy = orig.height > 0 ? nh / orig.height : 1;
            updates[id] = {
              data: {
                ...element.data,
                points: originalPoints.map((p: Point) => ({
                  x: nx + (p.x - orig.x) * sx,
                  y: ny + (p.y - orig.y) * sy,
                })),
              },
            };
          } else {
            updates[id] = { x: nx, y: ny, width: nw, height: nh };
          }
        });
        if (Object.keys(updates).length > 0) onElementsUpdateLive(updates);
      } else if (isDrawing && dragStart && currentElement) {
        if (tool === "freehand" || tool === "eraser") {
          // Add point to freehand/eraser path
          const updatedElement = {
            ...currentElement,
            data: {
              ...currentElement.data,
              points: [...(currentElement.data?.points || []), canvasPos],
            },
          };
          setCurrentElement(updatedElement);
        } else {
          // Update element dimensions
          const width = canvasPos.x - dragStart.x;
          const height = canvasPos.y - dragStart.y;

          let updatedElement;

          if (tool === "line" || tool === "arrow") {
            // For lines and arrows, store actual start and end points
            updatedElement = {
              ...currentElement,
              x: dragStart.x,
              y: dragStart.y,
              width: canvasPos.x - dragStart.x,
              height: canvasPos.y - dragStart.y,
            };
          } else {
            // For other shapes, use the existing logic
            updatedElement = {
              ...currentElement,
              width: Math.abs(width),
              height: Math.abs(height),
              x: width < 0 ? canvasPos.x : dragStart.x,
              y: height < 0 ? canvasPos.y : dragStart.y,
            };
          }

          setCurrentElement(updatedElement);
        }
      }
    },
    [
      getMousePos,
      zoom,
      panX,
      panY,
      onCursorMove,
      getCursorState,
      cursorState,
      isPanning,
      isDrawing,
      dragStart,
      currentElement,
      tool,
      onPanChange,
      isMoving,
      moveStart,
      originalElementPositions,
      selectedElementIds,
      elements,
      onElementsUpdateLive,
      isResizing,
      resizeHandle,
      isErasing,
      eraserStroke,
      erasedElements,
    ]
  );

  const handleMouseUp = useCallback(() => {
    // Handle laser tool finishing
    if (isLaserDrawing && currentLaserPath.length > 0) {
      const newLaserElement: CanvasElement = {
        id: `laser_${Date.now()}_${Math.random()}`,
        type: "laser",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        angle: 0,
        strokeColor: "#ff0000",
        fillColor: "transparent",
        strokeWidth: 3,
        strokeStyle: "solid",
        opacity: 0.8,
        locked: false,
        zIndex: 1000,
        data: { points: currentLaserPath, startTime: Date.now() },
      };

      setLaserElements((prev) => [...prev, newLaserElement]);

      // Remove laser element after 2 seconds
      setTimeout(() => {
        setLaserElements((prev) =>
          prev.filter((el) => el.id !== newLaserElement.id)
        );
      }, 2000);
    }

    if (isDrawing && currentElement) {
      // Only create element if it has some size or is freehand/eraser with points
      if (
        tool === "line" || tool === "arrow"
          ? Math.abs(currentElement.width) > 1 ||
            Math.abs(currentElement.height) > 1
          : currentElement.width > 1 ||
            currentElement.height > 1 ||
            ((tool === "freehand" || tool === "eraser") &&
              currentElement.data?.points?.length > 1)
      ) {
        onElementCreate(currentElement, () => {
          // Auto-select the created element
          // Only switch to select tool if tool is not locked
          if (!toolLocked && tool !== "freehand") {
            onElementSelect(currentElement.id);
            onToolChange("select");
          }
        });
      }
    }

    // Handle selection rectangle completion
    if (isSelecting && selectionRect) {
      const elementsInRect = getElementsInSelectionRect(selectionRect);
      if (elementsInRect.length > 0) {
        // Select all elements in the rectangle at once
        const newSelectedIds = elementsInRect.map((element) => element.id);
        onSelectMultipleElements(newSelectedIds, false); // Replace current selection
      }
    }

    // Commit a move/resize gesture as a single undo entry (live frames updated
    // state without touching history).
    if (isMoving || isResizing) {
      onCommitHistory();
    }

    // Delete everything the eraser touched in one batched action.
    if (isErasing && erasedElements.size > 0) {
      onElementsDelete(Array.from(erasedElements));
    }

    setIsDrawing(false);
    setIsPanning(false);
    setIsErasing(false);
    setIsMoving(false);
    setIsResizing(false);
    setIsLaserDrawing(false);
    setIsSelecting(false);
    setCurrentLaserPath([]);
    setDragStart(null);
    setMoveStart(null);
    setResizeHandle(null);
    setOriginalElementPositions(new Map());
    setCurrentElement(null);
    setErasedElements(new Set());
    setEraserStroke([]);
    setSelectionRect(null);
    setCursorState(getCursorState());
  }, [
    isDrawing,
    currentElement,
    tool,
    toolLocked,
    onElementCreate,
    onElementSelect,
    onToolChange,
    getCursorState,
    isLaserDrawing,
    currentLaserPath,
    isSelecting,
    selectionRect,
    getElementsInSelectionRect,
    isMoving,
    isResizing,
    onCommitHistory,
    isErasing,
    erasedElements,
    onElementsDelete,
  ]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Zoom with Ctrl/Cmd + scroll
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

        // Zoom towards mouse position
        const zoomFactor = newZoom / zoom;
        const newPanX = mouseX - (mouseX - panX) * zoomFactor;
        const newPanY = mouseY - (mouseY - panY) * zoomFactor;

        onPanChange(newPanX, newPanY);
        onZoomChange(newZoom);
      } else {
        // Pan with regular scroll
        const deltaX = e.deltaX || 0;
        const deltaY = e.deltaY || 0;
        onPanChange(panX - deltaX, panY - deltaY);
      }
    },
    [zoom, panX, panY, onPanChange]
  );

  const getElementAtPoint = useCallback(
    (point: Point): CanvasElement | null => {
      // Walk front-to-back in stacking order so the topmost element is picked.
      for (let i = sortedElements.length - 1; i >= 0; i--) {
        const element = sortedElements[i];

        if (
          element.type === "freehand" ||
          element.type === "eraser" ||
          element.type === "laser"
        ) {
          // For path-based elements, check if point is near the path
          const points = element.data?.points || [];
          if (points.length === 0) continue;

          // Use a larger threshold for easier selection
          const threshold = 20; // pixels - increased from 10

          // First check if point is near any path point
          for (const pathPoint of points) {
            const distance = Math.sqrt(
              Math.pow(point.x - pathPoint.x, 2) +
                Math.pow(point.y - pathPoint.y, 2)
            );
            if (distance <= threshold) {
              return element;
            }
          }

          // Also check if point is near any line segment between consecutive points
          for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const distance = distanceToLine(
              point.x,
              point.y,
              p1.x,
              p1.y,
              p2.x,
              p2.y
            );
            if (distance <= threshold) {
              return element;
            }
          }
        } else if (element.type === "line" || element.type === "arrow") {
          // For lines and arrows, use distance to line with larger threshold
          const startX = element.x;
          const startY = element.y;
          const endX = element.x + element.width;
          const endY = element.y + element.height;

          // Use a larger threshold for arrows to make them easier to select
          const threshold = element.type === "arrow" ? 25 : 15;

          const distance = distanceToLine(
            point.x,
            point.y,
            startX,
            startY,
            endX,
            endY
          );

          if (distance <= threshold) {
            return element;
          }
        } else if (element.type === "text") {
          // For text elements, use the stored element dimensions
          // The dimensions should be properly maintained by the drawText function
          if (
            point.x >= element.x &&
            point.x <= element.x + element.width &&
            point.y >= element.y &&
            point.y <= element.y + element.height
          ) {
            return element;
          }
        } else if (element.type === "image" || element.type === "embed") {
          // For image and embed elements, check if point is within the element bounds
          if (
            point.x >= element.x &&
            point.x <= element.x + element.width &&
            point.y >= element.y &&
            point.y <= element.y + element.height
          ) {
            return element;
          }
        } else {
          // For other elements (rectangles, circles, etc.), use rectangular bounds
          if (
            point.x >= element.x &&
            point.x <= element.x + element.width &&
            point.y >= element.y &&
            point.y <= element.y + element.height
          ) {
            return element;
          }
        }
      }
      return null;
    },
    [sortedElements, distanceToLine]
  );

  const getResizeHandleAtPoint = useCallback(
    (point: Point): string | null => {
      const selectedElements = elements.filter((el) =>
        selectedElementIds.includes(el.id)
      );

      for (const element of selectedElements) {
        // Text has no resize handles (see drawSelectionHandles).
        if (element.type === "text") continue;

        let x, y, width, height;

        if (
          element.type === "freehand" ||
          element.type === "eraser" ||
          element.type === "laser"
        ) {
          // Calculate bounding box from path points
          const points = element.data?.points || [];
          if (points.length === 0) continue;

          let minX = points[0].x;
          let maxX = points[0].x;
          let minY = points[0].y;
          let maxY = points[0].y;

          for (const point of points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          }

          x = minX * zoom + panX;
          y = minY * zoom + panY;
          width = (maxX - minX) * zoom;
          height = (maxY - minY) * zoom;
        } else {
          // Use element bounds for other types (including images)
          x = element.x * zoom + panX;
          y = element.y * zoom + panY;
          width = element.width * zoom;
          height = element.height * zoom;
        }

        const handleSize = 8;

        // For arrows and lines, add special start/end handles for easier manipulation
        if (element.type === "arrow" || element.type === "line") {
          const startX = x;
          const startY = y;
          const endX = x + width;
          const endY = y + height;

          const handles = [
            {
              id: "start",
              x: startX - handleSize / 2,
              y: startY - handleSize / 2,
            },
            { id: "end", x: endX - handleSize / 2, y: endY - handleSize / 2 },
          ];

          for (const handle of handles) {
            if (
              point.x >= handle.x &&
              point.x <= handle.x + handleSize &&
              point.y >= handle.y &&
              point.y <= handle.y + handleSize
            ) {
              return handle.id;
            }
          }
        } else {
          // Standard handles for other elements
          const handles = [
            { id: "nw", x: x - handleSize / 2, y: y - handleSize / 2 },
            {
              id: "n",
              x: x + width / 2 - handleSize / 2,
              y: y - handleSize / 2,
            },
            { id: "ne", x: x + width - handleSize / 2, y: y - handleSize / 2 },
            {
              id: "e",
              x: x + width - handleSize / 2,
              y: y + height / 2 - handleSize / 2,
            },
            {
              id: "se",
              x: x + width - handleSize / 2,
              y: y + height - handleSize / 2,
            },
            {
              id: "s",
              x: x + width / 2 - handleSize / 2,
              y: y + height - handleSize / 2,
            },
            { id: "sw", x: x - handleSize / 2, y: y + height - handleSize / 2 },
            {
              id: "w",
              x: x - handleSize / 2,
              y: y + height / 2 - handleSize / 2,
            },
          ];

          for (const handle of handles) {
            if (
              point.x >= handle.x &&
              point.x <= handle.x + handleSize &&
              point.y >= handle.y &&
              point.y <= handle.y + handleSize
            ) {
              return handle.id;
            }
          }
        }
      }

      return null;
    },
    [elements, selectedElementIds, zoom, panX, panY]
  );

  // Calculate text element dimensions based on content, using the same shared
  // measurement helper as the renderer so the hit-box always matches the glyphs.
  const calculateTextDimensions = useCallback(
    (text: string, element: CanvasElement) => {
      const { fontSize, fontWeight, fontFamily } = getTextFont(element);
      return measureTextSize(text, fontSize, fontWeight, fontFamily);
    },
    []
  );

  const handleTextSubmit = useCallback(
    (text: string) => {
      if (textInput) {
        const trimmed = text.trim();
        if (trimmed) {
          const elementWithText = {
            ...textInput.element,
            data: { ...textInput.element.data, text: trimmed },
          };

          // Calculate proper dimensions for the text
          const dimensions = calculateTextDimensions(trimmed, elementWithText);
          elementWithText.width = dimensions.width;
          elementWithText.height = dimensions.height;

          if (textInput.isEditing) {
            // Update existing element
            onElementUpdate(textInput.element.id, {
              data: elementWithText.data,
              width: elementWithText.width,
              height: elementWithText.height,
            });
          } else {
            // Create new element
            onElementCreate(elementWithText, () => {
              // Auto-select the created text element and switch to select tool
              onElementSelect(elementWithText.id);
              onToolChange("select");
            });
          }
        } else if (textInput.isEditing) {
          // An existing text element was cleared to empty → delete it rather
          // than leaving an invisible zero-content element behind.
          onElementsDelete([textInput.element.id]);
        }
      }
      setTextInput(null);
    },
    [
      textInput,
      onElementCreate,
      onElementUpdate,
      onElementsDelete,
      onElementSelect,
      onToolChange,
      calculateTextDimensions,
    ]
  );

  const handleTextCancel = useCallback(() => {
    setTextInput(null);
  }, []);

  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (tool !== "select") return;

      const mousePos = getMousePos(e);
      const canvasPos = screenToCanvas(mousePos, zoom, panX, panY);
      const clickedElement = getElementAtPoint(canvasPos);

      if (clickedElement && clickedElement.type === "text") {
        // Double-click an existing text element → edit it in place.
        setTextInput({
          element: clickedElement,
          position: { x: clickedElement.x, y: clickedElement.y },
          isEditing: true,
        });
        return;
      }

      // Double-click empty space (or a non-text element) → drop a new text box
      // right there, matching the dedicated text tool's behavior.
      const newElement: CanvasElement = {
        id: `element_${Date.now()}_${Math.random()}`,
        type: "text",
        x: canvasPos.x,
        y: canvasPos.y,
        width: 200,
        height: 50,
        angle: 0,
        strokeColor: DEFAULT_STROKE_COLOR,
        fillColor: "transparent",
        strokeWidth: 2,
        strokeStyle: "solid",
        opacity: 1,
        locked: false,
        zIndex: elements.length,
        fontSize: 16,
        fontWeight: "normal",
        data: { text: "", fontFamily: "Inter, sans-serif" },
      };
      setTextInput({ element: newElement, position: canvasPos, isEditing: false });
    },
    [tool, getMousePos, zoom, panX, panY, getElementAtPoint, elements.length]
  );

  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  const getTouchCenter = useCallback((touches: TouchList): Point => {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: touches[0].clientX - rect.left,
        y: touches[0].clientY - rect.top,
      };
    }

    const touch1 = touches[0];
    const touch2 = touches[1];
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    return {
      x: (touch1.clientX + touch2.clientX) / 2 - rect.left,
      y: (touch1.clientY + touch2.clientY) / 2 - rect.top,
    };
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const touches = e.touches;

      if (touches.length === 1) {
        // Single touch - handle like mouse
        const touch = touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0,
          buttons: 1,
          // Forward modifier keys (hybrid tablets with a keyboard) instead of
          // hardcoding false, so shift-add/constrain works when a key is held.
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
        });
        handleMouseDown(mouseEvent);
      } else if (touches.length === 2) {
        // Two touches - prepare for pinch/pan
        setLastTouchDistance(getTouchDistance(touches));
        setLastTouchCenter(getTouchCenter(touches));
      }
    },
    [handleMouseDown, getTouchDistance, getTouchCenter]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const touches = e.touches;

      if (touches.length === 1) {
        // Single touch - handle like mouse
        const touch = touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0,
          buttons: 1,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
        });
        handleMouseMove(mouseEvent);
      } else if (touches.length === 2 && lastTouchDistance && lastTouchCenter) {
        // Two touches - handle pinch/pan
        const currentDistance = getTouchDistance(touches);
        const currentCenter = getTouchCenter(touches);

        if (currentDistance > 0 && lastTouchDistance > 0) {
          // Pinch to zoom
          const scale = currentDistance / lastTouchDistance;
          const newZoom = Math.max(0.1, Math.min(5, zoom * scale));

          if (newZoom !== zoom) {
            const zoomFactor = newZoom / zoom;
            const newPanX =
              currentCenter.x - (currentCenter.x - panX) * zoomFactor;
            const newPanY =
              currentCenter.y - (currentCenter.y - panY) * zoomFactor;

            onPanChange(newPanX, newPanY);
            onZoomChange(newZoom);
          }
        }

        // Pan with two fingers
        const deltaX = currentCenter.x - lastTouchCenter.x;
        const deltaY = currentCenter.y - lastTouchCenter.y;
        onPanChange(panX + deltaX, panY + deltaY);

        setLastTouchDistance(currentDistance);
        setLastTouchCenter(currentCenter);
      }
    },
    [
      handleMouseMove,
      lastTouchDistance,
      lastTouchCenter,
      getTouchDistance,
      getTouchCenter,
      zoom,
      panX,
      panY,
      onPanChange,
      onZoomChange,
    ]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        // All touches ended
        handleMouseUp();
        setLastTouchDistance(null);
        setLastTouchCenter(null);
      }
    },
    [handleMouseUp]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("dblclick", handleDoubleClick);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    // Touch events for mobile
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("dblclick", handleDoubleClick);
      canvas.removeEventListener("wheel", handleWheel);

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleDoubleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Keep a ref to the latest draw() so the animation loop below can call it
  // without being re-created every frame.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  // Keep the latest elements reachable from async callbacks (font loading).
  const elementsRef = useRef(elements);
  useEffect(() => {
    elementsRef.current = elements;
  });

  // Text is measured with the app webfont (Inter). If that font isn't loaded at
  // first paint, the measured box can be slightly off. Once fonts are ready,
  // repaint and re-measure existing text so the hit-box/selection match the
  // final glyphs.
  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts?.ready) return;
    let cancelled = false;
    fonts.ready.then(() => {
      if (cancelled) return;
      drawRef.current();
      const updates: Record<string, Partial<CanvasElement>> = {};
      elementsRef.current.forEach((el) => {
        if (el.type !== "text") return;
        const { fontSize, fontWeight, fontFamily } = getTextFont(el);
        const dims = measureTextSize(
          el.data?.text || "",
          fontSize,
          fontWeight,
          fontFamily
        );
        if (
          Math.abs(dims.width - el.width) > 0.5 ||
          Math.abs(dims.height - el.height) > 0.5
        ) {
          updates[el.id] = { width: dims.width, height: dims.height };
        }
      });
      if (Object.keys(updates).length > 0) onElementsUpdateLive(updates);
    });
    return () => {
      cancelled = true;
    };
  }, [onElementsUpdateLive]);

  // Laser strokes fade out over ~2s. The fade is computed from elapsed time in
  // draw(), so we need to keep repainting while any laser is alive (or being
  // drawn). Without this loop the opacity was only sampled once and the fade
  // never animated.
  useEffect(() => {
    if (laserElements.length === 0 && !isLaserDrawing) return;
    let raf = 0;
    const loop = () => {
      drawRef.current();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [laserElements.length, isLaserDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [draw]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-white dark:bg-[#121212]">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${
          cursorState === "laser" ? "cursor-laser" : `cursor-${cursorState}`
        }`}
        style={{
          cursor:
            cursorState === "laser"
              ? "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjYiIGZpbGw9IiNmZjAwMDAiLz4KPC9zdmc+Cg==') 8 8, auto"
              : cursorState,
        }}
        data-testid="main-canvas"
      />

      {/* Text Input Overlay */}
      {textInput && (
        <div
          className="absolute z-50"
          style={{
            left: textInput.position.x * zoom + panX,
            top: textInput.position.y * zoom + panY,
          }}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            wrap="off"
            // No tailwind text-size/padding classes: those force a fixed
            // line-height that distorts multi-line text. All metrics below are
            // matched to canvas-utils.drawText (padding/2 inset, 1.2 line-height)
            // so the editor overlays the rendered text exactly — no jump on commit.
            className="bg-transparent focus:outline-none resize-none overflow-hidden"
            style={{
              fontSize: `${getTextFont(textInput.element).fontSize * zoom}px`,
              fontWeight: getTextFont(textInput.element).fontWeight,
              fontFamily: getTextFont(textInput.element).fontFamily,
              lineHeight: 1.2,
              padding: `${5 * zoom}px`,
              color: getThemeAwareStrokeColor(
                textInput.element.strokeColor,
                theme
              ),
              width: `${Math.max(200, textInput.element.width) * zoom}px`,
              minHeight: `${
                (getTextFont(textInput.element).fontSize * 1.2 + 10) * zoom
              }px`,
              border: "none",
              outline: "none",
              boxShadow: "none",
              background: "transparent",
              overflow: "hidden",
              resize: "none",
            }}
            placeholder={textInput.isEditing ? "Edit text..." : "Enter text..."}
            defaultValue={textInput.element.data?.text || ""}
            onInput={(e) => {
              // Auto-resize textarea based on content
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                handleTextCancel();
              }
            }}
            onBlur={(e) => {
              // handleTextSubmit handles the empty case: a brand-new element is
              // simply discarded, an edited element cleared to empty is deleted.
              handleTextSubmit(e.currentTarget.value);
            }}
          />
        </div>
      )}

      {/* Embed Elements Overlay */}
      {useMemo(() => {
        const embedElements = elements.filter(
          (element) => element.type === "embed"
        );

        return embedElements.map((element) => {
          // Match the canvas transform exactly: canvas-space → screen is
          // x * zoom + pan (see canvasToScreen), NOT (x + pan) * zoom.
          const screenPos = {
            x: element.x * zoom + panX,
            y: element.y * zoom + panY,
          };

          return (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: screenPos.x,
                top: screenPos.y,
                width: element.width * zoom,
                height: element.height * zoom,
                transform: `rotate(${element.angle}rad)`,
                opacity: element.opacity,
                willChange: "transform",
                transformOrigin: "center center",
                zIndex: 5,
              }}
            >
              <EmbedPreview
                url={element.embedUrl || ""}
                width={element.width * zoom}
                height={element.height * zoom}
              />
            </div>
          );
        });
      }, [elements, panX, panY, zoom])}

      {/* Scroll to Content Button */}
      <ScrollToContentButton
        isVisible={
          elements.length > 0 &&
          !hasVisibleElements() &&
          onScrollToContent !== undefined &&
          !isDrawing
        }
        onClick={onScrollToContent || (() => {})}
      />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        onImageSelect={(imageData) => handleImageSelect(imageData)}
      />

      {/* Embed Link Modal */}
      <EmbedLinkModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        onLinkSubmit={handleEmbedSubmit}
      />
    </div>
  );
}
