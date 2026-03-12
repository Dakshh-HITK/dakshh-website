"use client";

import { useEffect } from "react";

interface AdminPWAProviderProps {
  basePath: string;
}

export default function AdminPWAProvider({ basePath }: AdminPWAProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const swPath = `/${basePath}/sw.js`;
    const scope = `/${basePath}/`;

    navigator.serviceWorker
      .register(swPath, { scope, updateViaCache: "none" })
      .catch(() => {
        // SW registration fails if not under scope; ignore
      });
  }, [basePath]);

  return null;
}
