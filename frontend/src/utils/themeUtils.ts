import { Theme } from "@/contexts/ThemeContext";

// Color inversion mapping for dark mode
const colorInversionMap: Record<string, string> = {
  "#000000": "#ffffff", // Black -> White
  "#ffffff": "#1a1a1a", // White -> Dark gray
  "#1e293b": "#f1f5f9", // Slate-800 -> Slate-100
  "#334155": "#e2e8f0", // Slate-700 -> Slate-200
  "#475569": "#cbd5e1", // Slate-600 -> Slate-300
  "#64748b": "#94a3b8", // Slate-500 -> Slate-400
  "#94a3b8": "#64748b", // Slate-400 -> Slate-500
  "#cbd5e1": "#475569", // Slate-300 -> Slate-600
  "#e2e8f0": "#334155", // Slate-200 -> Slate-700
  "#f1f5f9": "#1e293b", // Slate-100 -> Slate-800
  "#f8fafc": "#0f172a", // Slate-50 -> Slate-900
  "#0f172a": "#f8fafc", // Slate-900 -> Slate-50
  "#dc2626": "#fca5a5", // Red-600 -> Red-300
  "#ef4444": "#f87171", // Red-500 -> Red-400
  "#f87171": "#ef4444", // Red-400 -> Red-500
  "#fca5a5": "#dc2626", // Red-300 -> Red-600
  "#059669": "#6ee7b7", // Emerald-600 -> Emerald-300
  "#10b981": "#34d399", // Emerald-500 -> Emerald-400
  "#34d399": "#10b981", // Emerald-400 -> Emerald-500
  "#6ee7b7": "#059669", // Emerald-300 -> Emerald-600
  "#2563eb": "#93c5fd", // Blue-600 -> Blue-300
  "#3b82f6": "#60a5fa", // Blue-500 -> Blue-400
  "#60a5fa": "#3b82f6", // Blue-400 -> Blue-500
  "#93c5fd": "#2563eb", // Blue-300 -> Blue-600
  "#7c3aed": "#c4b5fd", // Violet-600 -> Violet-300
  "#8b5cf6": "#a78bfa", // Violet-500 -> Violet-400
  "#a78bfa": "#8b5cf6", // Violet-400 -> Violet-500
  "#c4b5fd": "#7c3aed", // Violet-300 -> Violet-600
  "#ea580c": "#fdba74", // Orange-600 -> Orange-300
  "#f97316": "#fb923c", // Orange-500 -> Orange-400
  "#fb923c": "#f97316", // Orange-400 -> Orange-500
  "#fdba74": "#ea580c", // Orange-300 -> Orange-600
  "#ca8a04": "#fde047", // Yellow-600 -> Yellow-300
  "#eab308": "#facc15", // Yellow-500 -> Yellow-400
  "#facc15": "#eab308", // Yellow-400 -> Yellow-500
  "#fde047": "#ca8a04", // Yellow-300 -> Yellow-600
  "#0891b2": "#67e8f9", // Cyan-600 -> Cyan-300
  "#06b6d4": "#22d3ee", // Cyan-500 -> Cyan-400
  "#22d3ee": "#06b6d4", // Cyan-400 -> Cyan-500
  "#67e8f9": "#0891b2", // Cyan-300 -> Cyan-600
  "#be185d": "#f9a8d4", // Pink-600 -> Pink-300
  "#ec4899": "#f472b6", // Pink-500 -> Pink-400
  "#f472b6": "#ec4899", // Pink-400 -> Pink-500
  "#f9a8d4": "#be185d", // Pink-300 -> Pink-600
  "#1f2937": "#f9fafb", // Gray-800 -> Gray-50
  "#374151": "#f3f4f6", // Gray-700 -> Gray-100
  "#4b5563": "#e5e7eb", // Gray-600 -> Gray-200
  "#6b7280": "#d1d5db", // Gray-500 -> Gray-300
  "#9ca3af": "#9ca3af", // Gray-400 -> Gray-400 (neutral)
  "#d1d5db": "#6b7280", // Gray-300 -> Gray-500
  "#e5e7eb": "#4b5563", // Gray-200 -> Gray-600
  "#f3f4f6": "#374151", // Gray-100 -> Gray-700
  "#f9fafb": "#1f2937", // Gray-50 -> Gray-800
  "#111827": "#ffffff", // Gray-900 -> White
};

