import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, X } from "lucide-react";

interface GenerateDrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export default function GenerateDrawingModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: GenerateDrawingModalProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    await onGenerate(prompt.trim());
    setPrompt("");
  };

  const handleClose = () => {
    if (!isGenerating) {
      setPrompt("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-white text-black dark:bg-gray-900 dark:text-white border-2 border-primary/20">
        <div className="relative">
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse opacity-20"></div>
          <div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary via-purple-500 to-primary opacity-10 animate-spin"
            style={{ animationDuration: "3s" }}
          ></div>

          <div className="relative bg-background rounded-lg">
            <DialogHeader className="relative">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                Generate Drawing with AI
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isGenerating}
                className="absolute right-0 top-0 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Describe what you want to draw:
                </label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Draw a house with a garden, trees, and a sun in the sky"
                  className="min-h-[120px] resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI will create shapes, lines, and text based on your
                  description
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!prompt.trim() || isGenerating}
                    className="gradient-brand text-white hover:opacity-90 shadow-brand"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
