"use client";

import React, { useEffect, useState } from "react";

interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  score: number;
  solved_count: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadFullLeaderboard();
  }, []);

  const loadFullLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard/full");
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setTotalChallenges(data.totalChallenges || 0);
    } catch {
      console.error("Failed to load full leaderboard");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ctf-app">
      <header className="ctf-header">
        <div className="glitch-wrapper">
          <h1 className="glitch" data-text="GLOBAL LEADERBOARD">
            GLOBAL LEADERBOARD
          </h1>
        </div>
        <p className="subtitle">
          <a href="/" className="back-link">
            &lt; Back to Challenges
          </a>
        </p>
      </header>

      <main>
        <div className="intro-panel" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#fff", marginBottom: "8px" }}>
            Current Standings
          </h2>
          <p style={{ marginBottom: 0 }}>
            Top Teams across all Cyber-Quest categories.
          </p>
        </div>

        <div style={{ marginTop: "40px" }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>TEAM NAME</th>
                <th>SOLVED CHALLENGES</th>
                <th>TOTAL SCORE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: "center" }}
                    className="pulse"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: "center", color: "red" }}
                  >
                    Error connecting to server.
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    No flags submitted yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, index) => (
                  <tr key={entry.teamId}>
                    <td className="rank">#{index + 1}</td>
                    <td>{entry.teamName}</td>
                    <td>
                      {entry.solved_count} / {totalChallenges}
                    </td>
                    <td>{entry.score} pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="ctf-footer">
        <p>Developed for Cyber-Quest.</p>
      </footer>
    </div>
  );
}
