import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  selectedColor: string;
  title: string;
  colors: Array<{ color: string; label: string }>;
}

// Checkerboard used to represent a transparent swatch, matching the one in the
// properties panel.
const transparentStyle = {
  backgroundImage:
    "linear-gradient(45deg,#bbb 25%,transparent 25%),linear-gradient(-45deg,#bbb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#bbb 75%),linear-gradient(-45deg,transparent 75%,#bbb 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
};

const isValidHex = (value: string) => /^#?[0-9a-fA-F]{6}$/.test(value.trim());
const normalizeHex = (value: string) => {
  const v = value.trim();
  return (v.startsWith("#") ? v : `#${v}`).toLowerCase();
};

export default function ColorPickerModal({
  isOpen,
  onClose,
  onColorSelect,
  selectedColor,
  title,
  colors,
}: ColorPickerModalProps) {
  // Local draft for the hex field so the user can type freely; we only commit
  // (and recolor) once the value is a valid 6-digit hex.
  const [hexDraft, setHexDraft] = useState(selectedColor);

  useEffect(() => {
    setHexDraft(selectedColor);
  }, [selectedColor, isOpen]);

  const commitHex = () => {
    if (isValidHex(hexDraft)) {
      onColorSelect(normalizeHex(hexDraft));
    } else {
      setHexDraft(selectedColor);
    }
  };

  const isTransparentSelected = selectedColor === "transparent";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl border border-gray-200 bg-white p-4 text-black shadow-[0_2px_14px_rgba(0,0,0,0.18)] dark:border-[#33333d] dark:bg-[#232329] dark:text-white">
        <DialogHeader className="mb-1 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-semibold text-black dark:text-white">
            {title}
          </DialogTitle>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-[#9a9aa6] dark:hover:bg-[#31303b]"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* Current color preview + hex entry */}
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-[#3a3a44] dark:bg-[#2b2b33]">
          <span
            className="h-8 w-8 shrink-0 rounded-lg border border-gray-300 dark:border-[#3a3a44]"
            style={
              isTransparentSelected
                ? transparentStyle
                : { backgroundColor: selectedColor }
            }
          />
          <div className="flex flex-1 items-center rounded-lg bg-white px-2 dark:bg-[#232329]">
            <span className="text-sm text-gray-400 dark:text-[#7a7a86]">#</span>
            <input
              type="text"
              value={hexDraft.replace(/^#/, "")}
              onChange={(e) => setHexDraft(e.target.value)}
              onBlur={commitHex}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitHex();
              }}
              placeholder="hex"
              spellCheck={false}
              className="w-full bg-transparent py-1.5 text-sm font-medium uppercase text-black outline-none placeholder:normal-case placeholder:text-gray-400 dark:text-white dark:placeholder:text-[#7a7a86]"
              data-testid="color-hex-input"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-0.5">
          <div className="grid grid-cols-9 gap-2 p-0.5">
            {colors.map(({ color, label }) => {
              const isTransparent = color === "transparent";
              const active = selectedColor === color;
              return (
                <button
                  key={color}
                  className={cn(
                    "h-7 w-7 rounded-md border transition-transform hover:scale-110",
                    active
                      ? "border-transparent ring-2 ring-[#6965db] ring-offset-1 ring-offset-white dark:ring-offset-[#232329]"
                      : "border-gray-300 dark:border-[#3a3a44]"
                  )}
                  style={
                    isTransparent
                      ? transparentStyle
                      : { backgroundColor: color }
                  }
                  onClick={() => {
                    onColorSelect(color);
                    onClose();
                  }}
                  title={label}
                  data-testid={`modal-color-${color}`}
                />
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
