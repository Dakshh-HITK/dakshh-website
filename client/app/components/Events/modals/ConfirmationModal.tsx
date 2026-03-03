"use client";

import { useEffect, type MouseEvent } from "react";

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = "Ready for Launch?",
  message = "Are you sure you want to deploy as a crewmate for this mission?",
  confirmText = "Launch Mission",
  cancelText = "Abort Mission",
}: ConfirmationModalProps) => {
  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", onEscape);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md px-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-confirm-title"
      aria-describedby="register-confirm-message"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border-2 border-white/55 bg-black/35 backdrop-blur-xl p-6 sm:p-8 animate-scaleIn"
        style={{ filter: "url(#wobbly-border)" }}
      >
        <h2 id="register-confirm-title" className="hand-drawn-title text-3xl! text-white mb-3">
          {title}
        </h2>
        <p id="register-confirm-message" className="text-sm sm:text-base text-gray-300 font-mono leading-relaxed">
          {message}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 text-sm font-mono font-bold uppercase tracking-widest rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center disabled:opacity-40 transition-colors"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="hand-drawn-button flex-1 py-3 text-sm! flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-4 border-indigo-100 border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
