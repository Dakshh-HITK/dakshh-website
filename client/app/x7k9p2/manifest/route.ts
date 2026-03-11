import { NextResponse } from "next/server";
import { getAdminBasePath } from "@/lib/admin-config";

export function GET() {
  const basePath = getAdminBasePath();
  const base = `/${basePath}`;
  const scope = `${base}/`;

  const manifest = {
    name: "DAKSHH Admin Dashboard",
    short_name: "Admin",
    description: "Admin dashboard for DAKSHH Tech Fest",
    id: base,
    start_url: base,
    scope,
    display: "standalone" as const,
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: `/${basePath}/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/${basePath}/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
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
