import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PGConnect — Find verified PGs",
    short_name: "PGConnect",
    description: "Search verified PGs and co-living spaces and chat with owners directly.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1b8876",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
