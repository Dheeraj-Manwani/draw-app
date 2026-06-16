import { type CanvasElement } from "@/types/canvas";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Compute the axis-aligned bounds of a single element, accounting for
// point-based elements (freehand / eraser) whose geometry lives in `data.points`.
function getElementBounds(element: CanvasElement): Bounds | null {
  if (element.type === "freehand" || element.type === "eraser") {
    const points = element.data?.points || [];
    if (points.length === 0) return null;

    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    points.forEach((point: { x: number; y: number }) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    return { minX, minY, maxX, maxY };
  }

  // width/height may be negative (e.g. lines/arrows drawn right-to-left or
  // bottom-to-top), so normalize to a proper min/max box.
  return {
    minX: Math.min(element.x, element.x + element.width),
    minY: Math.min(element.y, element.y + element.height),
    maxX: Math.max(element.x, element.x + element.width),
    maxY: Math.max(element.y, element.y + element.height),
  };
}

// Combined bounding box of every element, or null when the canvas is empty.
export function getElementsBounds(elements: CanvasElement[]): Bounds | null {
  let result: Bounds | null = null;

  elements.forEach((element) => {
    const bounds = getElementBounds(element);
    if (!bounds) return;

    if (!result) {
      result = { ...bounds };
      return;
    }

    result.minX = Math.min(result.minX, bounds.minX);
    result.minY = Math.min(result.minY, bounds.minY);
    result.maxX = Math.max(result.maxX, bounds.maxX);
    result.maxY = Math.max(result.maxY, bounds.maxY);
  });

  return result;
}

// Find the center of the densest cluster of elements, used by "scroll back to
// content". Returns null when there is nothing on the canvas.
export function getContentCenter(
  elements: CanvasElement[],
  gridSize = 200
): { x: number; y: number } | null {
  if (elements.length === 0) return null;

  const densityMap = new Map<string, number>();

  elements.forEach((element) => {
    const bounds = getElementBounds(element);
    if (!bounds) return;

    const startGridX = Math.floor(bounds.minX / gridSize);
    const endGridX = Math.floor(bounds.maxX / gridSize);
    const startGridY = Math.floor(bounds.minY / gridSize);
    const endGridY = Math.floor(bounds.maxY / gridSize);

    for (let gx = startGridX; gx <= endGridX; gx++) {
      for (let gy = startGridY; gy <= endGridY; gy++) {
        const key = `${gx},${gy}`;
        densityMap.set(key, (densityMap.get(key) || 0) + 1);
      }
    }
  });

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

  return {
    x: (bestGridX + 0.5) * gridSize,
    y: (bestGridY + 0.5) * gridSize,
  };
}
