"use client";

import { useState, useEffect } from "react";
// import { Link } from "wouter";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type SavedDrawing } from "@/types/canvas";
import Link from "next/link";

export default function Home() {
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved drawings from localStorage
  useEffect(() => {
    const loadDrawings = () => {
      try {
        const savedDrawings: SavedDrawing[] = [];

        // Get all localStorage keys that start with "canvas_"
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("canvas_") && key !== "canvas_undefined") {
            const canvasData = localStorage.getItem(key);
            const nameData = localStorage.getItem(
              `drawing_name_${key.replace("canvas_", "")}`
            );

            if (canvasData) {
              const elements = JSON.parse(canvasData);
              const roomId = key.replace("canvas_", "");

              // Create a basic thumbnail (you could enhance this)
              const thumbnail = generateThumbnail(elements);

              savedDrawings.push({
                id: roomId,
                name: nameData || "Untitled drawing",
                elements,
                backgroundType: "grid",
                backgroundColor: "#ffffff",
                createdAt: new Date(roomId.split("_")[1] || Date.now()),
                updatedAt: new Date(roomId.split("_")[1] || Date.now()),
                thumbnail,
              });
            }
          }
        }

        // Sort by updated date (newest first)
        savedDrawings.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        setDrawings(savedDrawings);
      } catch (error) {
        console.error("Error loading drawings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDrawings();
  }, []);

  // Generate a simple thumbnail
  const generateThumbnail = (elements: any[]) => {
    // This is a simple implementation - you could enhance this
    // to actually render a canvas thumbnail
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="150" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="100" y="75" text-anchor="middle" fill="#64748b" font-family="Inter, sans-serif" font-size="14">
          ${elements.length} elements
        </text>
      </svg>
    `)}`;
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

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full gradient-brand animate-pulse"></div>
          <div className="text-muted-foreground font-medium">
            Loading drawings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold gradient-brand bg-clip-text text-transparent">
                Draw It
              </h1>
              <Badge variant="secondary" className="text-xs">
                {drawings.length} drawings
              </Badge>
            </div>
            <Link href="/drawing">
              <Button className="gradient-brand text-primary-foreground hover:opacity-90 shadow-brand">
                <Plus className="w-4 h-4 mr-2" />
                New Drawing
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search drawings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Drawings Grid */}
        {filteredDrawings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <FileText className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? "No drawings found" : "No drawings yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create your first drawing to get started"}
            </p>
            {!searchQuery && (
              <Link href="/drawing">
                <Button className="gradient-brand text-primary-foreground hover:opacity-90 shadow-brand">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Drawing
                </Button>
              </Link>
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
                        {formatDate(drawing.updatedAt)}
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
                            href={`/drawing/${drawing.id}`}
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
                          className="text-destructive"
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
                  <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden mb-3">
                    {drawing.thumbnail ? (
                      <img
                        src={drawing.thumbnail}
                        alt={drawing.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{drawing.elements.length} elements</span>
                    <Badge variant="outline" className="text-xs">
                      {drawing.backgroundType}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link href={`/drawing/${drawing.id}`} className="w-full">
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
    </div>
  );
}
