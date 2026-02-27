"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DotOrbit } from "@paper-design/shaders-react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { getAdminBasePath } from "@/lib/admin-config";
import { Eye, EyeOff } from "lucide-react";

const OTP_DEVICE_ID_KEY = "admin_otp_device_id";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  const existing = sessionStorage.getItem(OTP_DEVICE_ID_KEY);
  if (existing) return existing;
  const generated =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID().replace(/-/g, "_")
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  sessionStorage.setItem(OTP_DEVICE_ID_KEY, generated);
  return generated;
}

export default function AdminLoginClient() {
  const [step, setStep] = useState<"email" | "password" | "setup" | "otp">(
    "email"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const basePath = getAdminBasePath();

  const checkUser = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-panel/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed");
        setLoading(false);
        return;
      }
      if (data.needsSetup) {
        setNeedsSetup(true);
        setStep("setup");
      } else {
        setStep("password");
      }
    } catch {
      setError("Failed to check user");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const deviceId = getOrCreateDeviceId();
    try {
      const res = await fetch("/api/admin-panel/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed");
        setLoading(false);
        return;
      }
      setStep("otp");
    } catch {
      setError("Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const deviceId = getOrCreateDeviceId();
    try {
      const res = await fetch("/api/admin-panel/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: password || undefined, deviceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send OTP");
        setLoading(false);
        return;
      }
      setStep("otp");
    } catch {
      setError("Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (needsSetup && !password) {
      setStep("setup");
      return;
    }
    setError(null);
    setLoading(true);
    const deviceId = getOrCreateDeviceId();
    try {
      const res = await fetch("/api/admin-panel/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to resend");
      }
    } catch {
      setError("Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const deviceId = getOrCreateDeviceId();
    try {
      const res = await fetch("/api/admin-panel/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, deviceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Invalid OTP");
        setLoading(false);
        return;
      }
      router.refresh();
      router.push(`/${basePath}/dashboard`);
    } catch {
      setError("Failed");
    } finally {
      setLoading(false);
    }
  };

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
              {step === "email"
                ? "Team Login"
                : step === "setup"
                  ? "Set Password"
                  : step === "otp"
                    ? "Verify OTP"
                    : "Sign In"}
            </h1>
            <p className="text-cyan text-sm mb-6">
              {step === "email"
                ? "Enter your admin email."
                : step === "setup"
                  ? "Create a password for your account."
                  : step === "otp"
                    ? "Enter the 6-digit code sent to your email."
                    : "Enter your password."}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            {step === "email" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  checkUser();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hand-drawn-input w-full"
                    placeholder="admin@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="hand-drawn-button w-full py-3 disabled:opacity-60"
                >
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="mb-2 p-2 rounded-lg bg-white/5 border border-white/20 text-sm text-white/80">
                  {email}
                </div>
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="hand-drawn-input w-full pr-10"
                      placeholder="password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-cyan transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="hand-drawn-button w-full py-3 disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full py-2 text-white/70 text-sm hover:text-white"
                >
                  Back
                </button>
              </form>
            )}

            {step === "setup" && (
              <form onSubmit={handleSetupPassword} className="space-y-4">
                <div className="mb-2 p-2 rounded-lg bg-white/5 border border-white/20 text-sm text-white/80">
                  {email}
                </div>
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="hand-drawn-input w-full pr-10"
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-cyan transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="hand-drawn-button w-full py-3 disabled:opacity-60"
                >
                  {loading ? "Setting up..." : "Set Password & Send OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full py-2 text-white/70 text-sm hover:text-white"
                >
                  Back
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="mb-2 p-2 rounded-lg bg-white/5 border border-white/20 text-sm text-white/80">
                  {email}
                </div>
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="hand-drawn-input w-full"
                    placeholder="000000"
                    required
                    minLength={6}
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="hand-drawn-button w-full py-3 disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify"}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full py-2 text-white/70 text-sm hover:text-white disabled:opacity-60"
                >
                  Resend OTP
                </button>
              </form>
            )}
          </HandDrawnCard>
        </div>
      </div>
    </div>
  );
}
