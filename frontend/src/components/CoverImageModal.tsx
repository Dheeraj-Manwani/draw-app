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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Choose Cover Image
          </DialogTitle>
          <DialogDescription>
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
                      : "hover:bg-muted"
                  }
                `}
                onClick={() => handleSelectCover(index)}
              >
                <div className="w-full h-full">
                  {React.cloneElement(CoverImage, {
                    className: "w-full h-full",
                  })}
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
