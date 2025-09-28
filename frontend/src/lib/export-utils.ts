import {
  type CanvasElement,
  type ExportOptions,
  type BackgroundType,
} from "@/types/canvas";
import { drawElement } from "./canvas-utils";
import {
  getThemeAwareStrokeColor,
  getThemeAwareFillColor,
} from "@/utils/themeUtils";

function drawBackgroundPattern(
  ctx: CanvasRenderingContext2D,
  backgroundType: BackgroundType,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number
) {
  const gridSize = 20;

  // Calculate pattern bounds to cover the entire canvas
  const startX = Math.floor(offsetX / gridSize) * gridSize;
  const startY = Math.floor(offsetY / gridSize) * gridSize;
  const endX = Math.ceil((offsetX + width) / gridSize) * gridSize;
  const endY = Math.ceil((offsetY + height) / gridSize) * gridSize;

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;

  switch (backgroundType) {
    case "grid":
      // Draw grid lines
      for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      break;
    case "dots":
      ctx.fillStyle = "#d1d5db";
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
}

export function exportToPNG(
  elements: CanvasElement[],
  backgroundType: BackgroundType = "none",
  backgroundColor: string = "#ffffff",
  options: ExportOptions = { format: "png" },
  theme: "light" | "dark" = "light"
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Calculate bounds
  const bounds = getElementsBounds(elements);
  const padding = 20;

  canvas.width = bounds.width + padding * 2;
  canvas.height = bounds.height + padding * 2;

  // Draw background - use theme-aware background
  const themeBackgroundColor = theme === "dark" ? "#000000" : backgroundColor;
  ctx.fillStyle = themeBackgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw background pattern if not 'none'
  if (backgroundType !== "none") {
    drawBackgroundPattern(
      ctx,
      backgroundType,
      canvas.width,
      canvas.height,
      -bounds.x + padding,
      -bounds.y + padding
    );
  }

  // Translate to account for bounds offset and padding
  ctx.translate(-bounds.x + padding, -bounds.y + padding);

  // Draw all elements with theme-aware colors
  elements.forEach((element) => {
    if (theme === "dark") {
      // Apply color inversion for dark mode
      const themeAwareElement = {
        ...element,
        strokeColor: getThemeAwareStrokeColor(element.strokeColor, theme),
        fillColor: getThemeAwareFillColor(element.fillColor, theme),
      };
      drawElement(ctx, themeAwareElement);
    } else {
      drawElement(ctx, element);
    }
  });

  return canvas.toDataURL("image/png", options.quality);
}

export function exportToSVG(
  elements: CanvasElement[],
  backgroundType: BackgroundType = "none",
  backgroundColor: string = "#ffffff"
): string {
  const bounds = getElementsBounds(elements);
  const padding = 20;

  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;

  // Add background pattern if not 'none'
  if (backgroundType !== "none") {
    svg += `<defs><pattern id="background" patternUnits="userSpaceOnUse" width="20" height="20">`;
    switch (backgroundType) {
      case "grid":
        svg += `<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
        break;
      case "dots":
        svg += `<circle cx="10" cy="10" r="1" fill="#d1d5db"/>`;
        break;
      case "squares":
        svg += `<rect x="0" y="0" width="20" height="20" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
        break;
      case "lines":
        svg += `<path d="M 0 0 L 20 0 M 0 20 L 20 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
        break;
      case "isometric":
        svg += `<path d="M 10 0 L 20 10 L 10 20 L 0 10 Z" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
        break;
    }
    svg += `</pattern></defs>`;
    svg += `<rect width="100%" height="100%" fill="url(#background)"/>`;
  }

  svg += `<g transform="translate(${-bounds.x + padding}, ${
    -bounds.y + padding
  })">`;

  elements.forEach((element) => {
    svg += elementToSVG(element);
  });

  svg += "</g></svg>";

  return svg;
}

export function exportToJSON(
  elements: CanvasElement[],
  backgroundType: BackgroundType = "none",
  backgroundColor: string = "#ffffff"
): string {
  return JSON.stringify(
    {
      version: "1.0",
      elements: elements,
      backgroundType: backgroundType,
      backgroundColor: backgroundColor,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

function getElementsBounds(elements: CanvasElement[]) {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((element) => {
    if (
      element.type === "freehand" ||
      element.type === "eraser" ||
      element.type === "laser"
    ) {
      // For freehand, eraser, and laser elements, calculate bounds from points
      const points = element.data?.points || [];
      if (points.length === 0) return;

      points.forEach((point: any) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    } else {
      // For other elements, use element bounds
      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, element.x + element.width);
      maxY = Math.max(maxY, element.y + element.height);
    }
  });

  // Ensure we have valid bounds
  if (minX === Infinity) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function elementToSVG(element: CanvasElement): string {
  const style = `stroke="${element.strokeColor}" fill="${element.fillColor}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}"`;
  const dashArray =
    element.strokeStyle === "dashed"
      ? 'stroke-dasharray="10,5"'
      : element.strokeStyle === "dotted"
      ? 'stroke-dasharray="2,3"'
      : "";

  switch (element.type) {
    case "rectangle":
      return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" ${style} ${dashArray}/>`;

    case "ellipse":
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      const rx = element.width / 2;
      const ry = element.height / 2;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${style} ${dashArray}/>`;

    case "line":
      const x2 = element.x + element.width;
      const y2 = element.y + element.height;
      return `<line x1="${element.x}" y1="${element.y}" x2="${x2}" y2="${y2}" ${style} ${dashArray}/>`;

    case "text":
      const fontSize = element.data?.fontSize || 16;
      const text = element.data?.text || "";
      const lines = text.split("\n");
      const lineHeight = fontSize * 1.2;

      return lines
        .map((line: string, index: number) => {
          const y = element.y + fontSize + index * lineHeight;
          return `<text x="${element.x}" y="${y}" font-size="${fontSize}" fill="${element.strokeColor}">${line}</text>`;
        })
        .join("\n");

    case "image":
      if (element.imageData) {
        return `<image x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" href="${element.imageData}"/>`;
      }
      return "";

    case "embed":
      if (element.embedUrl) {
        return `<foreignObject x="${element.x}" y="${element.y}" width="${
          element.width
        }" height="${element.height}">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <a href="${
              element.embedUrl
            }" target="_blank" rel="noopener noreferrer">
              <div style="width: 100%; height: 100%; background: #f3f4f6; border: 2px solid #d1d5db; display: flex; flex-direction: column; align-items: center; justify-content: center; text-decoration: none; color: #6b7280;">
                <div style="font-size: 24px; margin-bottom: 8px;">🔗</div>
                <div style="font-size: 12px; font-weight: bold;">${
                  element.embedType?.toUpperCase() || "EMBED"
                }</div>
                <div style="font-size: 10px; margin-top: 4px; text-align: center; word-break: break-all;">${
                  element.embedUrl
                }</div>
              </div>
            </a>
          </div>
        </foreignObject>`;
      }
      return "";

    default:
      return "";
  }
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