// Smart color inversion function
export const invertColorForTheme = (color: string, theme: Theme): string => {
  if (theme === "light") return color;

  // Normalize color to lowercase
  const normalizedColor = color.toLowerCase();

  // Check direct mapping first
  if (colorInversionMap[normalizedColor]) {
    return colorInversionMap[normalizedColor];
  }

  // Handle hex colors
  if (normalizedColor.startsWith("#")) {
    const hex = normalizedColor.slice(1);
    if (hex.length === 3) {
      // Convert 3-digit hex to 6-digit
      const r = hex[0] + hex[0];
      const g = hex[1] + hex[1];
      const b = hex[2] + hex[2];
      return invertHexColor(r + g + b);
    } else if (hex.length === 6) {
      return invertHexColor(hex);
    }
  }

  // Handle rgb/rgba colors
  if (normalizedColor.startsWith("rgb")) {
    return invertRgbColor(normalizedColor);
  }

  // Return original color if no inversion found
  return color;
};

// Invert hex color
const invertHexColor = (hex: string): string => {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate inverted RGB values
  const invertedR = 255 - r;
  const invertedG = 255 - g;
  const invertedB = 255 - b;

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(invertedR)}${toHex(invertedG)}${toHex(invertedB)}`;
};

// Invert RGB color
const invertRgbColor = (rgb: string): string => {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgb;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;

  const invertedR = 255 - r;
  const invertedG = 255 - g;
  const invertedB = 255 - b;

  return `rgba(${invertedR}, ${invertedG}, ${invertedB}, ${a})`;
};

// Get theme-aware background color
export const getThemeBackgroundColor = (theme: Theme): string => {
  return theme === "dark" ? "#000000" : "#ffffff";
};

// Get theme-aware text color
export const getThemeTextColor = (theme: Theme): string => {
  return theme === "dark" ? "#ffffff" : "#000000";
};

// Get theme-aware border color
export const getThemeBorderColor = (theme: Theme): string => {
  return theme === "dark" ? "#374151" : "#e5e7eb";
};

// Get theme-aware muted text color
export const getThemeMutedTextColor = (theme: Theme): string => {
  return theme === "dark" ? "#9ca3af" : "#6b7280";
};

// Get theme-aware card background color
export const getThemeCardBackgroundColor = (theme: Theme): string => {
  return theme === "dark" ? "#1f2937" : "#ffffff";
};

// Get theme-aware input background color
export const getThemeInputBackgroundColor = (theme: Theme): string => {
  return theme === "dark" ? "#374151" : "#ffffff";
};

// Check if a color is dark
export const isDarkColor = (color: string): boolean => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

// Get appropriate stroke color for dark mode
export const getThemeAwareStrokeColor = (
  color: string,
  theme: Theme
): string => {
  // if (theme === "light") return color;

  // For dark mode, ensure good contrast against black background
  if (theme === "dark" && (color === "#000000" || color === "black")) {
    return "#ffffff";
  }

  if (theme === "light" && (color === "#ffffff" || color === "white")) {
    return "#000000";
  }

  // For very dark colors, make them lighter
  // if (isDarkColor(color)) {
  //   return invertColorForTheme(color, theme);
  // }

  return color;
};

// Get appropriate fill color for dark mode
export const getThemeAwareFillColor = (color: string, theme: Theme): string => {
  if (theme === "light") return color;

  // For dark mode, handle transparent and white fills specially
  if (color === "transparent" || color === "rgba(0,0,0,0)") {
    return "transparent";
  }

  if (color === "#ffffff" || color === "white") {
    return "#1a1a1a"; // Dark gray instead of black
  }

  if (color === "#000000" || color === "black") {
    return "#ffffff";
  }

  // For other colors, apply smart inversion
  // return invertColorForTheme(color, theme);

  return color;
};

// Get theme-aware initial stroke color for new elements
export const getInitialStrokeColor = (theme: Theme): string => {
  return theme === "dark" ? "#ffffff" : "#000000";
};
