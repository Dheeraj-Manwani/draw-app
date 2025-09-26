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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-white">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
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
                    ? "border-foreground shadow-lg ring-2 ring-primary/20"
                    : "border-muted-foreground/30 hover:border-foreground/50"
                } ${
                  color === "transparent"
                    ? "bg-gradient-to-br from-muted to-muted/50 relative"
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
                    <div className="w-4 h-0.5 bg-muted-foreground/60 rotate-45"></div>
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
