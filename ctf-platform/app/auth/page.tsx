"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  registerSchema,
  registerStep1Schema,
  type RegisterInput,
} from "@/lib/validations/auth";

type AuthMode = "signin" | "verify";
const OTP_DEVICE_ID_KEY = "otp_device_id";

function createFallbackDeviceId() {
  return `${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";
  const existing = window.sessionStorage.getItem(OTP_DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID().replace(/-/g, "_")
      : createFallbackDeviceId();

  window.sessionStorage.setItem(OTP_DEVICE_ID_KEY, generated);
  return generated;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl !== "/auth" ? rawCallbackUrl : "/";
  const authError = searchParams.get("error");
  const { status } = useSession();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSignInPassword, setShowSignInPassword] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationPassword, setVerificationPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const displayError =
    error ??
    (authError === "use_credentials"
      ? "This email is registered with Email/Password. Please sign in with credentials."
      : null);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace(callbackUrl);
    }
  }, [status, callbackUrl]);

  if (status !== "unauthenticated") {
    return (
      <div className="ctf-app" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--primary-color)", fontSize: "1.2rem", fontFamily: "'Fira Code', monospace" }} className="pulse">
          Loading...
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const deviceId = getOrCreateDeviceId();

    const preCheckRes = await fetch("/api/auth/signin-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: signInEmail,
        password: signInPassword,
        deviceId,
      }),
    });
    const preCheckData = await preCheckRes.json().catch(() => ({}));

    if (!preCheckRes.ok) {
      setLoading(false);
      setError(preCheckData.error ?? "Invalid email or password");
      return;
    }

    if (preCheckData.requiresVerification) {
      setLoading(false);
      setMode("verify");
      setVerificationEmail(signInEmail);
      setVerificationPassword(signInPassword);
      setError(
        preCheckData.message ?? "Please verify your email with OTP."
      );
      return;
    }

    const result = await signIn("credentials", {
      email: signInEmail,
      password: signInPassword,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    window.location.assign(callbackUrl);
  };

  // Sign-up handler preserved but disabled (signup UI removed)
  // const handleSignUp = async (e: React.FormEvent) => { ... };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const deviceId = getOrCreateDeviceId();

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: verificationEmail,
        otp: otpCode,
        deviceId,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "OTP verification failed");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: verificationEmail,
      password: verificationPassword,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setMode("signin");
      setSignInEmail(verificationEmail);
      setError("Email verified. Please sign in.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleResendOtp = async () => {
    if (!verificationEmail) return;

    setLoading(true);
    const deviceId = getOrCreateDeviceId();
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: verificationEmail, deviceId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not resend OTP");
      return;
    }

    setError("A fresh OTP has been sent to your email.");
  };

  const handleGoogleSignIn = () => {
    setError(null);
    signIn("google", { callbackUrl });
  };

  return (
    <div className="ctf-app">
      <header className="ctf-header">
        <div className="glitch-wrapper">
          <h1 className="glitch" data-text="Cyber-Quest">
            Cyber-Quest
          </h1>
        </div>
        <p className="subtitle">Authentication Required</p>
      </header>

      <main>
        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">
              {mode === "signin" ? "Sign In" : "Verify OTP"}
            </h2>
            <p className="auth-subtitle">
              {mode === "signin"
                ? "Welcome back, crewmate!"
                : "Complete your onboarding mission"}
            </p>



            {/* Error display */}
            {displayError && (
              <div className="auth-error">{displayError}</div>
            )}

            {/* Sign In Form */}
            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="auth-form">
                <div className="auth-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="auth-input"
                    placeholder="crewmate@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <div className="auth-password-wrapper">
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="auth-input"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowSignInPassword((p) => !p)}
                    >
                      {showSignInPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="access-btn auth-submit"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              /* OTP Form */
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="auth-info-badge">
                  <span style={{ color: "var(--primary-color)", fontWeight: 600 }}>
                    {verificationEmail}
                  </span>
                </div>
                <div className="auth-field">
                  <label>OTP</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="auth-input"
                    placeholder="Enter 6-digit OTP"
                    required
                    minLength={6}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="access-btn auth-submit"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || !verificationEmail}
                  className="access-btn auth-submit"
                  style={{ background: "#222", marginTop: "8px" }}
                >
                  Resend OTP
                </button>
              </form>
            )}

            {/* Google Sign In divider */}
            {mode !== "verify" && (
              <>
                <div className="auth-divider">
                  <span className="auth-divider-line" />
                  <span className="auth-divider-text">or continue with</span>
                  <span className="auth-divider-line" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="access-btn auth-google-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: "8px" }}>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="ctf-footer">
        <p>Developed for Cyber-Quest.</p>
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="ctf-app" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "var(--primary-color)", fontSize: "1.2rem", fontFamily: "'Fira Code', monospace" }} className="pulse">
            Loading...
          </div>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
