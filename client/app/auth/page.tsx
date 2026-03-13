"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { DotOrbit } from "@paper-design/shaders-react";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "../components/Navbar";
import HandDrawnCard from "../components/HandDrawnCard";
import {
  registerSchema,
  registerStep1Schema,
  type RegisterInput,
} from "@/lib/validations/auth";

type AuthMode = "signin" | "signup" | "verify" | "forgot-password" | "reset-password";
const OTP_DEVICE_ID_KEY = "otp_device_id";

function randomCrewmate() {
  return Math.floor(Math.random() * 10) + 1;
}

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
  const message = searchParams.get("message");
  const { status } = useSession();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
  const [ejectOutcome, setEjectOutcome] = useState<"success" | "error" | null>(
    null,
  );
  const [ejectedCrewmate, setEjectedCrewmate] = useState(() =>
    message ? randomCrewmate() : 1,
  );
  const [showMessageOverlay, setShowMessageOverlay] = useState(!!message);

  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationPassword, setVerificationPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetOtp, setResetOtp] = useState("");

  const [signUpData, setSignUpData] = useState<RegisterInput>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const displayError =
    error ??
    (authError === "use_credentials"
      ? "This email is registered with Email/Password. Please sign in with credentials."
      : null);

  const ejecting = ejectOutcome !== null;
  const showingOverlay = ejecting || showMessageOverlay;

  useEffect(() => {
    if (!ejectOutcome) return;
    const t = setTimeout(() => {
      if (ejectOutcome === "error") {
        setError("Invalid email or password");
        setEjectOutcome(null);
      } else {
        window.location.assign(callbackUrl);
        return;
      }
    }, 4200);
    return () => clearTimeout(t);
  }, [ejectOutcome, callbackUrl]);

  useEffect(() => {
    if (status === "authenticated" && !ejecting) {
      window.location.replace(callbackUrl);
    }
  }, [status, ejecting, callbackUrl]);

  useEffect(() => {
    if (!showMessageOverlay || !message) return;
    const t = setTimeout(() => setShowMessageOverlay(false), 6000);
    return () => clearTimeout(t);
  }, [showMessageOverlay, message]);

  if (status !== "unauthenticated" && !ejecting) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-black">
        <div className="text-cyan text-xl">Loading...</div>
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
      setError(preCheckData.message ?? "Please verify your email with OTP.");
      return;
    }

    const result = await signIn("credentials", {
      email: signInEmail,
      password: signInPassword,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setEjectedCrewmate(randomCrewmate());
      setEjectOutcome("error");
      return;
    }

    setEjectedCrewmate(randomCrewmate());
    setEjectOutcome("success");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(signUpData);
    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors;
      const msg = Object.values(firstError).flat().filter(Boolean)[0] as string;
      setError(msg);
      return;
    }

    setLoading(true);
    const deviceId = getOrCreateDeviceId();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: signUpData.username,
        email: signUpData.email,
        password: signUpData.password,
        deviceId,
      }),
    });

    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }

    if (data.requiresVerification) {
      setMode("verify");
      setVerificationEmail(signUpData.email);
      setVerificationPassword(signUpData.password);
      setOtpCode("");
      setError(data.message ?? "OTP sent. Please verify your account.");
      return;
    }

    setMode("signin");
    setSignInEmail(signUpData.email);
    setError("Registration complete. Please sign in.");
  };

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const deviceId = getOrCreateDeviceId();

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail, deviceId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not process request");
      return;
    }

    setMode("reset-password");
    setError(data.message ?? "OTP sent. Please check your email.");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const deviceId = getOrCreateDeviceId();

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resetEmail,
        otp: resetOtp,
        newPassword,
        confirmPassword: confirmNewPassword,
        deviceId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Reset failed");
      return;
    }

    setMode("signin");
    setSignInEmail(resetEmail);
    setError(data.message ?? "Password reset successful. Please sign in.");
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleGoogleSignIn = () => {
    setError(null);
    signIn("google", { callbackUrl });
  };

  return (
    <div className="w-full min-h-screen relative" data-main-content>
      <div
        className={`transition-opacity duration-500 ${
          showingOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Navbar />
      </div>
      {(ejecting || showMessageOverlay) && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 eject-crewmate-float opacity-90"
            style={{ willChange: "transform" }}
          >
            <Image
              src={`/${ejectedCrewmate}.png`}
              alt=""
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="eject-text-in text-center w-full px-4"
              style={{
                color: ejecting
                  ? ejectOutcome === "success"
                    ? "#00ff66"
                    : "#FF4655"
                  : "#00d4ff",
                fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
                fontWeight: 700,
                textTransform: "uppercase",
                textShadow: ejecting
                  ? ejectOutcome === "success"
                    ? "0 0 20px rgba(0, 255, 102, 0.85), 0 2px 4px rgba(0,0,0,0.5)"
                    : "0 0 20px rgba(255, 70, 85, 0.8), 0 2px 4px rgba(0,0,0,0.5)"
                  : "0 0 20px rgba(0, 212, 255, 0.85), 0 2px 4px rgba(0,0,0,0.5)",
                opacity: 0,
              }}
            >
              {ejecting
                ? ejectOutcome === "success"
                  ? "YOU ARE NOT AN IMPOSTER!"
                  : "YOU ARE AN IMPOSTER!"
                : (() => {
                    try {
                      return decodeURIComponent(message ?? "").toUpperCase();
                    } catch {
                      return (message ?? "").toUpperCase();
                    }
                  })()}
            </div>
          </div>
        </div>
      )}
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
      <div
        className={`relative z-10 min-h-screen flex items-center justify-center pt-20 pb-12 px-4 transition-opacity duration-500 ${
          showingOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:block opacity-60 float">
          <Image
            src="/1.png"
            alt="Crewmate"
            width={80}
            height={80}
            className="opacity-80"
          />
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block opacity-60 float-delay-2">
          <Image
            src="/6.png"
            alt="Crewmate"
            width={80}
            height={80}
            className="opacity-80 scale-x-[-1]"
          />
        </div>
        <div className="relative max-w-md w-full mx-auto">
          <div className="absolute -right-39 top-30 hidden md:block z-99999 pointer-events-none">
            <Image
              src="/peeking.png"
              alt="Peeking Crewmate"
              width={200}
              height={200}
              className="object-contain transform"
            />
          </div>
          <div className="absolute -left-105 top-60 hidden md:block z-99999 pointer-events-none">
            <Image
              src="/peeking2.png"
              alt="Peeking Crewmate"
              width={700}
              height={700}
              className="object-contain transform"
            />
          </div>
          <HandDrawnCard className="relative z-10 px-4 py-6 sm:px-8 sm:py-10">
            <h1 className="hand-drawn-title text-white text-2xl sm:text-3xl mb-2">
              {mode === "signin"
                ? "Sign In"
                : mode === "signup"
                  ? "Create Account"
                  : mode === "verify"
                    ? "Verify OTP"
                    : mode === "forgot-password"
                      ? "Reset Password"
                      : "Set New Password"}
            </h1>
            <p className="text-cyan text-sm mb-6">
              {mode === "signin"
                ? "Welcome back, crewmate!"
                : mode === "signup"
                  ? "Join the DAKSHH crew"
                  : mode === "verify"
                    ? "Complete your onboarding mission"
                    : mode === "forgot-password"
                      ? "Enter your email to receive an OTP"
                      : "Verify OTP and set your new password"}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSignUpStep(1);
                  setOtpCode("");
                  setResetOtp("");
                }}
                className={`w-full sm:flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                  mode === "signin" || mode === "forgot-password" || mode === "reset-password"
                    ? "bg-red-500/90 text-white border-2 border-white"
                    : "bg-transparent text-white/70 border-2 border-white/40 hover:border-white/60"
                }`}
                style={
                  mode === "signin" || mode === "forgot-password" || mode === "reset-password"
                    ? { background: "rgba(255, 70, 85, 0.9)" }
                    : {}
                }
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSignUpStep(1);
                  setOtpCode("");
                  setResetOtp("");
                }}
                className={`w-full sm:flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                  mode === "signup"
                    ? "bg-red-500/90 text-white border-2 border-white"
                    : "bg-transparent text-white/70 border-2 border-white/40 hover:border-white/60"
                }`}
                style={
                  mode === "signup"
                    ? { background: "rgba(255, 70, 85, 0.9)" }
                    : {}
                }
              >
                Sign Up
              </button>
            </div>

            {displayError && !showingOverlay && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {displayError}
              </div>
            )}

            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="hand-drawn-input"
                    placeholder="crewmate@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="hand-drawn-input pr-10"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-white/70 hover:text-cyan"
                      onClick={() => setShowSignInPassword((prev) => !prev)}
                      aria-label={
                        showSignInPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showSignInPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot-password");
                        setError(null);
                        setResetEmail(signInEmail);
                      }}
                      className="text-xs text-cyan/80 hover:text-cyan transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="hand-drawn-button w-full py-3 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : mode === "signup" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (signUpStep === 1) {
                    const parsed = registerStep1Schema.safeParse({
                      username: signUpData.username,
                      email: signUpData.email,
                    });
                    if (!parsed.success) {
                      const firstError = parsed.error.flatten().fieldErrors;
                      const msg = Object.values(firstError)
                        .flat()
                        .filter(Boolean)[0] as string;
                      setError(msg);
                      return;
                    }
                    setError(null);
                    setSignUpStep(2);
                  } else {
                    handleSignUp(e);
                  }
                }}
                className="space-y-4"
              >
                {signUpStep === 1 ? (
                  <>
                    <div>
                      <label className="block text-cyan text-sm font-semibold mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={signUpData.username}
                        onChange={(e) =>
                          setSignUpData((p) => ({
                            ...p,
                            username: e.target.value,
                          }))
                        }
                        className="hand-drawn-input"
                        placeholder="crewmate123"
                        required
                        minLength={3}
                        maxLength={30}
                        autoComplete="username"
                      />
                    </div>
                    <div>
                      <label className="block text-cyan text-sm font-semibold mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={signUpData.email}
                        onChange={(e) =>
                          setSignUpData((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        className="hand-drawn-input"
                        placeholder="crewmate@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <button
                      type="submit"
                      className="hand-drawn-button w-full py-3 flex items-center justify-center"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-2 p-2 rounded-lg bg-white/5 border border-white/20 text-sm text-white/80">
                      <span className="text-cyan font-semibold">
                        {signUpData.username}
                      </span>
                      <span className="mx-1">•</span>
                      <span>{signUpData.email}</span>
                    </div>
                    <div>
                      <label className="block text-cyan text-sm font-semibold mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSignUpPassword ? "text" : "password"}
                          value={signUpData.password}
                          onChange={(e) =>
                            setSignUpData((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          className="hand-drawn-input pr-10"
                          placeholder="Min 8 characters"
                          required
                          minLength={8}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-white/70 hover:text-cyan"
                          onClick={() => setShowSignUpPassword((prev) => !prev)}
                          aria-label={
                            showSignUpPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showSignUpPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-cyan text-sm font-semibold mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={signUpData.confirmPassword}
                          onChange={(e) =>
                            setSignUpData((p) => ({
                              ...p,
                              confirmPassword: e.target.value,
                            }))
                          }
                          className="hand-drawn-input pr-10"
                          placeholder="••••••••"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-white/70 hover:text-cyan"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSignUpStep(1);
                        }}
                        className="hand-drawn-button w-full sm:flex-1 py-3 flex items-center justify-center"
                        style={{ background: "rgba(0, 0, 0, 0.7)" }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="hand-drawn-button w-full sm:flex-1 py-3 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? "Creating..." : "Create Account"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : mode === "verify" ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="mb-2 p-2 rounded-lg bg-white/5 border border-white/20 text-sm text-white/80">
                  <span className="text-cyan font-semibold">
                    {verificationEmail}
                  </span>
                </div>
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    OTP
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="hand-drawn-input"
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
                  className="hand-drawn-button w-full py-3 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || !verificationEmail}
                  className="hand-drawn-button w-full py-3 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "rgba(0, 0, 0, 0.7)" }}
                >
                  Resend OTP
                </button>
              </form>
            ) : mode === "forgot-password" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="hand-drawn-input"
                    placeholder="crewmate@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    className="hand-drawn-button w-full sm:flex-1 py-3 flex items-center justify-center"
                    style={{ background: "rgba(0, 0, 0, 0.7)" }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="hand-drawn-button w-full sm:flex-1 py-3 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="mb-2 p-2 rounded-lg bg-white/5 border border-white/20 text-sm text-white/80">
                  <p className="text-xs text-white/60 mb-1">Resetting password for:</p>
                  <span className="text-cyan font-semibold">{resetEmail}</span>
                </div>
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    OTP
                  </label>
                  <input
                    type="text"
                    value={resetOtp}
                    onChange={(e) =>
                      setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="hand-drawn-input"
                    placeholder="Enter 6-digit OTP"
                    required
                    minLength={6}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                  />
                </div>
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="hand-drawn-input"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="hand-drawn-input"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setError(null);
                    }}
                    className="hand-drawn-button w-full sm:flex-1 py-3 flex items-center justify-center"
                    style={{ background: "rgba(0, 0, 0, 0.7)" }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="hand-drawn-button w-full sm:flex-1 py-3 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}

            {mode !== "verify" && (
              <>
                <div className="relative my-6">
                  <span className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/30" />
                  </span>
                  <span className="relative flex justify-center text-sm">
                    <span className="bg-black/80 px-3 text-white/70">
                      or continue with
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="hand-drawn-button w-full py-3 flex items-center justify-center gap-2"
                  style={{ background: "rgba(0, 0, 0, 0.7)" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
              </>
            )}
          </HandDrawnCard>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-black">
          <div className="text-cyan text-xl">Loading...</div>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
