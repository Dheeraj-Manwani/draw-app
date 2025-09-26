import toast from "react-hot-toast";

// Re-export toast from react-hot-toast for compatibility
export { toast };

// Create a useToast hook that provides a similar interface to the original
export function useToast() {
  return {
    toast: (message: string, options?: any) => {
      if (options?.variant === "destructive") {
        return toast.error(message, options);
      }
      if (options?.variant === "success") {
        return toast.success(message, options);
      }
      return toast(message, options);
    },
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    },
    toasts: [], // Empty array for compatibility
  };
}
