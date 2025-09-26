import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  FileText,
  FolderOpen,
  Download,
  Palette,
  Share,
} from "lucide-react";
import ExportModal from "./ExportModal";

interface HamburgerMenuProps {
  onNew: () => void;
  onOpen: () => void;
  onExport: (format: "png" | "svg" | "json") => void;
  onBackgroundTypeChange: (type: any) => void;
  onShare: () => void;
  backgroundType: string;
}

export default function HamburgerMenu({
  onNew,
  onOpen,
  onExport,
  onBackgroundTypeChange,
  onShare,
  backgroundType,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const backgroundTypes = [
    { value: "none", label: "None" },
    { value: "dots", label: "Dots" },
    { value: "squares", label: "Squares" },
  ];

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 bg-white text-black dark:bg-gray-900 dark:text-white"
        >
          <DropdownMenuItem
            onClick={onNew}
            className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FileText className="mr-2 h-4 w-4" />
            New
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onOpen}
            className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsExportModalOpen(true)}
            className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={onShare}
            className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Share className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
            Background
          </div>
          {backgroundTypes.map((type) => (
            <DropdownMenuItem
              key={type.value}
              onClick={() => onBackgroundTypeChange(type.value)}
              className={`text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 ${
                backgroundType === type.value
                  ? "bg-gray-100 dark:bg-gray-800"
                  : ""
              }`}
            >
              <Palette className="mr-2 h-4 w-4" />
              {type.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={onExport}
      />
    </>
  );
}
