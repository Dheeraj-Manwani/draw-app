import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  selectedColor: string;
  title: string;
  colors: Array<{ color: string; label: string }>;
}

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-white text-black dark:bg-gray-900 dark:text-white">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-black dark:text-white">
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-8 gap-3 p-1">
            {colors.map(({ color, label }) => (
              <button
                key={color}
                className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                  selectedColor === color
                    ? "border-black dark:border-white shadow-lg ring-2 ring-primary/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                } ${
                  color === "transparent"
                    ? "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 relative"
                    : ""
                }`}
                style={{
                  backgroundColor: color === "transparent" ? undefined : color,
                }}
                onClick={() => {
                  onColorSelect(color);
                  onClose();
                }}
                title={label}
                data-testid={`modal-color-${color}`}
              >
                {color === "transparent" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-0.5 bg-gray-500 dark:bg-gray-400 rotate-45"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
