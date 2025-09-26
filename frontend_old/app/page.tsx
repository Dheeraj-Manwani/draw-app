"use client";

import Drawing from "@/pages/drawing";
import { useParams } from "next/navigation";
// import { ToastProvider } from "@/context/ToastContext";
import { Toaster } from "sonner";

export default function DrawingPage() {
  return <Drawing />;
}
