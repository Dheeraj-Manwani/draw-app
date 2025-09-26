import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Image, Code } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "png" | "svg" | "json") => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
}: ExportModalProps) {
  const exportOptions = [
    {
      format: "png" as const,
      title: "PNG Image",
      description: "High-quality raster image",
      icon: Image,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      format: "svg" as const,
      title: "SVG Vector",
      description: "Scalable vector graphics",
      icon: Code,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
    },
    {
      format: "json" as const,
      title: "JSON Data",
      description: "Raw drawing data",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
    },
  ];

  const handleExport = (format: "png" | "svg" | "json") => {
    onExport(format);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white text-black dark:bg-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Export Drawing
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.format}
                variant="ghost"
                className={`w-full justify-start p-4 h-auto ${option.bgColor} transition-colors border`}
                onClick={() => handleExport(option.format)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${option.bgColor}`}>
                    <Icon className={`h-6 w-6 ${option.color}`} />
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold ${option.color}`}>
                      {option.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
