"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface VolunteerEvent {
  _id: string;
  eventName: string;
  category: string;
  isFoodProvided: boolean;
  maxFoodServingsPerParticipant: number;
}

interface CheckResult {
  status: "success" | "error";
  message: string;
  attendeeName?: string;
  attendeeEmail?: string;
}

export default function VolunteerEventsScannerClient({
  events,
}: {
  events: VolunteerEvent[];
}) {
  const RESUME_SCAN_DELAY_MS = 1400;

  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const scanLockRef = useRef(false);
  const dialogOpenRef = useRef(false);

  const waitForVideoElement = useCallback(async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (videoRef.current) return videoRef.current;
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 25);
      });
    }
    return null;
  }, []);

  const stopCameraScan = useCallback(() => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    scanLockRef.current = false;
    setScanActive(false);
  }, []);

  const submitCheckIn = useCallback(async (eventId: string, qrPayload: string) => {
    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch("/api/volunteer/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          qrPayload,
          action: "entry",
        }),
      });

      const data = await response.json().catch(() => ({}));
      const ok = response.ok && !!data.allowed;

      setResult({
        status: ok ? "success" : "error",
        message: data.message ?? "Failed to check in participant.",
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail,
      });
    } catch {
      setResult({
        status: "error",
        message: "Failed to verify QR. Please retry.",
      });
    } finally {
      setProcessing(false);
    }
  }, []);

  const startCameraScan = useCallback(
    async (eventId: string, options?: { clearResult?: boolean }) => {
      setScanError(null);
      stopCameraScan();
      setActiveEventId(eventId);
      setDialogOpen(true);
      if (options?.clearResult ?? true) {
        setResult(null);
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setScanError("Camera access is not supported in this browser.");
        return;
      }

      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (options?: { formats?: string[] }) => {
            detect: (
              source: ImageBitmapSource,
            ) => Promise<Array<{ rawValue?: string }>>;
          };
        }
      ).BarcodeDetector;

      if (!BarcodeDetectorCtor) {
        setScanError(
          "QR camera scan is not supported in this browser. Use Chrome/Edge on HTTPS.",
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        streamRef.current = stream;
        setScanActive(true);

        const video = await waitForVideoElement();
        if (!video) {
          setScanError("Camera preview failed to start.");
          stopCameraScan();
          return;
        }

        video.srcObject = stream;
        await video.play();

        const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
        scanLockRef.current = false;

        scanTimerRef.current = window.setInterval(async () => {
          if (scanLockRef.current) return;

          const currentVideo = videoRef.current;
          const canvas = canvasRef.current;
          if (!currentVideo || !canvas) return;
          if (currentVideo.videoWidth === 0 || currentVideo.videoHeight === 0) return;

          canvas.width = currentVideo.videoWidth;
          canvas.height = currentVideo.videoHeight;

          const context = canvas.getContext("2d");
          if (!context) return;

          context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
          const detections = await detector.detect(canvas);
          const detectedValue = detections[0]?.rawValue?.trim();
          if (!detectedValue) return;

          scanLockRef.current = true;
          stopCameraScan();
          void submitCheckIn(eventId, detectedValue).finally(() => {
            if (!dialogOpenRef.current) return;
            resumeTimerRef.current = window.setTimeout(() => {
              void startCameraScan(eventId, { clearResult: true });
            }, RESUME_SCAN_DELAY_MS);
          });
        }, 350);
      } catch {
        setScanError("Unable to access camera. Please allow camera permission and retry.");
        stopCameraScan();
      }
    },
    [stopCameraScan, submitCheckIn, waitForVideoElement],
  );

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    dialogOpenRef.current = dialogOpen;
  }, [dialogOpen]);

  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, [stopCameraScan]);

  if (events.length === 0) {
    return <p className="text-white/70">No events available yet.</p>;
  }

  const activeEvent =
    events.find((event) => event._id === activeEventId) ?? null;

  const dialog =
    isMounted && dialogOpen && activeEvent
      ? createPortal(
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-xl border-2 border-white/20 bg-black/85 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-white text-lg font-semibold">Scan QR</h3>
                  <p className="text-white/70 text-xs mt-1">
                    {activeEvent.eventName} ({activeEvent.category})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    setResult(null);
                    setScanError(null);
                    stopCameraScan();
                  }}
                  className="text-white/70 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 rounded border border-white/20 bg-black/40 p-3">
                {scanActive && (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full max-h-72 rounded"
                      playsInline
                      muted
                    />
                    <p className="text-[11px] text-white/70 mt-2">
                      Point camera at attendee QR. Scanner will auto-resume for the next person.
                    </p>
                  </>
                )}

                {processing && (
                  <div className="flex items-center gap-2 text-cyan text-xs">
                    <span className="inline-block h-2 w-2 rounded-full bg-cyan animate-pulse" />
                    Checking in participant...
                  </div>
                )}

                {scanError && <p className="text-xs text-red-300">{scanError}</p>}

                {!processing && result && (
                  <div
                    className={`rounded border p-2 ${
                      result.status === "success"
                        ? "border-green-400/60 text-green-300"
                        : "border-red-400/60 text-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.status === "success" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m20 6-11 11-5-5" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      )}
                      <p className="text-xs font-semibold">{result.message}</p>
                    </div>
                    {(result.attendeeName || result.attendeeEmail) && (
                      <p className="text-[11px] mt-1">
                        {result.attendeeName ?? "Unknown"}{" "}
                        {result.attendeeEmail ? `(${result.attendeeEmail})` : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b-2 border-white/30">
            <th className="py-2 text-cyan font-semibold">Event</th>
            <th className="py-2 text-cyan font-semibold">Category</th>
            <th className="py-2 text-cyan font-semibold">Food</th>
            <th className="py-2 text-cyan font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isCurrentEvent = activeEventId === event._id;
            return (
              <tr key={event._id} className="border-b border-white/10 align-top">
                <td className="py-3 text-white">{event.eventName}</td>
                <td className="py-3 text-white/80">{event.category}</td>
                <td className="py-3 text-white/80">
                  {event.isFoodProvided
                    ? `Enabled (${event.maxFoodServingsPerParticipant}x per participant)`
                    : "Not provided"}
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => void startCameraScan(event._id)}
                    className="hand-drawn-button px-3 py-1 text-xs disabled:opacity-50"
                  >
                    {isCurrentEvent && dialogOpen ? "Scanner Open" : "Scan QR"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <canvas ref={canvasRef} className="hidden" />
      {dialog}
    </div>
  );
}
