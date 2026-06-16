import { type CanvasElement, type Point } from "@/types/canvas";
import { DEFAULT_FONT_FAMILY } from "@/lib/fonts";
import rough from "roughjs";
import type { RoughCanvas } from "roughjs/bin/canvas";
import type { Options as RoughOptions } from "roughjs/bin/core";

// Effective hand-drawn roughness. Undefined defaults to 1 (sloppy) so existing
// drawings and new shapes look hand-drawn unless explicitly set to 0 (precise).
export function effectiveRoughness(element: CanvasElement): number {
  return element.roughness ?? 1;
}

// rough.js randomizes its sketch on every call. The draw loop rebuilds a fresh
// copy of every element each frame, so we derive a stable integer seed from the
// element id — otherwise each shape would jitter on every repaint.
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

// One RoughCanvas per <canvas>. rough.canvas() reuses the canvas's own 2d
// context, so rough draws onto the same ctx (inheriting our transform/opacity).
const roughCanvasCache = new WeakMap<HTMLCanvasElement, RoughCanvas>();
function getRoughCanvas(ctx: CanvasRenderingContext2D): RoughCanvas {
  let rc = roughCanvasCache.get(ctx.canvas);
  if (!rc) {
    rc = rough.canvas(ctx.canvas);
    roughCanvasCache.set(ctx.canvas, rc);
  }
  return rc;
}

// Translate an element's existing styling fields into rough.js options. Set
// `fill: false` for open shapes (lines/arrows) that should never be filled.
export function roughOptionsFor(
  element: CanvasElement,
  opts: { fill?: boolean } = {}
): RoughOptions {
  const sw = element.strokeWidth || 1;
  const options: RoughOptions = {
    seed: seedFromId(element.id),
    roughness: effectiveRoughness(element),
    stroke: element.strokeColor,
    strokeWidth: sw,
  };

  // Mirror the crisp dash patterns (scaled to stroke width) used in drawElement.
  if (element.strokeStyle === "dashed") options.strokeLineDash = [sw * 4, sw * 2];
  else if (element.strokeStyle === "dotted") options.strokeLineDash = [sw, sw * 2];

  const wantFill =
    (opts.fill ?? true) &&
    element.fillColor &&
    element.fillColor !== "transparent";
  if (wantFill) {
    options.fill = element.fillColor;
    // rough accepts our fillStyle values verbatim ("solid" | "hachure" |
    // "cross-hatch"); fall back to solid.
    options.fillStyle = element.fillStyle ?? "solid";
  }

  return options;
}

// SVG path for a rounded rectangle — rough has no native rounded-rect, so we
// sketch this path instead when round edges are requested.
export function roundedRectPathD(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  const rr = Math.min(r, w / 2, h / 2);
  return (
    `M${x + rr},${y} h${w - 2 * rr} a${rr},${rr} 0 0 1 ${rr},${rr} ` +
    `v${h - 2 * rr} a${rr},${rr} 0 0 1 ${-rr},${rr} h${-(w - 2 * rr)} ` +
    `a${rr},${rr} 0 0 1 ${-rr},${-rr} v${-(h - 2 * rr)} ` +
    `a${rr},${rr} 0 0 1 ${rr},${-rr} z`
  );
}

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

// Normalize an element's box so width/height are positive. While a shape is
// being drawn the raw width/height can be negative (dragging up/left), which
// breaks roundRect and the hachure math below.
function normalizedBox(element: CanvasElement) {
  return {
    x: Math.min(element.x, element.x + element.width),
    y: Math.min(element.y, element.y + element.height),
    w: Math.abs(element.width),
    h: Math.abs(element.height),
  };
}

// Paint diagonal hachure (and, for cross-hatch, anti-diagonal) lines across the
// given box. Callers clip to the shape first so the lines only show inside it.
function drawHachureLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cross: boolean
) {
  const gap = 8;
  ctx.beginPath();
  // "/"-direction lines (bottom-left to top-right): as x grows, y shrinks.
  for (let d = -h; d < w; d += gap) {
    ctx.moveTo(x + d, y + h);
    ctx.lineTo(x + d + h, y);
  }
  if (cross) {
    // "\"-direction lines (top-left to bottom-right): as x grows, y grows.
    for (let d = -h; d < w; d += gap) {
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d + h, y + h);
    }
  }
  ctx.stroke();
}

