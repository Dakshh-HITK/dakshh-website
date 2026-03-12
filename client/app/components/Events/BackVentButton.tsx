"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const VENT_PNG = "/AmongUsVent.png";
const VENT_GIF = "/AmongUsVent.gif";
const GIF_PLAY_DURATION_MS = 2000;

interface BackVentButtonProps {
  /** When set, navigate here instead of router.back() */
  backTo?: string;
}

export default function BackVentButton({ backTo }: BackVentButtonProps = {}) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "hovering" | "clicked">("idle");
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (stage === "clicked") return;
    setStage("clicked");
    completeTimeoutRef.current = setTimeout(() => {
      if (backTo) {
        router.push(backTo);
      } else {
        router.back();
      }
    }, GIF_PLAY_DURATION_MS);
  }, [stage, router, backTo]);

  const handleMouseEnter = useCallback(() => {
    if (stage === "clicked") return;
    setStage("hovering");
  }, [stage]);

  const handleMouseLeave = useCallback(() => {
    if (stage === "clicked") return;
    setStage("idle");
  }, [stage]);

  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
    };
  }, []);

  const showGif = stage === "hovering" || stage === "clicked";

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-0 p-0 hover:opacity-90 transition-opacity"
      aria-label="Go back"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
        <img
          src={showGif ? VENT_GIF : VENT_PNG}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>
      <span className="text-md font-bold uppercase tracking-wider text-white group-hover:text-white/90 -mt-6">
        BACK
      </span>
    </button>
  );
}
