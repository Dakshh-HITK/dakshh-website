"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { DotOrbit } from "@paper-design/shaders-react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { getAdminBasePath } from "@/lib/admin-config";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function AdminGateClient() {
  const [masterKey, setMasterKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const router = useRouter();
  const basePath = getAdminBasePath();

  useEffect(() => {
    setIsStandalone(
      typeof window !== "undefined" &&
        window.matchMedia("(display-mode: standalone)").matches
    );
    setIsIOS(
      typeof navigator !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(navigator as unknown as { MSStream?: boolean }).MSStream
    );
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin-panel/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterKey }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Invalid master key");
        setLoading(false);
        return;
      }

      router.refresh();
      router.push(`/${basePath}/dashboard`);
    } catch {
      setError("Failed to verify");
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const showInstallButton =
    !isStandalone && (deferredPrompt !== null || isIOS);

  return (
    <div className="w-full min-h-screen relative" data-main-content>
      <div className="fixed inset-0 w-full h-full z-0">
        <DotOrbit
          width="100%"
          height="100%"
          colors={["#ffffff", "#006aff", "#fff675"]}
          colorBack="#000000"
          stepsPerColor={4}
          size={0.2}
          sizeRange={0.5}
          spreading={1}
          speed={0.5}
          scale={0.35}
        />
      </div>
      <div className="relative z-10 min-h-screen flex items-center justify-center pt-20 pb-12 px-4">
        <div className="max-w-md w-full mx-auto">
          <HandDrawnCard className="px-6 py-8 sm:px-8 sm:py-10">
            <h1 className="hand-drawn-title text-white text-2xl sm:text-3xl mb-2">
              Admin Access
            </h1>
            <p className="text-cyan text-sm mb-6">
              Enter the master key to continue.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="masterKey"
                  className="block text-cyan text-sm font-semibold mb-1"
                >
                  Master Key
                </label>
                <input
                  id="masterKey"
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="hand-drawn-input w-full"
                  placeholder="Enter master key"
                  required
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="hand-drawn-button w-full py-3 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Continue"}
              </button>
            </form>

            <p className="text-white/60 text-sm mt-6 text-center">
              Team member?{" "}
              <Link
                href={`/${basePath}/login`}
                className="text-cyan hover:text-cyan/80 underline"
              >
                Login here
              </Link>
            </p>

            {showInstallButton && (
              <div className="mt-6 pt-6 border-t border-white/20">
                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstall}
                    className="hand-drawn-button w-full py-3 flex items-center justify-center gap-2"
                    style={{ background: "rgba(0, 200, 200, 0.2)" }}
                  >
                    <Download className="w-5 h-5" />
                    Install app
                  </button>
                ) : (
                  <p className="text-cyan/90 text-sm text-center">
                    To install: tap Share{" "}
                    <span className="inline-block" aria-hidden>
                      ⎋
                    </span>{" "}
                    then &quot;Add to Home Screen&quot;{" "}
                    <span className="inline-block" aria-hidden>
                      ➕
                    </span>
                  </p>
                )}
              </div>
            )}
          </HandDrawnCard>
        </div>
      </div>
    </div>
  );
}
