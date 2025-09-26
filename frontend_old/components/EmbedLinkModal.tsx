import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, X, ExternalLink } from "lucide-react";

interface EmbedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkSubmit: (url: string) => void;
}

export default function EmbedLinkModal({
  isOpen,
  onClose,
  onLinkSubmit,
}: EmbedLinkModalProps) {
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(false);

  const validateUrl = (inputUrl: string) => {
    // Check if URL is from supported platforms
    const supportedPlatforms = [
      "youtube.com",
      "youtu.be",
      "twitter.com",
      "x.com",
      "instagram.com",
      "facebook.com",
      "tiktok.com",
      "linkedin.com",
      "pinterest.com",
    ];

    try {
      const urlObj = new URL(inputUrl);
      const hostname = urlObj.hostname.toLowerCase();

      const isSupported = supportedPlatforms.some((platform) =>
        hostname.includes(platform)
      );

      setIsValid(isSupported);
      return isSupported;
    } catch {
      setIsValid(false);
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    validateUrl(inputUrl);
  };

  const handleSubmit = () => {
    if (isValid && url.trim()) {
      onLinkSubmit(url.trim());
      onClose();
      setUrl("");
      setIsValid(false);
    }
  };

  const handleClose = () => {
    onClose();
    setUrl("");
    setIsValid(false);
  };

  const getPlatformName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        return "YouTube";
      } else if (hostname.includes("twitter.com")) {
        return "Twitter";
      } else if (hostname.includes("x.com")) {
        return "X";
      } else if (hostname.includes("instagram.com")) {
        return "Instagram";
      } else if (hostname.includes("facebook.com")) {
        return "Facebook";
      } else if (hostname.includes("tiktok.com")) {
        return "TikTok";
      } else if (hostname.includes("linkedin.com")) {
        return "LinkedIn";
      } else if (hostname.includes("pinterest.com")) {
        return "Pinterest";
      }
      return "Social Media";
    } catch {
      return "Social Media";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white dark:bg-black">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Embed Social Media
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium">Social Media Link</Label>
            <div className="mt-2 space-y-2">
              <Input
                value={url}
                onChange={handleUrlChange}
                placeholder="Paste your social media link here..."
                className={`pr-10 ${
                  isValid
                    ? "border-green-500"
                    : url && !isValid
                    ? "border-red-500"
                    : ""
                }`}
              />
              {url && isValid && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <ExternalLink className="h-4 w-4" />
                  <span>✓ {getPlatformName(url)} link detected</span>
                </div>
              )}
              {url && !isValid && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <X className="h-4 w-4" />
                  <span>Unsupported platform or invalid URL</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Supported Platforms:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• YouTube, Twitter, X, Instagram</div>
              <div>• Facebook, TikTok, LinkedIn, Pinterest</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || !url.trim()}>
            <Link className="h-4 w-4 mr-2" />
            Embed Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
