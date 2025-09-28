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
    <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-10">
      <Button
        onClick={onClick}
        className="pointer-events-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-lg backdrop-blur-sm"
        size="lg"
      >
        <Focus className="h-4 w-4 mr-2" />
        Scroll to Content
      </Button>
    </div>
  );
}
