// Text-element font registry. Shared by the canvas renderer, the text editor
// overlay, and the properties panel so they always agree on the exact CSS
// font-family stack stored on `element.data.fontFamily`.
//
// "hand" is the self-hosted rough/sketchy font (see @font-face in index.css);
// the rest load from Google Fonts (see the <link> in index.html).

export type FontKey = "hand" | "normal" | "code" | "serif";

export const FONT_FAMILY: Record<FontKey, string> = {
  hand: '"HandDrawn", "Comic Sans MS", "Segoe Print", cursive',
  normal: '"Nunito", "Inter", system-ui, sans-serif',
  code: '"JetBrains Mono", "Cascadia Code", ui-monospace, monospace',
  serif: '"Lora", Georgia, "Times New Roman", serif',
};

// New text defaults to the hand-drawn font, matching the Excalidraw/CollabyDraw
// sketchy aesthetic this app is modelled on.
export const DEFAULT_FONT_FAMILY = FONT_FAMILY.hand;

export interface FontOption {
  key: FontKey;
  label: string;
  fontFamily: string;
}

export const TEXT_FONT_OPTIONS: FontOption[] = [
  { key: "hand", label: "Hand-drawn", fontFamily: FONT_FAMILY.hand },
  { key: "normal", label: "Normal", fontFamily: FONT_FAMILY.normal },
  { key: "code", label: "Code", fontFamily: FONT_FAMILY.code },
  { key: "serif", label: "Serif", fontFamily: FONT_FAMILY.serif },
];

// Quick font-size presets shown as S / M / L / XL buttons. Users can still
// fine-tune by resizing the text box on the canvas.
export interface FontSizeOption {
  label: string;
  value: number;
}

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { label: "S", value: 16 },
  { label: "M", value: 20 },
  { label: "L", value: 28 },
  { label: "XL", value: 36 },
];
