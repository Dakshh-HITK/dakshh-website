import { NextResponse } from "next/server";
import { getAdminBasePath } from "@/lib/admin-config";

export function GET() {
  const basePath = getAdminBasePath();
  const base = `/${basePath}`;
  const scope = `${base}/`;

  const manifest = {
    name: "Dakshh Admin",
    short_name: "Dakshh",
    description: "Admin dashboard for DAKSHH Tech Fest",
    id: base,
    start_url: base,
    scope,
    orientation: "portrait" as const,
    display: "standalone" as const,
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: `/${basePath}/icon-48x48.png`,
        sizes: "48x48",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: `/${basePath}/icon-72x72.png`,
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: `/${basePath}/icon-96x96.png`,
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: `/${basePath}/icon-128x128.png`,
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: `/${basePath}/icon-144x144.png`,
        sizes: "144x144",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: `/${basePath}/icon-152x152.png`,
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: `/${basePath}/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any",
        },
      {
        src: `/${basePath}/icon-256x256.png`,
        sizes: "256x256",
        type: "image/png",
        purpose: "maskable any",
        },
      {
        src: `/${basePath}/icon-384x384.png`,
        sizes: "384x384",
        type: "image/png",
        purpose: "maskable any",
        },
      {
        src: `/${basePath}/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any",
        },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
