"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownTimerProps {
  targetDate: Date;
  eventEndDate?: Date;
  title?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(d: Date): TimeLeft {
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function isOver(d: Date) {
  return d.getTime() - Date.now() <= 0;
}

// ── Live view — no box, just ambient text + mini countdown ────────────────────
function LiveView({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(endDate));

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(t);
  }, [endDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex flex-col items-center gap-3"
    >
      {/* Live pill */}
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full bg-green-400 inline-block"
          style={{ boxShadow: "0 0 8px #4ade80" }}
        />
        <span
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Crew Status: ACTIVE
        </span>
      </div>

      {/* "DAKSHH ends in" label */}
      <p
        className="text-sm sm:text-base font-medium"
        style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}
      >
        DON'T BE SUS. JOIN NOW!!
      </p>

      {/* Mini digit row — no box, just glowing numbers */}
      <div className="flex items-baseline gap-1 sm:gap-2">
        {[
          { value: timeLeft.days,    label: "d" },
          { value: timeLeft.hours,   label: "h" },
          { value: timeLeft.minutes, label: "m" },
          { value: timeLeft.seconds, label: "s" },
        ].map(({ value, label }, i) => (
          <span key={i} className="flex items-baseline gap-0.5">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={value}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-xl sm:text-2xl md:text-3xl font-bold tabular-nums"
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  color: "#ffffff",
                  textShadow: "0 0 14px rgba(255,255,255,0.25)",
                }}
              >
                {value.toString().padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
            <span
              className="text-xs sm:text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {label}
            </span>
            {i < 3 && (
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-sm sm:text-base font-light mx-0.5"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                :
              </motion.span>
            )}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Thank-you view ────────────────────────────────────────────────────────────
function ThankYouView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center py-4"
    >
      <p
        className="text-sm uppercase tracking-[0.25em] font-medium mb-3"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        Heritage Institute of Technology · 2026
      </p>

      <h3
        className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          background: "linear-gradient(90deg, #FFD700, #ffffff, #00CED1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Thank you for joining us
      </h3>

      <motion.p
        className="text-lg sm:text-xl md:text-2xl font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        at <span style={{ color: "#FFD700" }}>DAKSHH&apos;26</span>
      </motion.p>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        className="h-px w-32 mx-auto mt-5"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)",
        }}
      />
    </motion.div>
  );
}

// ── Pre-event countdown digit ─────────────────────────────────────────────────
function TimeUnit({
  value,
  label,
  showColonAfter,
}: {
  value: number;
  label: string;
  showColonAfter?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6"
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="bg-black/80 border-2 border-red rounded-lg px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 min-w-[3.5rem] sm:min-w-20 md:min-w-[5.5rem] lg:min-w-25">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={value}
                initial={{ y: -14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 14, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white block text-center hand-drawn-title tabular-nums"
                style={{
                  textShadow:
                    "0 0 10px rgba(255,70,85,0.8), 0 0 20px rgba(255,70,85,0.5)",
                  fontWeight: 900,
                }}
              >
                {value.toString().padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan" />
        </div>
        <span className="text-xs sm:text-sm md:text-base text-cyan mt-2 uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      {showColonAfter && (
        <span
          className="text-red text-2xl sm:text-3xl md:text-4xl font-bold self-start pt-5 sm:pt-6 md:pt-7"
          style={{ textShadow: "0 0 10px rgba(255,70,85,0.6)" }}
        >
          :
        </span>
      )}
    </motion.div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function CountdownTimer({
  targetDate,
  eventEndDate,
  title = "MISSION STARTS IN",
}: CountdownTimerProps) {
  const effectiveEndDate = eventEndDate ?? new Date("2026-03-14T21:00:00");

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));
  const [started, setStarted] = useState(isOver(targetDate));
  const [ended, setEnded] = useState(isOver(effectiveEndDate));

  useEffect(() => {
    if (isOver(targetDate)) {
      setStarted(true);
      if (isOver(effectiveEndDate)) setEnded(true);
      return;
    }
    const timer = setInterval(() => {
      if (isOver(targetDate)) {
        setStarted(true);
        clearInterval(timer);
        return;
      }
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, effectiveEndDate]);

  if (ended)   return <ThankYouView />;
  if (started) return <LiveView endDate={effectiveEndDate} />;

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6 md:mb-8"
      >
        <div className="inline-flex items-center gap-2 sm:gap-3">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-2xl sm:text-3xl md:text-4xl"
          >
            🚨
          </motion.span>
          <h3
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red uppercase tracking-wider"
            style={{
              textShadow:
                "0 0 15px rgba(255,70,85,0.7), 0 0 30px rgba(255,70,85,0.4)",
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          >
            {title}
          </h3>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl"
          >
            🚨
          </motion.span>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center items-start gap-2 sm:gap-3 md:gap-4 lg:gap-6"
      >
        <TimeUnit value={timeLeft.days}    label="Days"  showColonAfter />
        <TimeUnit value={timeLeft.hours}   label="Hours" showColonAfter />
        <TimeUnit value={timeLeft.minutes} label="Mins"  showColonAfter />
        <TimeUnit value={timeLeft.seconds} label="Secs"  />
      </motion.div>
    </div>
  );
}