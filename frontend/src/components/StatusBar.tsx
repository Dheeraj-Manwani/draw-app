import { type CanvasElement } from "@/types/canvas";
// import { type CollaborativeUser } from '@shared/schema';

interface StatusBarProps {
  elements: CanvasElement[];
  cursorPosition: { x: number; y: number };
  isConnected: boolean;
  lastSaved: Date | null;
  collaborativeUsers: [];
}

export default function StatusBar({
  elements,
  cursorPosition,
  isConnected,
  lastSaved,
  collaborativeUsers,
}: StatusBarProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 5) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  return (
    <footer className="bg-card border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <div data-testid="text-element-count">
          Elements: <span className="font-medium">{elements.length}</span>
        </div>
        <div data-testid="text-cursor-position">
          Position:{" "}
          <span className="font-medium">
            x: {Math.round(cursorPosition.x)}, y: {Math.round(cursorPosition.y)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span data-testid="text-connection-status">
            {isConnected ? "Connected" : "Disconnected"}
            {lastSaved && ` • Auto-saved ${formatTime(lastSaved)}`}
          </span>
        </div>
        {collaborativeUsers.length > 0 && (
          <div data-testid="text-collaborative-users">
            {/* {collaborativeUsers.length} other user{collaborativeUsers.length !== 1 ? 's' : ''} online */}
          </div>
        )}
      </div>
    </footer>
  );
}
