import { useCallback, useRef, useState } from "react";
import {
  type CanvasElement,
  type CanvasState,
  type DrawingAction,
  type Point,
  type BackgroundType,
} from "@/types/canvas";

type UndoableState = Pick<CanvasState, "elements" | "selectedElementIds">;

const INITIAL_STATE: CanvasState = {
  elements: [],
  selectedElementIds: [],
  tool: "select",
  zoom: 1,
  panX: 0,
  panY: 0,
  gridVisible: true,
  backgroundType: "none",
  backgroundColor: "#ffffff",
  toolLocked: false,
};

export function useCanvas() {
  const [state, setState] = useState<CanvasState>(INITIAL_STATE);
  const [history, setHistory] = useState<UndoableState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const undoRedoInProgress = useRef(false);

  const pushToHistory = useCallback(
    (newState: CanvasState) => {
      if (undoRedoInProgress.current) return;

      const undoableState: UndoableState = {
        elements: newState.elements,
        selectedElementIds: newState.selectedElementIds,
      };

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(undoableState);
        return newHistory.slice(-50); // Keep last 50 states
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex]
  );

  const updateState = useCallback(
    (updates: Partial<CanvasState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        pushToHistory(newState);
        return newState;
      });
    },
    [pushToHistory]
  );

  const updateStateNoHistory = useCallback((updates: Partial<CanvasState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const addElement = useCallback(
    (element: CanvasElement, onAdded?: () => void) => {
      updateState({
        elements: [...state.elements, element],
      });
      // Call the callback after state update
      if (onAdded) {
        setTimeout(onAdded, 0);
      }
    },
    [state.elements, updateState]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      updateState({
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      });
    },
    [state.elements, updateState]
  );

  const deleteElement = useCallback(
    (id: string) => {
      updateState({
        elements: state.elements.filter((el) => el.id !== id),
        selectedElementIds: state.selectedElementIds.filter(
          (selectedId) => selectedId !== id
        ),
      });
    },
    [state.elements, state.selectedElementIds, updateState]
  );

  const selectElement = useCallback(
    (id: string, multiSelect = false) => {
      updateStateNoHistory({
        selectedElementIds: multiSelect
          ? state.selectedElementIds.includes(id)
            ? state.selectedElementIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedElementIds, id]
          : [id],
      });
    },
    [state.selectedElementIds, updateStateNoHistory]
  );

  const clearSelection = useCallback(() => {
    updateStateNoHistory({ selectedElementIds: [] });
  }, [updateStateNoHistory]);

  const selectMultipleElements = useCallback(
    (ids: string[], addToSelection = false) => {
      const newSelection = addToSelection
        ? [
            ...state.selectedElementIds,
            ...ids.filter((id) => !state.selectedElementIds.includes(id)),
          ]
        : ids;
      updateStateNoHistory({
        selectedElementIds: newSelection,
      });
    },
    [state.selectedElementIds, updateStateNoHistory]
  );

  const setTool = useCallback(
    (tool: string) => {
      // Only clear selection when switching away from select tool
      updateStateNoHistory({
        tool,
        selectedElementIds: tool === "select" ? state.selectedElementIds : [],
      });
    },
    [updateStateNoHistory, state.selectedElementIds]
  );

  const setZoom = useCallback(
    (zoom: number) => {
      updateStateNoHistory({ zoom: Math.max(0.1, Math.min(5, zoom)) });
    },
    [updateStateNoHistory]
  );

  const setPan = useCallback(
    (panX: number, panY: number) => {
      updateStateNoHistory({ panX, panY });
    },
    [updateStateNoHistory]
  );

  const toggleGrid = useCallback(() => {
    updateStateNoHistory({ gridVisible: !state.gridVisible });
  }, [state.gridVisible, updateStateNoHistory]);

  const setBackgroundType = useCallback(
    (backgroundType: BackgroundType) => {
      updateStateNoHistory({ backgroundType });
    },
    [updateStateNoHistory]
  );

  const setBackgroundColor = useCallback(
    (backgroundColor: string) => {
      updateStateNoHistory({ backgroundColor });
    },
    [updateStateNoHistory]
  );

  const toggleToolLock = useCallback(() => {
    updateStateNoHistory({ toolLocked: !state.toolLocked });
  }, [state.toolLocked, updateStateNoHistory]);

  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      undoRedoInProgress.current = true;
      const prevUndoableState =
        historyIndex === 0
          ? {
              elements: INITIAL_STATE.elements,
              selectedElementIds: INITIAL_STATE.selectedElementIds,
            }
          : history[historyIndex - 1];
      setState((prev) => ({ ...prev, ...prevUndoableState }));
      setHistoryIndex((prev) => prev - 1);
      setTimeout(() => {
        undoRedoInProgress.current = false;
      }, 0);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      undoRedoInProgress.current = true;
      const nextUndoableState = history[historyIndex + 1];
      setState((prev) => ({ ...prev, ...nextUndoableState }));
      setHistoryIndex((prev) => prev + 1);
      setTimeout(() => {
        undoRedoInProgress.current = false;
      }, 0);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const getElementAtPoint = useCallback(
    (point: Point): CanvasElement | null => {
      // Check elements in reverse order (front to back)
      for (let i = state.elements.length - 1; i >= 0; i--) {
        const element = state.elements[i];
        if (isPointInElement(point, element)) {
          return element;
        }
      }
      return null;
    },
    [state.elements]
  );

  const getSelectedElements = useCallback(() => {
    return state.elements.filter((el) =>
      state.selectedElementIds.includes(el.id)
    );
  }, [state.elements, state.selectedElementIds]);

  // Load elements from saved data
  const loadElements = useCallback(
    (elements: CanvasElement[]) => {
      setState((prev) => {
        const newState = { ...prev, elements };
        pushToHistory(newState);
        return newState;
      });
    },
    [pushToHistory]
  );

  // Save drawing to localStorage with a specific key
  const saveToLocalStorage = useCallback(
    (
      key: string,
      drawingData: {
        elements: CanvasElement[];
        name?: string;
        backgroundType?: BackgroundType;
        backgroundColor?: string;
      }
    ) => {
      try {
        localStorage.setItem(key, JSON.stringify(drawingData));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    },
    []
  );

  // Load drawing from localStorage with a specific key
  const loadFromLocalStorage = useCallback(
    (key: string) => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const drawingData = JSON.parse(saved);
          if (drawingData.elements && Array.isArray(drawingData.elements)) {
            loadElements(drawingData.elements);

            // Update other state properties if they exist
            if (drawingData.backgroundType) {
              setBackgroundType(drawingData.backgroundType);
            }
            if (drawingData.backgroundColor) {
              setBackgroundColor(drawingData.backgroundColor);
            }

            return drawingData;
          }
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
      return null;
    },
    [loadElements, setBackgroundType, setBackgroundColor]
  );

  return {
    state,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    selectMultipleElements,
    clearSelection,
    setTool,
    setZoom,
    setPan,
    toggleGrid,
    setBackgroundType,
    setBackgroundColor,
    toggleToolLock,
    undo,
    redo,
    canUndo,
    canRedo,
    getElementAtPoint,
    getSelectedElements,
    loadElements,
    saveToLocalStorage,
    loadFromLocalStorage,
  };
}

function isPointInElement(point: Point, element: CanvasElement): boolean {
  const { x, y, width, height } = element;
  return (
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  );
}
