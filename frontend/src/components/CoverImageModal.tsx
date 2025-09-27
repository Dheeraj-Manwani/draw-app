import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { coverImages } from "@/utils/DrawingIcon";

interface CoverImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoverImage: (coverImageIndex: number) => void;
  currentCoverImage: number;
}

export default function CoverImageModal({
  isOpen,
  onClose,
  onSelectCoverImage,
  currentCoverImage,
}: CoverImageModalProps) {
  const handleSelectCover = (index: number) => {
    onSelectCoverImage(index);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 dark:text-white/80">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Choose Cover Image
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Select a cover image for your drawing from the options below.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-2">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {coverImages.map((CoverImage, index) => (
              <Button
                key={index}
                variant={currentCoverImage === index ? "default" : "outline"}
                className={`
                  aspect-square p-2 h-auto 
                  ${
                    currentCoverImage === index
                      ? "ring-2 ring-primary ring-offset-2 bg-primary/10"
                      : "hover:bg-muted dark:hover:bg-gray-700"
                  }
                `}
                onClick={() => handleSelectCover(index)}
              >
                <div className="w-50 h-50 custom_class">
                  {React.cloneElement(CoverImage, {
                    className: "w-84 h-84",
                  })}
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
