import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@clerk/clerk-react";
import { LogOut, User } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg" | "xsm";
  showName?: boolean;
}

export default function UserAvatar({
  size = "md",
  showName = false,
}: UserAvatarProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeClasses = () => {
    switch (size) {
      case "xsm":
        return {
          avatar: "h-6 w-6",
          text: "text-xs",
          dropdown: "w-40",
        };
      case "sm":
        return {
          avatar: "h-8 w-8",
          text: "text-xs",
          dropdown: "w-48",
        };
      case "lg":
        return {
          avatar: "h-12 w-12",
          text: "text-lg",
          dropdown: "w-56",
        };
      default:
        return {
          avatar: "h-10 w-10",
          text: "text-sm",
          dropdown: "w-52",
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const userInitials = getInitials(
    user.fullName || user.emailAddresses[0]?.emailAddress || "U"
  );
  const userDisplayName =
    user.fullName || user.emailAddresses[0]?.emailAddress || "User";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`${sizeClasses.avatar} p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
        >
          <Avatar className={sizeClasses.avatar}>
            <AvatarFallback
              className={`${sizeClasses.text} font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200`}
            >
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={`${sizeClasses.dropdown} bg-white text-black dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-700 shadow-lg`}
      >
        {/* User Info */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {userDisplayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

        <SignOutButton>
          <DropdownMenuItem className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
