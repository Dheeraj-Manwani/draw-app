export type Path = {
  // type: "rect";
  width?: number;
  height?: number;

  // type?: "circle";
  centerX?: number;
  centerY?: number;
  radius?: number;

  // type?: "line";
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
};

export type RectanglePath = {
  startX: number;
  startY: number;
  width: number;
  height: number;
};

export type CirclePath = {
  startX: number;
  startY: number;
  radius: number;
};

export type LinePath = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export enum ElementType {
  CURSOR = "CURSOR",
  RECTANGLE = "RECTANGLE",
  ELLIPSE = "ELLIPSE",
  CIRCLE = "CIRCLE",
  FREE = "FREE",
  LINE = "LINE",
  ARROW = "ARROW",
  TEXT = "TEXT",
  EMBEDDED = "EMBEDDED",
}

export type Element = {
  id: string;
  path: Path;
  type: ElementType;
  position?: CursorPosition;
};

export type Coordinate = {
  x: number;
  y: number;
};

export enum CursorPosition {
  Inside = "inside",
  Start = "start",
  End = "end",
  TopLeft = "top-left",
  TopRight = "top-right",
  BottomLeft = "bottom-left",
  BottomRight = "bottom-right",
  Circumference = "circumference",
  None = "none",
}

export enum Action {
  Moving = "moving",
  Drawing = "drawing",
  Resizing = "resizing",
  None = "none",
}
