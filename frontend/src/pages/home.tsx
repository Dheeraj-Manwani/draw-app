import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useAuth, SignOutButton } from "@clerk/clerk-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Calendar,
  FileText,
  MoreVertical,
  Edit3,
  Trash2,
  Download,
  Share,
  LogOut,
  Image,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import LoginModal from "@/components/LoginModal";
import CoverImageModal from "@/components/CoverImageModal";
import { type SavedDrawing } from "@/types/canvas";
import { coverImages } from "@/utils/DrawingIcon";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [, setLocation] = useLocation();
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCreatingDrawing, setIsCreatingDrawing] = useState(false);
  const [showCoverImageModal, setShowCoverImageModal] = useState(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null
  );

  // Handle authentication and load drawings
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setShowLoginModal(true);
      setIsLoading(false);
      return;
    }

    // Load drawings from backend API
    const loadDrawings = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) {
          throw new Error("Backend URL not configured");
        }

        const token = await getToken();
        const response = await fetch(`${backendUrl}/rooms?page=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch drawings: ${response.statusText}`);
        }

        const data = await response.json();
        const drawingsWithCoverImages = (data.drawings || []).map(
          (drawing: SavedDrawing) => ({
            ...drawing,
            coverImage:
              drawing.coverImage ??
              Math.floor(Math.random() * coverImages.length),
          })
        );
        setDrawings(drawingsWithCoverImages);
      } catch (error) {
        console.error("Error loading drawings:", error);
        // Fallback to empty array if API fails
        setDrawings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDrawings();
  }, [isLoaded, isSignedIn, getToken]);

  // Create a new drawing
  const createNewDrawing = async () => {
    if (isCreatingDrawing) return;

    setIsCreatingDrawing(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL not configured");
      }

      const roomId = uuidv4();
      const token = await getToken();

      // Create the room on the backend
      const response = await fetch(`${backendUrl}/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: roomId,
          name: "Untitled drawing",
          coverImage: Math.floor(Math.random() * coverImages.length),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.statusText}`);
      }

      // Route optimistically to the new drawing
      setLocation(`/drawing/${roomId}`);
    } catch (error) {
      console.error("Error creating new drawing:", error);
      // Still route to the drawing page even if backend fails
      const roomId = uuidv4();
      setLocation(`/drawing/${roomId}`);
    } finally {
      setIsCreatingDrawing(false);
    }
  };

  // Filter drawings based on search query
  const filteredDrawings = drawings.filter((drawing) =>
    drawing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete a drawing
  const deleteDrawing = (id: string) => {
    if (confirm("Are you sure you want to delete this drawing?")) {
      localStorage.removeItem(`canvas_${id}`);
      localStorage.removeItem(`drawing_name_${id}`);
      setDrawings((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // Handle cover image change
  const handleChangeCoverImage = (drawingId: string) => {
    setSelectedDrawingId(drawingId);
    setShowCoverImageModal(true);
  };

  // Update cover image for a drawing
  const updateCoverImage = (coverImageIndex: number) => {
    if (!selectedDrawingId) return;

    setDrawings((prev) =>
      prev.map((drawing) =>
        drawing.id === selectedDrawingId
          ? { ...drawing, coverImage: coverImageIndex }
          : drawing
      )
    );

    // TODO: Update the backend with the new cover image
    // For now, we'll just update the local state
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const now = new Date();
    const givenDate = new Date(date);
    const diffMs = now.getTime() - givenDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return givenDate.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full gradient-brand animate-pulse"></div>
          <div className="text-gray-600 dark:text-gray-300 font-medium">
            Loading drawings...
          </div>
        </div>
      </div>
    );
  }

  // Show login modal if user is not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold gradient-brand bg-clip-text text-transparent">
                Draw It
              </h1>
              <Badge
                variant="secondary"
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {drawings.length} drawings
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={createNewDrawing}
                disabled={isCreatingDrawing}
                className="gradient-brand text-white hover:opacity-90 shadow-brand disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingDrawing ? "Creating..." : "New Drawing"}
              </Button>
              <SignOutButton>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:border-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search drawings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Drawings Grid */}
        {filteredDrawings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery ? "No drawings found" : "No drawings yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create your first drawing to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={createNewDrawing}
                disabled={isCreatingDrawing}
                className="gradient-brand text-white hover:opacity-90 shadow-brand disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingDrawing ? "Creating..." : "Create First Drawing"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDrawings.map((drawing) => (
              <Card
                key={drawing.id}
                className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {drawing.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(drawing.updatedAt ?? drawing.createdAt)}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/drawing/${drawing.id}`}
                            className="flex items-center"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeCoverImage(drawing.id)}
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Change Cover
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive-foreground"
                          onClick={() => deleteDrawing(drawing.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                    {drawing.coverImage !== undefined &&
                    coverImages[drawing.coverImage] ? (
                      <div className="w-full h-full p-4 flex items-center justify-center">
                        {React.cloneElement(coverImages[drawing.coverImage], {
                          className:
                            "w-full h-full max-w-16 max-h-16 object-contain",
                        })}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{drawing?.elements?.length ?? 0} elements</span>
                    <Badge variant="outline" className="text-xs">
                      {drawing.backgroundType}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link to={`/drawing/${drawing.id}`} className="w-full">
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors"
                    >
                      Open Drawing
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Cover Image Modal */}
      <CoverImageModal
        isOpen={showCoverImageModal}
        onClose={() => {
          setShowCoverImageModal(false);
          setSelectedDrawingId(null);
        }}
        onSelectCoverImage={updateCoverImage}
        currentCoverImage={
          selectedDrawingId
            ? drawings.find((d) => d.id === selectedDrawingId)?.coverImage ?? 0
            : 0
        }
      />
    </div>
  );
}
