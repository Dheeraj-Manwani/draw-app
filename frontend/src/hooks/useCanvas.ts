import { useCallback, useRef, useState, useEffect } from "react";
import {
  type CanvasElement,
  type CanvasState,
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
  const historyIndexRef = useRef(-1);

  // Initialize history with initial state
  useEffect(() => {
    if (history.length === 0) {
      const initialUndoableState: UndoableState = {
        elements: INITIAL_STATE.elements,
        selectedElementIds: INITIAL_STATE.selectedElementIds,
      };
      setHistory([initialUndoableState]);
      setHistoryIndex(0);
      historyIndexRef.current = 0;
    }
  }, [history.length]);

  const pushToHistory = useCallback((newState: CanvasState) => {
    if (undoRedoInProgress.current) return;

    const undoableState: UndoableState = {
      elements: newState.elements,
      selectedElementIds: newState.selectedElementIds,
    };

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndexRef.current + 1);
      newHistory.push(undoableState);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex((prev) => {
      const newIndex = Math.min(prev + 1, 49);
      historyIndexRef.current = newIndex;
      return newIndex;
    });
  }, []);

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

  // Apply updates to many elements in a single functional setState. This avoids
  // the "last write wins" bug that happens when callers loop and fire one
  // updateElement per id (each call computed from the same stale snapshot, so
  // only the final element's change survived). Pass withHistory=false for the
  // live frames of a drag gesture and commit a single history entry on release.
  const updateMultipleElements = useCallback(
    (
      updatesById: Record<string, Partial<CanvasElement>>,
      withHistory = true
    ) => {
      setState((prev) => {
        const newState: CanvasState = {
          ...prev,
          elements: prev.elements.map((el) =>
            updatesById[el.id] ? { ...el, ...updatesById[el.id] } : el
          ),
        };
        if (withHistory) pushToHistory(newState);
        return newState;
      });
    },
    [pushToHistory]
  );

  // Live (no-history) batch update for the per-frame updates of a drag/resize.
  const updateElementsLive = useCallback(
    (updatesById: Record<string, Partial<CanvasElement>>) => {
      updateMultipleElements(updatesById, false);
    },
    [updateMultipleElements]
  );

  // Push the current state onto the undo stack as a single entry. Called once
  // when a drag/resize/erase gesture ends so the whole gesture is one undo step.
  const commitHistory = useCallback(() => {
    setState((prev) => {
      pushToHistory(prev);
      return prev;
    });
  }, [pushToHistory]);

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

  const deleteMultiElements = useCallback(
    (elementIds: string[]) => {
      updateState({
        elements: state.elements.filter((el) => !elementIds.includes(el.id)),
        selectedElementIds: state.selectedElementIds.filter(
          (selectedId) => !elementIds.includes(selectedId)
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
    if (historyIndex > 0) {
      undoRedoInProgress.current = true;
      const prevUndoableState = history[historyIndex - 1];
      setState((prev) => ({ ...prev, ...prevUndoableState }));
      setHistoryIndex((prev) => {
        const newIndex = prev - 1;
        historyIndexRef.current = newIndex;
        return newIndex;
      });
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
      setHistoryIndex((prev) => {
        const newIndex = prev + 1;
        historyIndexRef.current = newIndex;
        return newIndex;
      });
      setTimeout(() => {
        undoRedoInProgress.current = false;
      }, 0);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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
        lastSaved?: string;
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
    updateMultipleElements,
    updateElementsLive,
    commitHistory,
    deleteElement,
    deleteMultiElements,
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
    getSelectedElements,
    loadElements,
    saveToLocalStorage,
    loadFromLocalStorage,
  };
}
