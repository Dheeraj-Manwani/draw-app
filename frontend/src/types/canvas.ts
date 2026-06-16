export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type:
    | "rectangle"
    | "ellipse"
    | "line"
    | "arrow"
    | "freehand"
    | "text"
    | "diamond"
    | "eraser"
    | "image"
    | "embed"
    | "laser";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";
  // Corner style for shapes with corners (rectangle, diamond). Defaults to "sharp".
  edges?: "sharp" | "round";
  // How a shape's background is painted when a fill color is set. Defaults to
  // "solid"; hachure/cross-hatch draw the fill as line patterns (Excalidraw-style).
  fillStyle?: "hachure" | "cross-hatch" | "solid";
  // Hand-drawn "sloppiness" rendered via rough.js. 0 = clean/precise; any value
  // > 0 sketches the outline. Defaults to 1 (sloppy) when undefined, so shapes
  // look hand-drawn out of the box.
  roughness?: number;
  opacity: number;
  locked: boolean;
  zIndex: number;
  data?: any;
  // Text-specific properties
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  text?: string;
  // Image-specific properties
  imageUrl?: string;
  imageData?: string; // Base64 data
  cachedImage?: HTMLImageElement; // Cached image to prevent flickering
  imageLoaded?: boolean; // Flag to prevent infinite redraw loops
  onImageLoad?: () => void; // Callback when image loads
  // Embed-specific properties
  embedUrl?: string;
  embedType?: string;
}

export type BackgroundType =
  | "none"
  | "grid"
  | "dots"
  | "squares"
  | "lines"
  | "isometric";

export interface CanvasState {
  elements: CanvasElement[];
  selectedElementIds: string[];
  tool: string;
  zoom: number;
  panX: number;
  panY: number;
  gridVisible: boolean;
  backgroundType: BackgroundType;
  backgroundColor: string;
  toolLocked: boolean;
}

export interface DrawingAction {
  type: "create" | "update" | "delete" | "batch";
  elementId?: string;
  element?: CanvasElement;
  elements?: CanvasElement[];
  prevElement?: CanvasElement;
  prevElements?: CanvasElement[];
}

export interface CollaborativeUser {
  id: string;
  username: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
}

export interface ExportOptions {
  format: "png" | "svg" | "json";
  quality?: number;
  scale?: number;
}

// New interface for saved drawings
export interface SavedDrawing {
  id: string;
  name: string;
  elements?: CanvasElement[];
  backgroundType: BackgroundType;
  backgroundColor: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
  coverImage: number; // Index of cover image from coverImages array (0 to coverImages.length - 1)
}
