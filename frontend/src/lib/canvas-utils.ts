import { type CanvasElement, type Point } from "@/types/canvas";
import { DEFAULT_FONT_FAMILY } from "@/lib/fonts";

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement
) {
  ctx.save();

  // Apply transformations
  ctx.globalAlpha = element.opacity;
  ctx.strokeStyle = element.strokeColor;
  ctx.fillStyle = element.fillColor;
  ctx.lineWidth = element.strokeWidth;

  // Set line dash pattern, scaled to the stroke width so dashes/dots stay
  // visually proportional instead of being fixed (and overly tight when thin).
  const sw = element.strokeWidth || 1;
  switch (element.strokeStyle) {
    case "dashed":
      ctx.setLineDash([sw * 4, sw * 2]);
      break;
    case "dotted":
      ctx.setLineDash([sw, sw * 2]);
      ctx.lineCap = "round"; // render dots as round rather than square
      break;
    default:
      ctx.setLineDash([]);
  }

  // Translate and rotate if needed
  if (element.angle !== 0) {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(element.angle);
    ctx.translate(-centerX, -centerY);
  }

  switch (element.type) {
    case "rectangle":
      drawRectangle(ctx, element);
      break;
    case "ellipse":
      drawEllipse(ctx, element);
      break;
    case "line":
      drawLine(ctx, element);
      break;
    case "arrow":
      drawArrow(ctx, element);
      break;
    case "freehand":
      drawFreehand(ctx, element);
      break;
    case "text":
      drawText(ctx, element);
      break;
    case "diamond":
      drawDiamond(ctx, element);
      break;
    case "image":
      drawImage(ctx, element);
      break;
    case "embed":
      drawEmbed(ctx, element);
      break;
    case "laser":
      drawLaser(ctx, element);
      break;
  }

  ctx.restore();
}

function drawRectangle(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  if (element.fillColor !== "transparent") {
    ctx.fillRect(element.x, element.y, element.width, element.height);
  }
  ctx.strokeRect(element.x, element.y, element.width, element.height);
}

function drawEllipse(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const radiusX = element.width / 2;
  const radiusY = element.height / 2;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

  if (element.fillColor !== "transparent") {
    ctx.fill();
  }
  ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  ctx.beginPath();
  ctx.moveTo(element.x, element.y);
  ctx.lineTo(element.x + element.width, element.y + element.height);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const startX = element.x;
  const startY = element.y;
  const endX = element.x + element.width;
  const endY = element.y + element.height;

  // Draw line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw arrowhead — scale with stroke width so thick arrows get proportional
  // heads instead of a tiny fixed one.
  const headlen = Math.max(12, (element.strokeWidth || 2) * 5);
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

function drawFreehand(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  if (!element.data?.points || element.data.points.length < 2) return;

  ctx.beginPath();
  const points = element.data.points as Point[];
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

// Resolve the effective font settings for a text element. Font size/weight are
// stored as top-level element fields (what the Properties panel edits), with a
// fallback to the legacy data.fontSize for older drawings.
export function getTextFont(element: CanvasElement): {
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  fontFamily: string;
} {
  return {
    fontSize: element.fontSize ?? element.data?.fontSize ?? 16,
    fontWeight: element.fontWeight ?? "normal",
    fontStyle: element.fontStyle ?? "normal",
    textDecoration: element.textDecoration ?? "none",
    fontFamily: element.data?.fontFamily ?? DEFAULT_FONT_FAMILY,
  };
}

// Measure the box a piece of text occupies. Shared by drawing, hit-box sizing,
// and the Properties panel so they never disagree.
let measureCtx: CanvasRenderingContext2D | null = null;
export function measureTextSize(
  text: string,
  fontSize: number,
  fontWeight: "normal" | "bold" = "normal",
  fontFamily = DEFAULT_FONT_FAMILY,
  fontStyle: "normal" | "italic" = "normal"
): { width: number; height: number } {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  const lines = (text || "").split("\n");
  const lineHeight = fontSize * 1.2;
  let maxWidth = 0;
  if (measureCtx) {
    measureCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    lines.forEach((line) => {
      maxWidth = Math.max(maxWidth, measureCtx!.measureText(line).width);
    });
  }
  const padding = 10;
  return {
    width: Math.max(maxWidth + padding, 20),
    height: Math.max(lines.length * lineHeight + padding, fontSize + padding),
  };
}

function drawText(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const { fontSize, fontWeight, fontStyle, textDecoration, fontFamily } =
    getTextFont(element);

  // Canvas font shorthand order is `style weight size family`.
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = element.strokeColor;
  ctx.textBaseline = "top";

  const text = element.data?.text || "";
  const lines = text.split("\n");
  const lineHeight = fontSize * 1.2; // Add some line spacing

  // measureTextSize adds `padding` to the box; mirror it here as a half-padding
  // inset on the top/left so the glyphs sit consistently inside their box
  // rather than flush against the top-left corner.
  const padding = 10;

  // Draw each line. Dimensions are owned by the element (set on submit/edit and
  // when font properties change) — we no longer mutate the element here.
  lines.forEach((line: string, index: number) => {
    const x = element.x + padding / 2;
    const y = element.y + padding / 2 + index * lineHeight;
    ctx.fillText(line, x, y);

    // Canvas has no native underline — draw a rule just below the baseline,
    // matched to the text color and width of the line.
    if (textDecoration === "underline" && line.length > 0) {
      const lineWidth = ctx.measureText(line).width;
      const underlineY = y + fontSize * 1.05;
      ctx.save();
      ctx.strokeStyle = element.strokeColor;
      ctx.lineWidth = Math.max(1, fontSize / 16);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, underlineY);
      ctx.lineTo(x + lineWidth, underlineY);
      ctx.stroke();
      ctx.restore();
    }
  });
}

function drawDiamond(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, element.y);
  ctx.lineTo(element.x + element.width, centerY);
  ctx.lineTo(centerX, element.y + element.height);
  ctx.lineTo(element.x, centerY);
  ctx.closePath();

  if (element.fillColor !== "transparent") {
    ctx.fill();
  }
  ctx.stroke();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  panX: number,
  panY: number
) {
  const gridSize = 20 * zoom;
  const offsetX = panX % gridSize;
  const offsetY = panY % gridSize;

  ctx.save();
  ctx.strokeStyle = "hsl(215, 16%, 47%)";
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;

  ctx.beginPath();

  // Vertical lines
  for (let x = offsetX; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  // Horizontal lines
  for (let y = offsetY; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }

  ctx.stroke();
  ctx.restore();
}

export function screenToCanvas(
  point: Point,
  zoom: number,
  panX: number,
  panY: number
): Point {
  return {
    x: (point.x - panX) / zoom,
    y: (point.y - panY) / zoom,
  };
}

export function canvasToScreen(
  point: Point,
  zoom: number,
  panX: number,
  panY: number
): Point {
  return {
    x: point.x * zoom + panX,
    y: point.y * zoom + panY,
  };
}

export function getElementBounds(element: CanvasElement) {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    right: element.x + element.width,
    bottom: element.y + element.height,
  };
}

