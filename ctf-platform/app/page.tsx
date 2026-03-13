"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChallengeCard from "@/components/ChallengeCard";
import LeaderboardPanel from "@/components/LeaderboardPanel";

interface ChallengeFromDB {
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
}

interface SectionFromDB {
  _id: string;
  key: string;
  title: string;
  subtitle: string;
  color: string;
  order: number;
}

interface TeamInfo {
  teamId: string;
  teamName: string;
  isSolo: boolean;
  members: { id: string; username: string }[] | string[];
}

type GateState = "loading" | "checking" | "denied" | "allowed";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [gateState, setGateState] = useState<GateState>("loading");
  const [gateMessage, setGateMessage] = useState("");
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Data from DB
  const [challenges, setChallenges] = useState<ChallengeFromDB[]>([]);
  const [sections, setSections] = useState<SectionFromDB[]>([]);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Once authenticated, check registration & get team
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    setGateState("checking");

    const initSession = async () => {
      try {
        // 1. Check registration
        const regRes = await fetch(
          `/api/check-registration?userId=${encodeURIComponent(session.user.id)}`
        );
        const regData = await regRes.json();

        if (!regData.registered) {
          setGateState("denied");
          setGateMessage(
            regData.message || "You are not registered for Cyber Quest."
          );
          return;
        }

        // 2. Get team info
        const teamRes = await fetch(
          `/api/my-team?userId=${encodeURIComponent(session.user.id)}`
        );
        const teamData = await teamRes.json();

        if (teamRes.ok) {
          setTeamInfo(teamData);

          // 3. Fetch challenges from DB
          const challengeRes = await fetch(
            `/api/challenges?teamId=${encodeURIComponent(teamData.teamId)}`
          );
          const challengeData = await challengeRes.json();

          setChallenges(challengeData.challenges || []);
          setSections(challengeData.sections || []);
          setSolvedIds(challengeData.solvedChallengeIds || []);

          // 4. Fetch CSRF token
          const csrfRes = await fetch(
            `/api/csrf-token?teamName=${encodeURIComponent(teamData.teamName)}`
          );
          const csrfData = await csrfRes.json();
          if (csrfData.csrfToken) {
            setCsrfToken(csrfData.csrfToken);
          }

          setGateState("allowed");
        } else {
          setGateState("denied");
          setGateMessage(teamData.error || "Failed to fetch team info.");
        }
      } catch {
        setGateState("denied");
        setGateMessage("Failed to verify registration. Please try again.");
      }
    };

    initSession();
  }, [status, session]);

  const handleSolve = useCallback(() => {
    setRefreshKey((k) => k + 1);
    // Re-fetch solved state
    if (teamInfo) {
      fetch(`/api/challenges?teamId=${encodeURIComponent(teamInfo.teamId)}`)
        .then((res) => res.json())
        .then((data) => {
          setSolvedIds(data.solvedChallengeIds || []);
        })
        .catch(() => {});
    }
  }, [teamInfo]);

  const getSectionChallenges = (sectionKey: string) => {
    return challenges.filter((c) => c.section === sectionKey);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth" });
  };

  // Loading state
  if (
    status === "loading" ||
    gateState === "loading" ||
    gateState === "checking"
  ) {
    return (
      <div className="ctf-app">
        <header className="ctf-header">
          <div className="glitch-wrapper">
            <h1 className="glitch" data-text="Cyber-Quest">
              Cyber-Quest
            </h1>
          </div>
          <p className="subtitle">Complete All Challenges to Win</p>
        </header>
        <main>
          <div className="gate-container">
            <div
              style={{
                color: "var(--primary-color)",
                fontSize: "1.2rem",
                fontFamily: "'Fira Code', monospace",
              }}
              className="pulse"
            >
              {gateState === "checking"
                ? "Verifying registration..."
                : "Loading..."}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not registered — denied
  if (gateState === "denied") {
    return (
      <div className="ctf-app">
        <header className="ctf-header">
          <div className="glitch-wrapper">
            <h1 className="glitch" data-text="ACCESS DENIED">
              ACCESS DENIED
            </h1>
          </div>
        </header>
        <main>
          <div className="gate-container">
            <div className="gate-error">⚠ ACCESS DENIED ⚠</div>
            <p className="gate-message">{gateMessage}</p>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginBottom: "20px",
              }}
            >
              Signed in as{" "}
              <span style={{ color: "var(--primary-color)" }}>
                {session?.user?.email}
              </span>
            </p>
            <div
              style={{
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button onClick={handleSignOut} className="gate-btn">
                Sign Out
              </button>
            </div>
          </div>
        </main>
        <footer className="ctf-footer">
          <p>Developed for Cyber-Quest.</p>
        </footer>
      </div>
    );
  }

  // Authenticated & registered — show dashboard
  return (
    <div className="ctf-app">
      <header className="ctf-header">
        <div className="glitch-wrapper">
          <h1 className="glitch" data-text="Cyber-Quest">
            Cyber-Quest
          </h1>
        </div>
        <p className="subtitle">Complete All Challenges to Win</p>
        <div style={{ marginTop: "12px" }}>
          <button
            onClick={handleSignOut}
            style={{
              background: "transparent",
              border: "1px solid #444",
              color: "var(--text-secondary)",
              fontFamily: "'Fira Code', monospace",
              fontSize: "0.8rem",
              padding: "6px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-color)";
              e.currentTarget.style.color = "var(--accent-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#444";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main>
        {/* Top dashboard: welcome + leaderboard */}
        <div className="dashboard-top">
          <div className="intro-panel" style={{ flex: 2, marginBottom: 0 }}>
            <h3>
              {teamInfo?.isSolo ? "Welcome, " : "Team: "}
              <span style={{ color: "var(--primary-color)" }}>
                {teamInfo?.teamName}
              </span>
            </h3>
            {!teamInfo?.isSolo && (
              <p style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: "8px" }}>
                Members:{" "}
                {(teamInfo?.members || [])
                  .map((m) =>
                    typeof m === "string" ? m : m.username
                  )
                  .join(", ")}
              </p>
            )}
            <p>
              Choose your category, download the files, investigate, and submit
              your flags. All team members share the same progress.
            </p>
            <p className="flag-format">
              Flag Formats can be: <code>DAKSHH&#123;...&#125;</code> or{" "}
              <code>dakshh&#123;...&#125;</code> depending on the challenge
              instructions.
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--primary-color)",
                marginTop: "10px",
              }}
            >
              Solved: {solvedIds.length} / {challenges.length}
            </p>
          </div>

          <LeaderboardPanel
            key={refreshKey}
            currentTeamId={teamInfo?.teamId || ""}
          />
        </div>

        {/* Challenge sections from DB */}
        {sections.map((section) => {
          const sectionChallenges = getSectionChallenges(section.key);

          return (
            <div key={section.key}>
              <div className="section-header">
                <h2 style={{ color: section.color }}>{section.title}</h2>
                <p>{section.subtitle}</p>
              </div>
              {sectionChallenges.length > 0 ? (
                <div className="challenges-grid">
                  {sectionChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.challengeId}
                      challenge={challenge}
                      teamId={teamInfo?.teamId || ""}
                      teamName={teamInfo?.teamName || ""}
                      userId={session?.user?.id || ""}
                      solved={solvedIds.includes(challenge.challengeId)}
                      csrfToken={csrfToken}
                      onSolve={handleSolve}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ margin: "20px 0", color: "var(--text-secondary)", fontStyle: "italic", opacity: 0.8 }}>
                  No challenges are currently active in this category.
                </div>
              )}
            </div>
          );
        })}

        {challenges.length === 0 && (
          <div className="gate-container">
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
              No challenges loaded yet. An admin needs to populate the database.
            </p>
          </div>
        )}
      </main>

      <footer className="ctf-footer">
        <p>Developed for Cyber-Quest.</p>
      </footer>
    </div>
  );
}
