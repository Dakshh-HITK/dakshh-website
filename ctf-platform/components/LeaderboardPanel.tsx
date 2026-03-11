"use client";

import React, { useEffect, useState } from "react";

interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  score: number;
  solved_count: number;
}

interface LeaderboardPanelProps {
  currentTeamId: string;
}

export default function LeaderboardPanel({ currentTeamId }: LeaderboardPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setTotalChallenges(data.totalChallenges || 0);
    } catch {
      console.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="leaderboard-panel">
      <h3>TOP TEAMS</h3>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {loading ? (
          <li className="pulse">Loading...</li>
        ) : leaderboard.length === 0 ? (
          <li>No teams yet. Be the first!</li>
        ) : (
          leaderboard.map((entry, index) => (
            <li
              key={entry.teamId}
              className={entry.teamId === currentTeamId ? "current-team" : ""}
            >
              <span>
                {index + 1}. {entry.teamName}
              </span>
              <span
                style={{
                  opacity: 0.7,
                  margin: "0 10px",
                  fontSize: "0.85rem",
                }}
              >
                [{entry.solved_count}/{totalChallenges}]
              </span>
              <span>{entry.score} pts</span>
            </li>
          ))
        )}
      </ul>
      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <a
          href="/leaderboard"
          className="back-link"
          style={{ fontSize: "0.9em" }}
        >
          [ View Full Leaderboard ]
        </a>
      </div>
    </div>
  );
}
