"use client";

import { useEffect, useState } from "react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";

interface SeedStatus {
  superAdminEmail: string;
  exists?: boolean;
  username?: string | null;
  verified?: boolean;
  roles?: string[];
  hasSuperAdminRole?: boolean;
  error?: string;
}

export default function AdminSeedClient() {
  const [status, setStatus] = useState<SeedStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useAmongUsToast();

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-panel/seed", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setStatus(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSeed = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin-panel/seed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to seed");
      toast.success(
        `${data.superAdminEmail ?? "Super Admin"} seeded. Roles: ${(data.roles ?? []).join(", ")}`
      );
      await fetchStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to seed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-white/70">Loading...</p>;
  }

  return (
    <HandDrawnCard className="p-4 sm:p-6 md:p-8">
      <h2 className="hand-drawn-title admin-section-title text-white mb-4">
        Super Admin Seed
      </h2>
      {status && (
        <div className="space-y-2 text-sm mb-4">
          <p className="text-white/80">
            Email: <span className="text-cyan">{status.superAdminEmail}</span>
          </p>
          <p className="text-white/80">
            Exists: {status.exists ? "Yes" : "No"}
          </p>
          {status.exists && (
            <>
              <p className="text-white/80">
                Username: {status.username ?? "—"}
              </p>
              <p className="text-white/80">
                Verified: {status.verified ? "Yes" : "No"}
              </p>
              <p className="text-white/80">
                Roles: {(status.roles ?? []).join(", ") || "—"}
              </p>
              <p className="text-white/80">
                Has Super Admin: {status.hasSuperAdminRole ? "Yes" : "No"}
              </p>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={handleSeed}
        disabled={submitting || !status?.exists}
        className="hand-drawn-button py-2 px-4 disabled:opacity-60"
      >
        {submitting ? "Seeding..." : "Run Seed"}
      </button>
      {!status?.exists && (
        <p className="text-yellow text-sm mt-2">
          Sign up with the Super Admin email in the main app first.
        </p>
      )}
    </HandDrawnCard>
  );
}
