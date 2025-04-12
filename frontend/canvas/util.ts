import {
  Action,
  Coordinate,
  CursorPosition,
  Element,
  ElementType,
  LinePath,
  Path,
  RectanglePath,
} from "./../types/elements";
import { nearPoint, onLine } from "./math";

export const positionWithinElement = (
  x: number,
  y: number,
  element: Element
): CursorPosition => {
  const { type, path } = element;

  switch (type) {
    case ElementType.LINE:
      const { startX, startY, endX, endY } = path as LinePath;
      const on = onLine(startX, startY, endX, endY, x, y);
      const start = nearPoint(x, y, startX, startY, CursorPosition.Start);
      const end = nearPoint(x, y, endX, endY, CursorPosition.End);
      return start || end || on;
    case ElementType.RECTANGLE:
      const { startX: x1, startY: y1, height, width } = path as RectanglePath;
      const x2 = x1 + width;
      const y2 = y1 + height;
      const topLeft = nearPoint(x, y, x1, y1, CursorPosition.TopLeft);
      const topRight = nearPoint(x, y, x2, y1, CursorPosition.TopRight);
      const bottomLeft = nearPoint(x, y, x1, y2, CursorPosition.BottomLeft);
      const bottomRight = nearPoint(x, y, x2, y2, CursorPosition.BottomRight);
      const inside =
        x >= x1 && x <= x2 && y >= y1 && y <= y2
          ? CursorPosition.Inside
          : CursorPosition.None;

      if (inside === "inside")
        console.log(
          "topLeft || topRight || bottomLeft || bottomRight || inside ========== ",
          { topLeft, topRight, bottomLeft, bottomRight, inside }
        );
      return topLeft || topRight || bottomLeft || bottomRight || inside;

    default:
      return CursorPosition.None;
  }
};

export const getElementAtPosition = (
  x: number,
  y: number,
  elements: Element[]
) => {
  return elements
    .map((element) => ({
      ...element,
      position: positionWithinElement(x, y, element),
    }))
    .find(
      (element) => element.position && element.position !== CursorPosition.None
    );
};

export const cursorForPosition = (position: CursorPosition) => {
  switch (position) {
    case CursorPosition.TopLeft:
    case CursorPosition.BottomRight:
    case CursorPosition.Start:
    case CursorPosition.End:
      return "nwse-resize";
    case CursorPosition.TopRight:
    case CursorPosition.BottomLeft:
      return "nesw-resize";
    case CursorPosition.Inside:
      return "move";
    case CursorPosition.None:
    default:
      return "default";
  }
};

export const getResizedPath = (
  path: Path,
  position: CursorPosition,
  currX: number,
  currY: number
) => {
  switch (position) {
    case CursorPosition.BottomLeft:
      const rectPath = path as RectanglePath;
      return {
        startX: currX,
        startY: rectPath.startY,
        width: Math.abs(rectPath.width - (currX - rectPath.startX)),
        height: Math.abs(rectPath.startY - currY),
      };
    case CursorPosition.BottomRight:
    case CursorPosition.TopLeft:
    case CursorPosition.TopRight:
    case CursorPosition.Start:
    case CursorPosition.End:
    case CursorPosition.Inside:
    case CursorPosition.Circumference:
    case CursorPosition.None:
    default:
  }
};