// Decoded images live in a module-level cache keyed by element id, NOT on the
// element object. draw() builds a fresh shallow copy of every element each
// frame, so caching on the element would be lost every frame — creating a new
// Image() and firing onImageLoad on every render (an infinite redraw loop).
const imageElementCache = new Map<string, HTMLImageElement>();

function drawImage(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  if (!element.imageData) return;

  const cached = imageElementCache.get(element.id);

  // Not loaded yet: kick off a one-time load and draw a placeholder.
  if (!cached) {
    const img = new Image();
    imageElementCache.set(element.id, img);
    img.onload = () => {
      // Fires exactly once per element — trigger a single redraw.
      element.onImageLoad?.();
    };
    img.onerror = (error) => {
      console.error("Error loading image for element:", element.id, error);
    };
    img.src = element.imageData;

    // Draw a placeholder while image loads
    ctx.save();
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(element.x, element.y, element.width, element.height);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.strokeRect(element.x, element.y, element.width, element.height);

    // Draw loading text
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Loading...",
      element.x + element.width / 2,
      element.y + element.height / 2
    );
    ctx.restore();
    return;
  }

  // Still decoding (cache entry exists but not complete) — keep the placeholder.
  if (!cached.complete || cached.naturalWidth === 0) {
    ctx.save();
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(element.x, element.y, element.width, element.height);
    ctx.restore();
    return;
  }

  // Draw the cached image
  try {
    ctx.drawImage(
      cached,
      element.x,
      element.y,
      element.width,
      element.height
    );
  } catch (error) {
    console.error("Error drawing image:", error);
    // Draw error placeholder
    ctx.save();
    ctx.fillStyle = "#fef2f2";
    ctx.fillRect(element.x, element.y, element.width, element.height);
    ctx.strokeStyle = "#fca5a5";
    ctx.lineWidth = 2;
    ctx.strokeRect(element.x, element.y, element.width, element.height);

    ctx.fillStyle = "#dc2626";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Error",
      element.x + element.width / 2,
      element.y + element.height / 2
    );
    ctx.restore();
  }
}

function drawEmbed(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  // Draw a placeholder for embed elements since we can't render them on canvas
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(element.x, element.y, element.width, element.height);

  // Draw border
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 2;
  ctx.strokeRect(element.x, element.y, element.width, element.height);

  // Draw embed icon
  ctx.fillStyle = "#6b7280";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "🔗",
    element.x + element.width / 2,
    element.y + element.height / 2 - 10
  );

  // Draw platform name
  ctx.font = "12px Arial";
  ctx.fillText(
    element.embedType?.toUpperCase() || "EMBED",
    element.x + element.width / 2,
    element.y + element.height / 2 + 10
  );
}

function drawLaser(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const points = element.data?.points || [];
  if (points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = element.strokeColor;
  // fillStyle must be set explicitly: the single-point dot below is filled, and
  // without this it inherited whatever fill was active (often transparent), so
  // a laser tap rendered nothing.
  ctx.fillStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = element.opacity;

  // Add laser glow effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = element.strokeColor;

  if (points.length === 1) {
    // Draw single point as a circle
    const point = points[0];
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(element.strokeWidth / 2, 2), 0, Math.PI * 2);
    ctx.fill();
  } else if (points.length > 1) {
    // Draw smooth curve through points
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      // Simple line for two points
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      // Smooth curve for multiple points using quadratic curves
      for (let i = 1; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];
        const controlX = (currentPoint.x + nextPoint.x) / 2;
        const controlY = (currentPoint.y + nextPoint.y) / 2;
        ctx.quadraticCurveTo(
          currentPoint.x,
          currentPoint.y,
          controlX,
          controlY
        );
      }

      // Draw to the last point
      const lastPoint = points[points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.stroke();
  }

  ctx.restore();
}

export function isPointInBounds(
  point: Point,
  bounds: { x: number; y: number; width: number; height: number }
) {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}
