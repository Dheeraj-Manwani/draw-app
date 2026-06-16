import { useEffect } from "react";
import { type CanvasElement } from "@/types/canvas";

interface UseKeyboardShortcutsOptions {
  undo: () => void;
  redo: () => void;
  onSave: () => void;
  onNewCanvas: () => void;
  getSelectedElements: () => CanvasElement[];
  onElementDuplicate: (element: CanvasElement) => void;
  onElementDelete: (id: string) => void;
}

/**
 * Wires the editor's global keyboard shortcuts:
 * Ctrl/Cmd+Z/Y (undo/redo), +S (save), +N (new), +D (duplicate),
 * and Delete/Backspace to remove the current selection.
 */
export function useKeyboardShortcuts({
  undo,
  redo,
  onSave,
  onNewCanvas,
  getSelectedElements,
  onElementDuplicate,
  onElementDelete,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack keys while the user is typing in a field (drawing name, AI
      // prompt, embed URL, the text-tool textarea, etc.). Otherwise Backspace
      // would delete canvas elements and Ctrl+Z/S/N/D would be stolen.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            e.shiftKey ? redo() : undo();
            break;
          case "y":
            e.preventDefault();
            redo();
            break;
          case "s":
            e.preventDefault();
            onSave();
            break;
          case "n":
            e.preventDefault();
            onNewCanvas();
            break;
          case "d":
            e.preventDefault();
            getSelectedElements().forEach(onElementDuplicate);
            break;
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        getSelectedElements().forEach((element) => onElementDelete(element.id));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    onSave,
    onNewCanvas,
    getSelectedElements,
    onElementDuplicate,
    onElementDelete,
  ]);
}
