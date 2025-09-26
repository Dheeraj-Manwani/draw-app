import { useLocation } from "wouter";
import { SignIn } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [, setLocation] = useLocation();

  const handleClose = () => {
    onClose();
    // Redirect to /drawing when modal is closed
    setLocation("/drawing");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Sign in to continue
              </DialogTitle>
              <DialogDescription className="mt-1">
                Please sign in to access your drawings and create new ones.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="mt-4">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary:
                  "gradient-brand text-white hover:opacity-90 shadow-brand",
                card: "shadow-none border-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-border hover:bg-muted",
                formFieldInput: "border-border focus:border-primary",
                footerActionLink: "text-primary hover:text-primary/80",
              },
            }}
            afterSignInUrl="/"
            afterSignUpUrl="/"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
