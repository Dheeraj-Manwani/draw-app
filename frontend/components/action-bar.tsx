import { Tools, ToolsType } from "@/types/index";

import {
  LucidePencil,
  Minus,
  MousePointer2,
  Square,
  HandIcon,
  TextIcon,
} from "lucide-react";

// Tailwind CSS classes replacing the previous styles

type ActionBarProps = {
  tool: ToolsType;
  setTool: (tool: ToolsType) => void;
};

export function ActionBar({ tool, setTool }: ActionBarProps) {
  return (
    <div className="fixed top-5 z-20 p-2 bg-primary-bg left-1/2 flex gap-5 justify-center transform -translate-x-1/2 border border-border-color rounded-lg shadow-md">
      {Object.values(Tools).map((t, index) => (
        <div
          className={`relative cursor-pointer rounded-md border border-transparent p-2 bg-primary-bg transition-colors hover:bg-secondary-bg ${
            tool === t ? "bg-selected-bg text-highlight-color" : ""
          }`}
          key={t}
          onClick={() => setTool(t)}
        >
          <input
            type="radio"
            id={t}
            checked={tool === t}
            onChange={() => setTool(t)}
            readOnly
            className="absolute w-5 h-5 opacity-0"
          />
          <label
            htmlFor={t}
            className="absolute w-px h-px p-0 m-[-1px] overflow-hidden clip-rect-0 whitespace-nowrap border-0"
          >
            {t}
          </label>
          {t === "pan" && (
            <HandIcon className="w-6 h-6 text-primary-text transition-colors" />
          )}
          {t === "selection" && (
            <MousePointer2 className="w-6 h-6 text-primary-text transition-colors" />
          )}
          {t === "rectangle" && (
            <Square className="w-6 h-6 text-primary-text transition-colors" />
          )}
          {t === "line" && (
            <Minus className="w-6 h-6 text-primary-text transition-colors" />
          )}
          {t === "pencil" && (
            <LucidePencil className="w-6 h-6 text-primary-text transition-colors" />
          )}
          {t === "text" && (
            <TextIcon className="w-6 h-6 text-primary-text transition-colors" />
          )}
          <span className="absolute bottom-0 right-1 text-xs text-secondary-text">
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
