import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
// import "./control-panel-style.css";
import { MinusIcon, PlusIcon, Github, MoveLeft, MoveRight } from "lucide-react";

type ControlPanelProps = {
  undo: () => void;
  redo: () => void;
  onZoom: (scale: number) => void;
  scale: number;
  setScale: (scale: number) => void;
};

export function ControlPanel({
  undo,
  redo,
  onZoom,
  scale,
  setScale,
}: ControlPanelProps) {
  return (
    <>
      <div className="w-[300px] flex gap-[20px] fixed z-[2] bottom-[20px] left-[20px]">
        <div className="flex rounded-[8px] bg-[var(--panel-bg-color)]">
          <Tippy content="Zoom Out">
            <button
              onClick={() => onZoom(-0.1)}
              aria-label="Zoom Out"
              className="p-[10px_15px] border-none text-[#27272c] text-[0.9em] bg-transparent hover:bg-[var(--hover-bg-color)]"
            >
              <MinusIcon className="w-[20px] h-[20px] text-[#27272c]" />
            </button>
          </Tippy>
          <Tippy content={`Set scale to 100%`}>
            <button
              onClick={() => setScale(1)}
              aria-label={`Set scale to 100%`}
              className="p-[10px_15px] border-none text-[#27272c] text-[0.9em] bg-transparent hover:bg-[var(--hover-bg-color)]"
            >
              {new Intl.NumberFormat("en-GB", { style: "percent" }).format(
                scale
              )}
            </button>
          </Tippy>
          <Tippy content="Zoom In">
            <button
              onClick={() => onZoom(0.1)}
              aria-label="Zoom In"
              className="p-[10px_15px] border-none text-[#27272c] text-[0.9em] bg-transparent hover:bg-[var(--hover-bg-color)]"
            >
              <PlusIcon className="w-[20px] h-[20px] text-[#27272c]" />
            </button>
          </Tippy>
        </div>

        <div className="flex rounded-[8px] bg-[var(--panel-bg-color)]">
          <Tippy content="Undo last action">
            <button
              onClick={undo}
              aria-label="Undo last action"
              className="p-[10px_15px] border-none text-[#27272c] text-[0.9em] bg-transparent hover:bg-[var(--hover-bg-color)]"
            >
              <MoveLeft className="w-[20px] h-[20px] text-[#27272c]" />
            </button>
          </Tippy>
          <Tippy content="Redo last action">
            <button
              onClick={redo}
              aria-label="Redo last action"
              className="p-[10px_15px] border-none text-[#27272c] text-[0.9em] bg-transparent hover:bg-[var(--hover-bg-color)]"
            >
              <MoveRight className="w-[20px] h-[20px] text-[#27272c]" />
            </button>
          </Tippy>
        </div>
      </div>
      <a
        className="fixed z-[2] bottom-[20px] right-[20px] flex gap-[8px] items-center rounded-[8px] bg-[var(--panel-bg-color)] p-[10px_15px] text-decoration-none hover:underline"
        href="https://github.com/mirayatech"
        target="_blank"
      >
        <Github className="w-[18px] h-[18px]" />
        Created by Miraya
      </a>
    </>
  );
}
