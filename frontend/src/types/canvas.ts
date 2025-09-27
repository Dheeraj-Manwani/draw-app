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
  opacity: number;
  locked: boolean;
  zIndex: number;
  data?: any;
  // Text-specific properties
  fontSize?: number;
  fontWeight?: "normal" | "bold";
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
