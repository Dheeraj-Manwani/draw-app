import { Button } from "@/components/ui/button";
import { Focus } from "lucide-react";

interface ScrollToContentButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export default function ScrollToContentButton({
  isVisible,
  onClick,
}: ScrollToContentButtonProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <Button
        onClick={onClick}
        className="pointer-events-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-primary/90 hover:bg-primary text-primary-foreground px-6 py-3 rounded-full"
        size="lg"
      >
        <Focus />
        Scroll to Content
      </Button>
    </div>
  );
}
