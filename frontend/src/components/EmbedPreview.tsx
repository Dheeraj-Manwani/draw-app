import { useEffect, useRef } from "react";
import {
  YouTubeEmbed,
  TwitterEmbed,
  InstagramEmbed,
  FacebookEmbed,
  TikTokEmbed,
  LinkedInEmbed,
  PinterestEmbed,
  XEmbed,
} from "react-social-media-embed";

interface EmbedPreviewProps {
  url: string;
  width?: number;
  height?: number;
}

export default function EmbedPreview({
  url,
  width = 400,
  height = 300,
}: EmbedPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear any existing content
      containerRef.current.innerHTML = "";
    }
  }, [url]);

  const getEmbedComponent = () => {
    if (!url) {
      return (
        <div
          className="flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25"
          style={{ width, height }}
        >
          <div className="text-center text-muted-foreground">
            <div className="text-sm font-medium">No URL provided</div>
          </div>
        </div>
      );
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      console.log("EmbedPreview: Processing URL:", url, "Hostname:", hostname);

      if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        console.log("EmbedPreview: Rendering YouTube embed");
        return <YouTubeEmbed url={url} width={width} height={height} />;
      } else if (hostname.includes("twitter.com")) {
        console.log("EmbedPreview: Rendering Twitter embed");
        return <TwitterEmbed url={url} width={width} height={height} />;
      } else if (hostname.includes("x.com")) {
        console.log("EmbedPreview: Rendering X embed");
        return <XEmbed url={url} width={width} height={height} />;
      } else if (hostname.includes("instagram.com")) {
        console.log("EmbedPreview: Rendering Instagram embed");
        return <InstagramEmbed url={url} width={width} height={height} />;
      } else if (hostname.includes("facebook.com")) {
        console.log("EmbedPreview: Rendering Facebook embed");
        return <FacebookEmbed url={url} width={width} height={height} />;
      } else if (hostname.includes("tiktok.com")) {
        console.log("EmbedPreview: Rendering TikTok embed");
        return <TikTokEmbed url={url} width={width} height={height} />;
      } else if (hostname.includes("linkedin.com")) {
        console.log("EmbedPreview: Rendering LinkedIn embed");
        return <LinkedInEmbed url={url} width={width} height={height} />;
      } else if (hostname.includes("pinterest.com")) {
        console.log("EmbedPreview: Rendering Pinterest embed");
        return <PinterestEmbed url={url} width={width} height={height} />;
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
    }

    return (
      <div
        className="flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25"
        style={{ width, height }}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-sm font-medium">Unsupported Platform</div>
          <div className="text-xs mt-1">This link cannot be embedded</div>
          <div className="text-xs mt-1 text-red-500">URL: {url}</div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="embed-container"
      style={{
        width,
        height,
        willChange: "transform",
        transform: "translateZ(0)", // Force hardware acceleration
        backgroundColor: "rgba(255, 0, 0, 0.1)", // Debug background
        border: "2px solid blue", // Debug border
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 255, 0, 0.1)",
          border: "1px solid green",
        }}
      >
        <div style={{ textAlign: "center", padding: "10px" }}>
          <div>URL: {url}</div>
          <div>
            Size: {width}x{height}
          </div>
        </div>
      </div>
      {getEmbedComponent()}
    </div>
  );
}
