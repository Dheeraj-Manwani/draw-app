import { type CanvasElement, type BackgroundType } from "@/types/canvas";

interface OpenDrawingOptions {
  currentElements: CanvasElement[];
  onElementDelete: (id: string) => void;
  onElementCreate: (element: CanvasElement) => void;
  onClearSelection: () => void;
  onDrawingNameChange: (name: string) => void;
  onBackgroundTypeChange: (type: BackgroundType) => void;
  onBackgroundColorChange: (color: string) => void;
  toast: (message: string, opts?: { variant?: "destructive" }) => void;
}

/**
 * Prompts the user to pick a `.json` drawing file, validates it, clears the
 * current canvas and loads the file's elements / name / background.
 */
export function openDrawingFromFile({
  currentElements,
  onElementDelete,
  onElementCreate,
  onClearSelection,
  onDrawingNameChange,
  onBackgroundTypeChange,
  onBackgroundColorChange,
  toast,
}: OpenDrawingOptions) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (data.elements && Array.isArray(data.elements)) {
          currentElements.forEach((element) => onElementDelete(element.id));
          onClearSelection();

          data.elements.forEach((element: CanvasElement) =>
            onElementCreate(element)
          );

          if (data.name) onDrawingNameChange(data.name);
          if (data.backgroundType) onBackgroundTypeChange(data.backgroundType);
          if (data.backgroundColor)
            onBackgroundColorChange(data.backgroundColor);

          toast(`Drawing "${data.name || "Untitled"}" loaded successfully!`);
        } else {
          toast("Invalid file format. Please select a valid drawing file.", {
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading drawing:", error);
        toast("Error loading drawing. Please check the file format.", {
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

interface ShareDrawingOptions {
  drawingName: string;
  elements: CanvasElement[];
  backgroundType: BackgroundType;
  backgroundColor: string;
  toast: (message: string) => void;
}

/**
 * Serializes the drawing to JSON, downloads it as a file and (when supported)
 * copies it to the clipboard.
 */
export function shareDrawing({
  drawingName,
  elements,
  backgroundType,
  backgroundColor,
  toast,
}: ShareDrawingOptions) {
  const shareableData = {
    name: drawingName,
    elements,
    backgroundType,
    backgroundColor,
    createdAt: new Date().toISOString(),
    version: "1.0",
  };

  const json = JSON.stringify(shareableData, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${drawingName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_drawing.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(json)
      .then(() => toast("Drawing exported and copied to clipboard!"))
      .catch(() => toast("Drawing exported successfully!"));
  } else {
    toast("Drawing exported successfully!");
  }
}
