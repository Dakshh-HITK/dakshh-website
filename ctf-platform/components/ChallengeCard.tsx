"use client";

import React, { useState, useRef, FormEvent } from "react";

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || isSolved) return;

    setSubmitting(true);
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
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus(data.message);
        setStatusType("success");
        setFlag("");
        setIsSolved(true);
        onSolve();
      } else if (res.status === 429) {
        setStatus(data.error);
        setStatusType("error");
      } else {
        setStatus(data.message || data.error);
        setStatusType("error");
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

      {!isSolved ? (
        <form className="submission-area" onSubmit={handleSubmit}>
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
    </div>
  );
}
