"use client";

import React, { useState, useRef, FormEvent } from "react";
import PenaltyModal from "./PenaltyModal";

interface ChallengeProps {
  challenge: {
    _id: string;
    challengeId: number;
    title: string;
    category: string;
    difficulty: string;
    points: number;
    description: string;
    placeholder: string;
    section: string;
    sectionColor: string;
  };
  teamId: string;
  teamName: string;
  userId: string;
  solved: boolean;
  csrfToken: string;
  onSolve: () => void;
}

export default function ChallengeCard({
  challenge,
  teamId,
  teamName,
  userId,
  solved,
  csrfToken,
  onSolve,
}: ChallengeProps) {
  const [flag, setFlag] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [isSolved, setIsSolved] = useState(solved);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyCost, setPenaltyCost] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 255, 65, 0.05) 0%, var(--bg-secondary) 50%)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.background = "var(--bg-secondary)";
  };

  const handleSubmit = async (e?: FormEvent, payPenalty: boolean = false) => {
    if (e) e.preventDefault();
    if (!flag.trim() || isSolved) return;

    setSubmitting(true);
    setStatus("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          teamId,
          teamName,
          userId,
          challengeId: challenge.challengeId,
          flag: flag.trim(),
          payPenalty,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus(data.message);
        setStatusType("success");
        setFlag("");
        setIsSolved(true);
        setShowPenaltyModal(false);
        onSolve(); // Refresh scoreboard
      } else if (data.requiresPenalty) {
        setPenaltyCost(data.penaltyCost);
        setShowPenaltyModal(true);
      } else {
        setStatus(data.message || data.error);
        setStatusType("error");
        setShowPenaltyModal(false);
        // If it was a penalty attempt that failed, we still want to refresh the leaderboard
        if (payPenalty) {
          onSolve();
        }
      }
    } catch {
      setStatus("Network Error.");
      setStatusType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const difficultyLabel =
    challenge.difficulty === "ez-med" ? "Easy-Medium" : challenge.difficulty;

  const penaltyRuleText = challenge.difficulty === "hard"
    ? "⚠️ Penalty Rule: 10 failed attempts are free. Every subsequent attempt costs 100 points."
    : "⚠️ Penalty Rule: 10 failed attempts are free. Every subsequent attempt costs 50 points.";

  return (
    <div
      ref={cardRef}
      className={`challenge-card ${isSolved ? "solved" : ""}`}
      style={{ borderTop: `4px solid ${challenge.sectionColor}` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {isSolved && (
        <div className="solved-badge">
          ✓ SOLVED
        </div>
      )}
      <div className="card-header">
        <span
          className={`difficulty ${challenge.difficulty}`}
          style={
            challenge.section !== "web" && challenge.section !== "intro"
              ? {
                  color: challenge.sectionColor,
                  borderColor: challenge.sectionColor,
                }
              : undefined
          }
        >
          {difficultyLabel}
        </span>
        <span className="points">{challenge.points} pts</span>
      </div>
      <h3>{challenge.title}</h3>
      <p className="category" style={{ color: challenge.sectionColor }}>
        {challenge.category}
      </p>
      <p className="desc">{challenge.description}</p>
      <div className="penalty-warning">
        {penaltyRuleText}
      </div>

      {!isSolved ? (
        <form className="submission-area" onSubmit={(e) => handleSubmit(e)}>
          <input
            type="text"
            className="flag-input"
            placeholder={challenge.placeholder}
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            disabled={submitting}
          />
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
          {status && (
            <div className={`status-msg ${statusType}`}>{status}</div>
          )}
        </form>
      ) : (
        <div className="status-msg success" style={{ marginTop: "12px" }}>
          ✓ Flag captured by your team!
        </div>
      )}

      <PenaltyModal
        isOpen={showPenaltyModal}
        penaltyCost={penaltyCost}
        onConfirm={() => handleSubmit(undefined, true)}
        onCancel={() => {
          setShowPenaltyModal(false);
          setSubmitting(false);
        }}
      />

      <style jsx>{`
        .penalty-warning {
          font-size: 0.75rem;
          color: var(--accent-color);
          margin-bottom: 15px;
          font-family: "Fira Code", monospace;
          opacity: 0.8;
          border-left: 2px solid var(--accent-color);
          padding-left: 8px;
        }
      `}</style>
    </div>
  );
}
