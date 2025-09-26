import { type CanvasElement, type Point } from "@/types/canvas";

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

  // Set line dash pattern
  switch (element.strokeStyle) {
    case "dashed":
      ctx.setLineDash([10, 5]);
      break;
    case "dotted":
      ctx.setLineDash([2, 3]);
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
    case "eraser":
      drawEraser(ctx, element);
      break;
    case "image":
      drawImage(ctx, element);
      break;
    case "embed":
      drawEmbed(ctx, element);
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

  // Draw arrowhead
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

function drawText(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const fontSize = element.data?.fontSize || 16;
  const fontFamily = element.data?.fontFamily || "Inter, sans-serif";

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = element.strokeColor;
  ctx.textBaseline = "top";

  const text = element.data?.text || "";

  // Calculate text width for auto-expanding
  const textWidth = ctx.measureText(text).width;

  // Update element width if text is wider
  if (textWidth > element.width) {
    element.width = textWidth + 10; // Add some padding
  }

  ctx.fillText(text, element.x, element.y);
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

function drawEraser(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  // Eraser doesn't draw anything visible, it just erases
  // The erasing logic is handled in the canvas component
  if (!element.data?.points || element.data.points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = element.strokeWidth || 20;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  const points = element.data.points as Point[];
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
  ctx.restore();
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

function drawImage(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  if (!element.imageData) return;

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, element.x, element.y, element.width, element.height);
  };
  img.src = element.imageData;
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
