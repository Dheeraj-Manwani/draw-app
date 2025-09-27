import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Eye, Plus } from "lucide-react";

interface AIDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertDiagram: (diagramData: string) => void;
}

export default function AIDiagramModal({
  isOpen,
  onClose,
  onInsertDiagram,
}: AIDiagramModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDiagram, setGeneratedDiagram] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text-to-diagram" | "mermaid">(
    "text-to-diagram"
  );
  const [requestsLeft, setRequestsLeft] = useState(9);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Simulate AI generation - in real implementation, this would call an AI service
      // For now, we'll generate a simple Mermaid diagram based on the prompt
      const mermaidCode = generateMermaidFromPrompt(prompt);
      setGeneratedDiagram(mermaidCode);
      setRequestsLeft((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error generating diagram:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMermaidFromPrompt = (prompt: string): string => {
    // Simple prompt-to-Mermaid conversion logic
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("flowchart") || lowerPrompt.includes("flow")) {
      return `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;
    } else if (
      lowerPrompt.includes("sequence") ||
      lowerPrompt.includes("interaction")
    ) {
      return `sequenceDiagram
    participant A as User
    participant B as System
    A->>B: Request
    B->>A: Response`;
    } else if (
      lowerPrompt.includes("class") ||
      lowerPrompt.includes("object")
    ) {
      return `classDiagram
    class User {
      +String name
      +String email
      +login()
      +logout()
    }
    class System {
      +String version
      +process()
    }
    User --> System`;
    } else {
      // Default flowchart
      return `flowchart TD
    A[${prompt.split(" ").slice(0, 3).join(" ")}] --> B[Process]
    B --> C[Result]`;
    }
  };

  const handleInsert = () => {
    if (generatedDiagram) {
      onInsertDiagram(generatedDiagram);
      onClose();
      // Reset state
      setPrompt("");
      setGeneratedDiagram(null);
    }
  };

  const handleViewAsMermaid = () => {
    if (generatedDiagram) {
      // Open Mermaid in a new tab or show in a modal
      const blob = new Blob([generatedDiagram], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagram.mmd";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900/50 backdrop-blur-sm border-gray-300 dark:border-gray-600">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl font-semibold">
              {activeTab === "text-to-diagram" ? "Text to diagram" : "Mermaid"}
            </DialogTitle>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              AI Beta
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setActiveTab(
                  activeTab === "text-to-diagram"
                    ? "mermaid"
                    : "text-to-diagram"
                )
              }
              className="ml-auto"
            >
              {activeTab === "text-to-diagram" ? "Mermaid" : "Text to diagram"}
            </Button>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {activeTab === "text-to-diagram"
              ? "Currently we use Mermaid as a middle step, so you'll get best results if you describe a diagram, workflow, flow chart, and similar."
              : "Write Mermaid code directly to generate diagrams."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[60vh]">
          {/* Left side - Prompt */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Prompt
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {requestsLeft} requests left today
              </span>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                activeTab === "text-to-diagram"
                  ? "Describe the diagram you want to create..."
                  : "Write Mermaid code here..."
              }
              className="flex-1 resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Right side - Preview */}
          <div className="flex flex-col">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
              Preview
            </h3>
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generating diagram...
                  </p>
                </div>
              ) : generatedDiagram ? (
                <div className="w-full h-full p-4">
                  <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-4 h-full overflow-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap text-gray-900 dark:text-white">
                      {generatedDiagram}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Generated diagram will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || requestsLeft === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate →
                </>
              )}
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Ctrl Enter
            </span>
          </div>

          <div className="flex items-center gap-3">
            {generatedDiagram && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleViewAsMermaid}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View as Mermaid →
                </Button>
                <Button
                  onClick={handleInsert}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Insert →
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
