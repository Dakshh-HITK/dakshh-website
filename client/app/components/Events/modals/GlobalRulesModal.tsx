"use client";

import { useEffect, useRef, useState } from "react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { CheckCircle2 } from "lucide-react";
import { EVENT_REGISTRATION_RULES } from "@/constants/global_rules";
import { EventRegistrationStep } from "@/types/interface";

type GlobalRulesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GlobalRulesModal({
  isOpen,
  onClose,
}: GlobalRulesModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Lock body scroll when open; reset state on close
  useEffect(() => {
    if (!isOpen) {
      setHasScrolledToEnd(false);
      setIsChecked(false);
      return;
    }
    document.body.style.overflow = "hidden";

    // Check immediately in case content is short enough to not need scrolling
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 20) {
      setHasScrolledToEnd(true);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= 20) {
      setHasScrolledToEnd(true);
    }
  };

  if (!isOpen) return null;

  const canConfirm = hasScrolledToEnd && isChecked;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 sm:px-6 pt-22 pb-6 sm:pb-8">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={canConfirm ? onClose : undefined}
      />

      <div className="relative w-full max-w-3xl z-10 animate-scaleIn">
        <HandDrawnCard className="flex flex-col max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-120px)] overflow-hidden bg-zinc-900/95 border-2 border-white/30 rounded-2xl shadow-[0_0_30px_rgba(255,70,85,0.25)]">

          {/* Header */}
          <div
            className="px-4 sm:px-8 pt-5 pb-4 border-b border-white/20 text-center shrink-0"
            style={{
              background: "rgba(255, 70, 85, 0.75)",
              boxShadow: "0 4px 24px rgba(255, 70, 85, 0.4)",
            }}
          >
            <h2 className="text-lg! md:text-xl! mb-0! font-bold text-white uppercase tracking-widest leading-snug">
              Event Registration Rules
            </h2>
          </div>

          {/* Scrollable Body */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 sm:px-6 pt-5 pb-4 space-y-4 sm:space-y-6"
          >
            {EVENT_REGISTRATION_RULES.map((section: EventRegistrationStep) => (
              <div
                key={section.step}
                className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4 hover:border-[#FF4655]/40 transition-all duration-200"
              >
                {/* Step Header */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white text-sm font-bold shrink-0"
                    style={{
                      background: "#FF4655",
                      boxShadow: "0 0 10px rgba(255,70,85,0.6)",
                    }}
                  >
                    {section.step}
                  </div>

                  <h3 className="text-sm! sm:text-base! md:text-lg! font-semibold text-white uppercase tracking-wide leading-tight text-left!">
                    {section.title}
                  </h3>
                </div>

                {/* NORMAL RULES */}
                {section.rules && (
                  <ul className="space-y-2 sm:space-y-3 pl-1">
                    {section.rules.map((rule: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 sm:gap-3 text-gray-300 text-xs sm:text-sm leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* CONDITIONS HANDLER */}
                {section.conditions && (
                  <div className="space-y-3 sm:space-y-4">

                    {/* TEAM ONLY */}
                    {section.conditions.type === "team" && (
                      <>
                        <ConditionBlock
                          title="Team Creation Process"
                          rules={section.conditions.team_creation}
                        />

                        <ConditionBlock
                          title="Team Joining Process"
                          rules={section.conditions.team_joining}
                        />
                      </>
                    )}

                    {/* COMMON PAID / UNPAID */}
                    <ConditionBlock
                      title="Unpaid Registration Flow"
                      rules={section.conditions.unpaid.rules}
                    />

                    <ConditionBlock
                      title="Paid Registration Flow"
                      rules={section.conditions.paid.rules}
                    />

                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="relative px-4 sm:px-6 py-5 sm:py-6 border-t border-white/20 bg-black/50 flex flex-col items-center gap-4 shrink-0">

            {/* 🔒 Scroll-blocking overlay */}
            <div
              className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-sm bg-black/60 transition-all duration-500 rounded-b-2xl
                ${hasScrolledToEnd ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
            >
              <svg className="w-5 h-5 text-white/50 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <p className="text-xs text-white/50 font-medium tracking-wide">
                Scroll to the end to unlock
              </p>
            </div>

            {/* Checkbox — visible once scrolled to end */}
            {hasScrolledToEnd && (
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div className="relative w-5 h-5 shrink-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded border-2 border-white/30 bg-white/5 peer-checked:bg-[#FF4655] peer-checked:border-[#FF4655] transition-all duration-200 group-hover:border-[#FF4655]/60 flex items-center justify-center">
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-gray-300 group-hover:text-white transition-colors">
                  I have read and understood all the registration rules.
                </span>
              </label>
            )}

            {/* Button */}
            <button
              onClick={canConfirm ? onClose : undefined}
              disabled={!canConfirm}
              className={`w-full sm:w-auto px-8 sm:px-12 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-widest border rounded-lg transition-all duration-300
                ${canConfirm
                  ? "bg-[#FF4655] hover:bg-[#ff5e6c] border-[#FF4655]/60 text-white cursor-pointer hover:shadow-[0_0_20px_rgba(255,70,85,0.5)]"
                  : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
                }`}
            >
              I Understand
            </button>
          </div>

        </HandDrawnCard>
      </div>
    </div>
  );
}




/* 🔥 REUSABLE CONDITION BLOCK */
function ConditionBlock({
  title,
  rules,
}: {
  title: string;
  rules: string[];
}) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
      <h4 className="text-xs sm:text-sm font-semibold text-[#FF4655] uppercase tracking-wider">
        {title}
      </h4>

      <ul className="space-y-1.5 sm:space-y-2">
        {rules.map((rule, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 sm:gap-3 text-gray-300 text-xs sm:text-sm leading-relaxed"
          >
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0 mt-0.5" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}