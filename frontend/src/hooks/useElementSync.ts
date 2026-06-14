import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type CanvasElement } from "@/types/canvas";

interface UseElementSyncOptions {
  roomId: string;
  // When true (the "/" route) we keep everything local and skip API calls.
  isDefaultRoute: boolean;
  addElement: (element: CanvasElement, onAdded?: () => void) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
}

/**
 * Owns the persistence side of element CRUD: optimistic local updates via the
 * canvas store plus best-effort syncing to the backend through react-query.
 * Returns the handlers the editor wires into the canvas and panels.
 */
export function useElementSync({
  roomId,
  isDefaultRoute,
  addElement,
  updateElement,
  deleteElement,
}: UseElementSyncOptions) {
  const queryClient = useQueryClient();
  const elementsKey = ["/api/rooms", roomId, "elements"];

  const invalidate = useCallback(() => {
    if (!isDefaultRoute) {
      queryClient.invalidateQueries({ queryKey: elementsKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDefaultRoute, queryClient, roomId]);

  const createElementMutation = useMutation({
    mutationFn: async (element: CanvasElement) => {
      if (isDefaultRoute) return element;
      const response = await apiRequest(
        "POST",
        `/api/rooms/${roomId}/elements`,
        element
      );
      return response.json();
    },
    onSuccess: invalidate,
  });

  const updateElementMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CanvasElement>;
    }) => {
      if (isDefaultRoute) return { id, updates };
      const response = await apiRequest("PUT", `/api/elements/${id}`, updates);
      return response.json();
    },
    onSuccess: invalidate,
  });

  const deleteElementMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDefaultRoute) return { id };
      const response = await apiRequest("DELETE", `/api/elements/${id}`);
      return response.json();
    },
    onSuccess: invalidate,
  });

  const handleElementCreate = useCallback(
    (element: CanvasElement, onAdded?: () => void) => {
      addElement(element, onAdded);
      createElementMutation.mutate(element);
    },
    [addElement, createElementMutation]
  );

  const handleElementUpdate = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      updateElement(id, updates);
      updateElementMutation.mutate({ id, updates });
    },
    [updateElement, updateElementMutation]
  );

  const handleElementDelete = useCallback(
    (id: string) => {
      deleteElement(id);
      deleteElementMutation.mutate(id);
    },
    [deleteElement, deleteElementMutation]
  );

  return { handleElementCreate, handleElementUpdate, handleElementDelete };
}