// Fill a shape according to its fill style, then stroke its outline. `buildPath`
// must (re)create the path on the context each time it is called — it is invoked
// separately for the clip/fill pass and the final stroke.
function fillAndStrokeShape(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  box: { x: number; y: number; w: number; h: number },
  buildPath: () => void
) {
  if (element.fillColor !== "transparent") {
    const style = element.fillStyle ?? "solid";
    if (style === "solid") {
      buildPath();
      ctx.fillStyle = element.fillColor;
      ctx.fill();
    } else {
      // Clip to the shape and stroke a line pattern in the fill color.
      ctx.save();
      buildPath();
      ctx.clip();
      ctx.strokeStyle = element.fillColor;
      ctx.lineWidth = 1;
      ctx.lineCap = "butt";
      ctx.setLineDash([]);
      drawHachureLines(ctx, box.x, box.y, box.w, box.h, style === "cross-hatch");
      ctx.restore();
    }
  }
  // Outline (uses the stroke color/width/dash configured in drawElement).
  buildPath();
  ctx.stroke();
}

// Build a (optionally rounded) rectangle path on the context.
function rectPath(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  round: boolean
) {
  const radius = round ? Math.min(Math.min(box.w, box.h) * 0.18, 32) : 0;
  ctx.beginPath();
  if (radius > 0 && typeof ctx.roundRect === "function") {
    ctx.roundRect(box.x, box.y, box.w, box.h, radius);
  } else {
    ctx.rect(box.x, box.y, box.w, box.h);
  }
}

// Build a rounded polygon path through `pts` using arcTo at each vertex.
function roundedPolyPath(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  radius: number
) {
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];
  ctx.beginPath();
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const end = mid(curr, next);
    ctx.arcTo(curr[0], curr[1], end[0], end[1], radius);
  }
  ctx.closePath();
}

function drawRectangle(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const box = normalizedBox(element);
  const round = element.edges === "round";

  if (effectiveRoughness(element) > 0) {
    const rc = getRoughCanvas(ctx);
    const options = roughOptionsFor(element);
    if (round) {
      const radius = Math.min(Math.min(box.w, box.h) * 0.18, 32);
      rc.path(roundedRectPathD(box.x, box.y, box.w, box.h, radius), options);
    } else {
      rc.rectangle(box.x, box.y, box.w, box.h, options);
    }
    return;
  }

  fillAndStrokeShape(ctx, element, box, () => rectPath(ctx, box, round));
}

function drawEllipse(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const box = normalizedBox(element);
  const centerX = box.x + box.w / 2;
  const centerY = box.y + box.h / 2;

  if (effectiveRoughness(element) > 0) {
    const rc = getRoughCanvas(ctx);
    rc.ellipse(centerX, centerY, box.w, box.h, roughOptionsFor(element));
    return;
  }

  fillAndStrokeShape(ctx, element, box, () => {
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, box.w / 2, box.h / 2, 0, 0, 2 * Math.PI);
  });
}

function drawLine(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const endX = element.x + element.width;
  const endY = element.y + element.height;

  if (effectiveRoughness(element) > 0) {
    const rc = getRoughCanvas(ctx);
    rc.line(element.x, element.y, endX, endY, roughOptionsFor(element, { fill: false }));
    return;
  }

  ctx.beginPath();
  ctx.moveTo(element.x, element.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const startX = element.x;
  const startY = element.y;
  const endX = element.x + element.width;
  const endY = element.y + element.height;

  // Arrowhead geometry — scale with stroke width so thick arrows get
  // proportional heads instead of a tiny fixed one.
  const headlen = Math.max(12, (element.strokeWidth || 2) * 5);
  const angle = Math.atan2(endY - startY, endX - startX);
  const head1X = endX - headlen * Math.cos(angle - Math.PI / 6);
  const head1Y = endY - headlen * Math.sin(angle - Math.PI / 6);
  const head2X = endX - headlen * Math.cos(angle + Math.PI / 6);
  const head2Y = endY - headlen * Math.sin(angle + Math.PI / 6);

  if (effectiveRoughness(element) > 0) {
    const rc = getRoughCanvas(ctx);
    const options = roughOptionsFor(element, { fill: false });
    rc.line(startX, startY, endX, endY, options);
    rc.line(endX, endY, head1X, head1Y, options);
    rc.line(endX, endY, head2X, head2Y, options);
    return;
  }

  // Draw line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(head1X, head1Y);
  ctx.moveTo(endX, endY);
  ctx.lineTo(head2X, head2Y);
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
  const box = normalizedBox(element);
  const centerX = box.x + box.w / 2;
  const centerY = box.y + box.h / 2;
  const pts: Array<[number, number]> = [
    [centerX, box.y], // top
    [box.x + box.w, centerY], // right
    [centerX, box.y + box.h], // bottom
    [box.x, centerY], // left
  ];
  const radius =
    element.edges === "round" ? Math.min(Math.min(box.w, box.h) * 0.12, 24) : 0;

  if (effectiveRoughness(element) > 0) {
    const rc = getRoughCanvas(ctx);
    rc.polygon(
      pts.map(([px, py]) => [px, py] as [number, number]),
      roughOptionsFor(element)
    );
    return;
  }

  fillAndStrokeShape(ctx, element, box, () => {
    if (radius > 0) {
      roundedPolyPath(ctx, pts, radius);
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
    }
  });
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
