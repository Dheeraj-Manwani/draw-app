import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface OnboardingOverlayProps {
  isVisible: boolean;
  currentTool: string;
}

// The self-hosted rough/hand-drawn font, matching the sketchy arrows.
const handFont = {
  fontFamily: '"HandDrawn", "Comic Sans MS", "Segoe Print", cursive',
};

// Muted so the welcome content reads as a watermark, never competing with the
// canvas content once the user starts drawing.
const HINT_COLOR = "text-gray-400 dark:text-gray-500";

export default function OnboardingOverlay({
  isVisible,
  currentTool,
}: OnboardingOverlayProps) {
  const isMobile = useIsMobile();
  // Only on the empty canvas, and not while a drawing tool is active.
  if (!isVisible || (currentTool !== "select" && currentTool !== "hand"))
    return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* Center: brand logo + the single "saved locally" reassurance line. */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 px-4 text-center",
          isMobile && "-translate-y-[60%]"
        )}
      >
        <h1
          className="mb-3 text-5xl font-bold tracking-tight text-gray-300 dark:text-gray-600"
          style={handFont}
        >
          Draw It
        </h1>
        <p
          className={cn("text-lg leading-relaxed", HINT_COLOR)}
          style={handFont}
        >
          All your data is saved locally in your browser.
        </p>
      </div>

      {/* Sketchy hint arrows — only useful (and roomy enough) on larger screens */}
      {!isMobile && (
        <>
          {/* Menu hint (top-left) — arrow sits just under the menu button and
              points up at it, label trailing to the right. */}
          <div className="absolute left-6 top-[3.75rem] flex items-start gap-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 41 94"
              width="30"
              height="68"
              fill="none"
              className={HINT_COLOR}
            >
              <path
                d="M38.5 83.5c-14-2-17.833-10.473-21-22.5C14.333 48.984 12 22 12 12.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="m12.005 10.478 7.905 14.423L6 25.75l6.005-15.273Z"
                fill="currentColor"
              />
              <path
                d="M12.005 10.478c1.92 3.495 3.838 7 7.905 14.423m-7.905-14.423c3.11 5.683 6.23 11.368 7.905 14.423m0 0c-3.68.226-7.35.455-13.91.85m13.91-.85c-5.279.33-10.566.647-13.91.85m0 0c1.936-4.931 3.882-9.86 6.005-15.273M6 25.75c2.069-5.257 4.135-10.505 6.005-15.272"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p
              className={cn("mt-8 text-lg leading-snug", HINT_COLOR)}
              style={handFont}
            >
              Menu, export &amp; theme
            </p>
          </div>

          {/* Toolbar hint (top-center) — arrow points up to the tool palette */}
          <div className="absolute left-1/2 top-[5rem] flex -translate-x-1/2 flex-col items-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 38 78"
              width="34"
              height="70"
              fill="none"
              className={HINT_COLOR}
            >
              <path
                d="M1 77c14-2 31.833-11.973 35-24 3.167-12.016-6-35-9.5-43.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="m24.165 1.093-2.132 16.309 13.27-4.258-11.138-12.05Z"
                fill="currentColor"
              />
              <path
                d="M24.165 1.093c-.522 3.953-1.037 7.916-2.132 16.309m2.131-16.309c-.835 6.424-1.68 12.854-2.13 16.308m0 0c3.51-1.125 7.013-2.243 13.27-4.257m-13.27 4.257c5.038-1.608 10.08-3.232 13.27-4.257m0 0c-3.595-3.892-7.197-7.777-11.14-12.05m11.14 12.05c-3.837-4.148-7.667-8.287-11.14-12.05"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p
              className={cn("mt-2 text-center text-lg leading-snug", HINT_COLOR)}
              style={handFont}
            >
              Pick a tool &amp;
              <br />
              Start drawing!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
