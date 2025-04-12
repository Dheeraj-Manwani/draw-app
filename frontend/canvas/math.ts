import { Coordinate, CursorPosition } from "@/types/elements";

export const distance = (a: Coordinate, b: Coordinate) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

export const nearPoint = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  name: CursorPosition
) => {
  // console.log("inside near point ", { x, y, x1, y1, name });
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
  // const dist = Math.hypot(x - x1, y - y1); // or Math.sqrt((x - x1) ** 2 + (y - y1) ** 2)
  // return dist < 5 ? name : null;
};

export const onLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
  y: number,
  maxDistance: number = 1
): CursorPosition => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y };
  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxDistance
    ? CursorPosition.Inside
    : CursorPosition.None;
};
