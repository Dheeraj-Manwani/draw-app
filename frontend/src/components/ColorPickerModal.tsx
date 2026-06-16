import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ColorPickerModal({
  isOpen,
  onClose,
  onColorSelect,
  selectedColor,
  title,
  colors,
}: ColorPickerModalProps) {
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
