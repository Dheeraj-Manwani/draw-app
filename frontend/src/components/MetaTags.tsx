import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function MetaTags({
  title = "Draw It - Collaborative Drawing App",
  description = "Create beautiful drawings and collaborate in real-time with Draw It. Share your creativity with others and bring your ideas to life.",
  image = "/draw-it-full-logo.png",
  url,
  type = "website",
}: MetaTagsProps) {
  const [location] = useLocation();
  const currentUrl = url || `${window.location.origin}${location}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="author" content="Draw It" />
      <meta name="robots" content="index, follow" />

      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/android-chrome-192x192.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="512x512"
        href="/android-chrome-512x512.png"
      />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${window.location.origin}${image}`} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Draw It" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta
        name="twitter:image"
        content={`${window.location.origin}${image}`}
      />
      <meta name="twitter:site" content="@drawit" />
      <meta name="twitter:creator" content="@drawit" />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#9d00ff" />
      <meta name="msapplication-TileColor" content="#9d00ff" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
    </Helmet>
  );
}
