"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { DotOrbit } from "@paper-design/shaders-react";
import Navbar from "@/app/components/Navbar";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import toast from "react-hot-toast";
import { ROBO_DANGAL_HARDCODED } from "@/constants/roboDangalResults";

interface MinigamePlayer {
  username?: string;
  fullName?: string;
  amongUsScore: number;
  avatar?: number;
}

interface ResultParticipant {
  name: string;
  userId?: string;
}

interface ResultEntry {
  _id: string;
  position: "winner" | "runner_up" | "second_runner_up" | "honorable_mention";
  positionLabel?: string;
  rank: number;
  teamName?: string;
  participants: ResultParticipant[];
  note?: string;
}

interface EventResult {
  eventId: string;
  eventName: string;
  eventBanner?: string | null;
  eventCategory?: string | null;
  eventPrizePool?: string | null;
  entries: ResultEntry[];
  publishedAt?: string | null;
  _isRoboDangalHardcoded?: boolean;
}

const POSITION_ORDER = [
  "winner",
  "runner_up",
  "second_runner_up",
  "honorable_mention",
] as const;

const POSITION_CONFIG = {
  winner: {
    label: "Winner",
    emoji: "🏆",
    color: "from-yellow-500/20 to-yellow-400/5",
    border: "border-yellow-400",
    badge: "bg-yellow-400 text-black",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/30",
    isWinner: true,
  },
  runner_up: {
    label: "Runner Up",
    emoji: "🥈",
    color: "from-slate-400/20 to-slate-300/5",
    border: "border-slate-300",
    badge: "bg-slate-300 text-black",
    text: "text-slate-300",
    glow: "shadow-slate-300/20",
    isWinner: false,
  },
  second_runner_up: {
    label: "2nd Runner Up",
    emoji: "🥉",
    color: "from-amber-700/20 to-amber-600/5",
    border: "border-amber-600",
    badge: "bg-amber-600 text-white",
    text: "text-amber-500",
    glow: "shadow-amber-600/20",
    isWinner: false,
  },
  honorable_mention: {
    label: "Honorable Mention",
    emoji: "⭐",
    color: "from-cyan-500/10 to-cyan-400/5",
    border: "border-cyan-500/60",
    badge: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/10",
    isWinner: false,
  },
};

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="17"
      viewBox="0 0 22 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M1 16L4 6L9 12L11 1L13 12L18 6L21 16H1Z"
        fill="rgba(234,179,8,0.75)"
        stroke="rgba(234,179,8,0.95)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RankBadge({
  rank,
  color,
}: {
  rank: number;
  color: "silver" | "gold" | "bronze";
}) {
  const styles = {
    gold: "bg-yellow-400 text-black",
    silver: "bg-slate-300 text-black",
    bronze: "bg-amber-600 text-white",
  };
  return (
    <span
      className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${styles[color]}`}
    >
      {rank}
    </span>
  );
}

function TeamEntry({ entry }: { entry: ResultEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isSolo = entry.participants.length === 1;

  if (isSolo) {
    return (
      <span className="font-bold text-white text-lg">
        {entry.participants[0]?.name}
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 group"
      >
        <span className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors underline decoration-dotted underline-offset-4">
          {entry.teamName || entry.participants[0]?.name || "Unknown"}
        </span>
        <span className="text-white/50 text-sm">
          ({entry.participants.length} members)
        </span>
        <span
          className="text-white/40 text-xs transition-transform duration-300 inline-block"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>
      {expanded && (
        <div className="mt-2 pl-3 border-l-2 border-white/20 space-y-1">
          {entry.participants.map((p, i) => (
            <div key={i} className="text-sm text-white/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventResultCard({ result }: { result: EventResult }) {
  const [expanded, setExpanded] = useState(false);

  const groupedEntries: Record<string, ResultEntry[]> = {};
  for (const pos of POSITION_ORDER) {
    const filtered = result.entries
      .filter((e) => e.position === pos)
      .sort((a, b) => a.rank - b.rank);
    if (filtered.length > 0) groupedEntries[pos] = filtered;
  }

  const hasEntries = Object.keys(groupedEntries).length > 0;
  const teamNames = Object.values(groupedEntries).flatMap((entries) =>
    entries.map(
      (e) => e.teamName || e.participants[0]?.name || "Unknown"
    )
  );
  const uniqueTeamNames = [...new Set(teamNames)];
  const teamNamesPreview = uniqueTeamNames.join(", ");

  return (
    <HandDrawnCard className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 sm:p-6 group"
      >
        <div className="flex items-start gap-4">
          {result.eventBanner && (
            <div
              className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40 shrink-0 bg-black/40"
              style={{ filter: "url(#wobbly-border)" }}
            >
              <img
                src={result.eventBanner}
                alt={result.eventName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 w-full text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wide group-hover:text-yellow-400 transition-colors duration-200 !text-left" style={{ marginBottom: "0rem" }}>
              {result.eventName}
            </h2>
            {result.eventCategory && (
              <div className="mt-1.5 text-left">
                <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/20 font-medium">
                  {result.eventCategory}
                </span>
              </div>
            )}
            {result.eventPrizePool && (
              <div className="mt-1.5 flex items-center gap-1.5 text-left">
                <span className="text-yellow-500/90 text-sm">🏆</span>
                <span
                  className="font-semibold text-sm tracking-wide text-yellow-400/95"
                  style={{
                    textShadow: "0 0 12px rgba(234,179,8,0.35)",
                  }}
                >
                  {result.eventPrizePool}
                </span>
              </div>
            )}
            {teamNamesPreview && (
              <div className="mt-1.5 flex items-start justify-start gap-2 text-left">
                <span className="text-yellow-400 font-black text-sm shrink-0">★</span>
                <span className="text-yellow-300 text-sm font-semibold break-words">
                  {teamNamesPreview}
                </span>
              </div>
            )}
          </div>
          <span
            className="text-white/40 text-lg shrink-0 transition-transform duration-300 mt-1 inline-block"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 sm:px-6 pb-6 space-y-6 border-t border-white/10 pt-5">
          {!hasEntries && (
            <p className="text-white/40 text-sm text-center py-4">
              No results available yet.
            </p>
          )}

          {(Object.entries(groupedEntries) as [string, ResultEntry[]][]).map(
            ([pos, entries]) => {
              const posKey = pos as keyof typeof POSITION_CONFIG;
              const config = POSITION_CONFIG[posKey];

              return (
                <div key={pos}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-2xl"
                      style={
                        config.isWinner
                          ? { animation: "results-bounce 1.5s ease-in-out infinite" }
                          : undefined
                      }
                    >
                      {config.emoji}
                    </span>
                    <h3
                      className={`font-bold text-lg uppercase tracking-wider ${config.text}`}
                    >
                      {config.label}
                    </h3>
                    {entries.length > 1 && (
                      <span className="text-white/40 text-xs">
                        ({entries.length} entries)
                      </span>
                    )}
                    {config.isWinner && (
                      <span className="ml-auto text-xs text-yellow-400/50 uppercase tracking-widest">
                        ✦ Champion ✦
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {entries.map((entry, idx) => (
                      <div
                        key={entry._id}
                        className={`relative rounded-xl border bg-gradient-to-br ${config.color} ${config.border} p-4 shadow-lg ${config.glow} overflow-hidden`}
                        style={
                          config.isWinner
                            ? {
                                boxShadow:
                                  "0 0 24px 2px rgba(234,179,8,0.15), 0 4px 20px rgba(0,0,0,0.5)",
                              }
                            : undefined
                        }
                      >
                        {/* Shimmer sweep for winner cards */}
                        {config.isWinner && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                "linear-gradient(105deg, transparent 35%, rgba(255,215,0,0.07) 50%, transparent 65%)",
                              animation: "results-shimmer 3s ease-in-out infinite",
                            }}
                          />
                        )}

                        <div className="flex items-start justify-between gap-3 flex-wrap relative z-10">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {entries.length > 1 && (
                              <span
                                className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${config.badge}`}
                              >
                                #{idx + 1}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <TeamEntry entry={entry} />
                              {entry.note && (
                                <p className="text-white/50 text-xs mt-2 italic">
                                  {entry.note}
                                </p>
                              )}
                            </div>
                          </div>
                          {entry.positionLabel && (
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${config.badge}`}
                            >
                              {entry.positionLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </HandDrawnCard>
  );
}

function RoboDangalSubEventTeam({
  teamName,
  members,
}: {
  teamName: string;
  members: readonly string[];
  isWinner?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSolo = members.length === 1;

  if (isSolo) {
    return (
      <span className="font-bold text-white text-lg">
        {teamName} — {members[0]}
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 group"
      >
        <span className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors underline decoration-dotted underline-offset-4">
          {teamName}
        </span>
        <span className="text-white/50 text-sm">
          ({members.length} members)
        </span>
        <span
          className="text-white/40 text-xs transition-transform duration-300 inline-block"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>
      {expanded && (
        <div className="mt-2 pl-3 border-l-2 border-white/20 space-y-1">
          {members.map((name, i) => (
            <div key={i} className="text-sm text-white/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoboDangalResultCard({
  eventBanner,
  eventCategory,
  eventPrizePool,
}: {
  eventBanner?: string | null;
  eventCategory?: string | null;
  eventPrizePool?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const data = ROBO_DANGAL_HARDCODED;
  const teamNames = data.subEvents.flatMap((s) => [
    s.winner.teamName,
    s.runnerUp.teamName,
  ]);
  const teamNamesPreview = teamNames.join(", ");

  return (
    <HandDrawnCard className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 sm:p-6 group"
      >
        <div className="flex items-start gap-4">
          {eventBanner && (
            <div
              className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40 shrink-0 bg-black/40"
              style={{ filter: "url(#wobbly-border)" }}
            >
              <img
                src={eventBanner}
                alt={data.eventName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 w-full text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wide group-hover:text-yellow-400 transition-colors duration-200 !text-left" style={{ marginBottom: "0rem" }}>
              {data.eventName}
            </h2>
            {eventCategory && (
              <div className="mt-1.5 text-left">
                <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/20 font-medium">
                  {eventCategory}
                </span>
              </div>
            )}
            {eventPrizePool && (
              <div className="mt-1.5 flex items-center gap-1.5 text-left">
                <span className="text-yellow-500/90 text-sm">🏆</span>
                <span
                  className="font-semibold text-sm tracking-wide text-yellow-400/95"
                  style={{
                    textShadow: "0 0 12px rgba(234,179,8,0.35)",
                  }}
                >
                  {eventPrizePool}
                </span>
              </div>
            )}
            {teamNamesPreview && (
              <div className="mt-1.5 flex items-start justify-start gap-2 text-left">
                <span className="text-yellow-400 font-black text-sm shrink-0">★</span>
                <span className="text-yellow-300 text-sm font-semibold break-words">
                  {teamNamesPreview}
                </span>
              </div>
            )}
          </div>
          <span
            className="text-white/40 text-lg shrink-0 transition-transform duration-300 mt-1 inline-block"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 sm:px-6 pb-6 space-y-6 border-t border-white/10 pt-5">
          {data.subEvents.map((sub) => (
            <div key={sub.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg uppercase tracking-wider text-white/90">
                  {sub.name}
                </h3>
              </div>

              <div className="space-y-3">
                {/* Winner */}
                <div
                  className={`relative rounded-xl border bg-gradient-to-br ${POSITION_CONFIG.winner.color} ${POSITION_CONFIG.winner.border} p-4 shadow-lg ${POSITION_CONFIG.winner.glow} overflow-hidden`}
                  style={{
                    boxShadow:
                      "0 0 24px 2px rgba(234,179,8,0.15), 0 4px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 35%, rgba(255,215,0,0.07) 50%, transparent 65%)",
                      animation: "results-shimmer 3s ease-in-out infinite",
                    }}
                  />
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl" style={{ animation: "results-bounce 1.5s ease-in-out infinite" }}>
                      {POSITION_CONFIG.winner.emoji}
                    </span>
                    <span className={`font-bold text-lg uppercase tracking-wider ${POSITION_CONFIG.winner.text}`}>
                      {POSITION_CONFIG.winner.label}
                    </span>
                    <span className="ml-auto text-xs text-yellow-400/50 uppercase tracking-widest">
                      ✦ Champion ✦
                    </span>
                  </div>
                  <div className="relative z-10">
                    <RoboDangalSubEventTeam
                      teamName={sub.winner.teamName}
                      members={sub.winner.members}
                      isWinner
                    />
                  </div>
                </div>

                {/* Runner-up */}
                <div
                  className={`relative rounded-xl border bg-gradient-to-br ${POSITION_CONFIG.runner_up.color} ${POSITION_CONFIG.runner_up.border} p-4 shadow-lg ${POSITION_CONFIG.runner_up.glow} overflow-hidden`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {POSITION_CONFIG.runner_up.emoji}
                    </span>
                    <span className={`font-bold text-lg uppercase tracking-wider ${POSITION_CONFIG.runner_up.text}`}>
                      {POSITION_CONFIG.runner_up.label}
                    </span>
                  </div>
                  <div>
                    <RoboDangalSubEventTeam
                      teamName={sub.runnerUp.teamName}
                      members={sub.runnerUp.members}
                      isWinner={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </HandDrawnCard>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<EventResult[]>([]);
  const [roboDangalEvent, setRoboDangalEvent] = useState<{
    banner: string | null;
    category: string | null;
    prizePool: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [minigameTop3, setMinigameTop3] = useState<MinigamePlayer[]>([]);
  const [minigameLoading, setMinigameLoading] = useState(true);

  useEffect(() => {
    const fetchMinigame = async () => {
      try {
        const res = await fetch("/api/arcade/leaderboard");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setMinigameTop3((data.leaderboard ?? []).slice(0, 3));
      } catch {
        // silently fail — section just won't show scores
      } finally {
        setMinigameLoading(false);
      }
    };
    fetchMinigame();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch("/api/results");
        if (!res.ok) throw new Error("Failed to fetch results");
        const data = await res.json();
        if (data.hidden) {
          setHidden(true);
          setLoading(false);
          return;
        }
        const apiResults = Array.isArray(data) ? data : (data.results ?? []);
        setRoboDangalEvent(data.roboDangalEvent ?? null);
        const filtered = apiResults.filter(
          (r: EventResult) => !/robo\s*dangal/i.test(r.eventName ?? "")
        );
        const roboDangalResult: EventResult = {
          eventId: "robo-dangal-hardcoded",
          eventName: "ROBO DANGAL",
          eventPrizePool: "₹18,000",
          entries: [],
          _isRoboDangalHardcoded: true,
        };
        setResults([roboDangalResult, ...filtered]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <style>{`
        @keyframes results-shimmer {
          0%   { transform: translateX(-150%); }
          60%  { transform: translateX(150%); }
          100% { transform: translateX(150%); }
        }
        @keyframes results-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
@keyframes results-bar-grow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes results-crown {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes results-title-glow {
          0%, 100% { text-shadow: 0 0 30px rgba(255,215,0,0.25), 0 0 60px rgba(255,215,0,0.08); }
          50%       { text-shadow: 0 0 55px rgba(255,215,0,0.55), 0 0 110px rgba(255,215,0,0.18); }
        }
        @keyframes results-score-glow {
          0%, 100% { text-shadow: 0 0 8px rgba(255,214,0,0.4); }
          50%       { text-shadow: 0 0 22px rgba(255,214,0,0.95), 0 0 44px rgba(255,214,0,0.4); }
        }
        @keyframes results-card-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navbar />

      <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
        <DotOrbit
          width="100%"
          height="100%"
          colors={["#ffffff", "#006aff", "#fff675"]}
          colorBack="#000000"
          stepsPerColor={4}
          size={0.2}
          sizeRange={0.5}
          spreading={1}
          speed={0.5}
          scale={0.35}
        />
      </div>

      <main className="relative z-10 pt-24 pb-16 px-4 max-w-4xl mx-auto">
        {/* ── Hero ── */}
        <div className="relative text-center mb-14">
          {/* Gold radial glow behind title */}
          <div
            className="absolute inset-x-0 top-0 flex justify-center pointer-events-none"
            aria-hidden="true"
          >
            <div
              className="w-80 h-36 rounded-full opacity-15 blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse, #FFD700 0%, transparent 70%)",
              }}
            />
          </div>

          <div className="relative flex flex-col items-center gap-2 mb-4">
            <h1
              className="hand-drawn-title text-5xl sm:text-7xl text-white"
              style={{ animation: "results-title-glow 3s ease-in-out infinite" }}
            >
              Results
            </h1>
            <div className="flex items-center gap-3 text-white/25 text-xs tracking-[0.3em] uppercase">
              <span className="h-px w-12 bg-white/20" />
              Champions Revealed
              <span className="h-px w-12 bg-white/20" />
            </div>
          </div>

          <p className="text-white/55 text-base mt-3 max-w-md mx-auto">
            The crew has spoken. Check out the winners from each mission.
          </p>

          {/* Decorative podium */}
          <div className="flex items-end justify-center gap-3 mt-10 mb-2">
            {/* 2nd */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-slate-300/60 text-xs font-bold tracking-widest uppercase">
                2nd
              </span>
              <div className="w-20 h-12 rounded-t-lg bg-gradient-to-t from-slate-600/50 to-slate-400/20 border-2 border-slate-300/50 flex items-end justify-center pb-1.5">
                <span className="text-slate-200 font-black text-xl">2</span>
              </div>
            </div>
            {/* 1st */}
            <div className="flex flex-col items-center gap-2">
              <div style={{ animation: "results-crown 1.8s ease-in-out infinite" }}>
                <CrownIcon className="opacity-90" />
              </div>
              <div
                className="w-24 h-20 rounded-t-lg border-2 border-yellow-400/60 flex items-end justify-center pb-2"
                style={{
                  background:
                    "linear-gradient(to top, rgba(161,122,0,0.55), rgba(234,179,8,0.18))",
                  boxShadow: "0 0 28px rgba(234,179,8,0.22)",
                }}
              >
                <span
                  className="text-yellow-200 font-black text-2xl"
                  style={{ textShadow: "0 0 12px rgba(234,179,8,0.7)" }}
                >
                  1
                </span>
              </div>
            </div>
            {/* 3rd */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-amber-600/60 text-xs font-bold tracking-widest uppercase">
                3rd
              </span>
              <div className="w-20 h-8 rounded-t-lg bg-gradient-to-t from-amber-900/50 to-amber-700/20 border-2 border-amber-600/50 flex items-end justify-center pb-1">
                <span className="text-amber-400 font-black text-lg">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Results list ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <img
              src="/kill.gif"
              alt="Loading"
              className="w-24 h-24 object-contain animate-pulse"
            />
            <p className="text-white/50 text-sm uppercase tracking-widest">
              Loading results...
            </p>
          </div>
        ) : hidden ? (
          <HandDrawnCard className="p-10 text-center">
            <div
              className="text-6xl mb-4"
              style={{ animation: "results-crown 2s ease-in-out infinite" }}
            >
              🔒
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Results Unavailable
            </h2>
            <p className="text-white/50 text-sm">
              Results are not available right now. Check back later, crewmate!
            </p>
          </HandDrawnCard>
        ) : results.length === 0 ? (
          <HandDrawnCard className="p-10 text-center">
            <div className="text-6xl mb-4">📡</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No Results Yet
            </h2>
            <p className="text-white/50 text-sm">
              Results will appear here after each event concludes. Stay tuned,
              crewmate!
            </p>
          </HandDrawnCard>
        ) : (
          <div className="space-y-4">
            <p className="text-white/40 text-sm text-center mb-6">
              {results.length} event{results.length !== 1 ? "s" : ""} with
              published results{" "}
              <span className="text-white/20">— click to expand</span>
            </p>
            {results.map((result, i) => (
              <div
                key={result.eventId}
                style={{
                  animation: `results-card-in 0.4s ease-out ${i * 0.08}s both`,
                }}
              >
                {result._isRoboDangalHardcoded ? (
                  <RoboDangalResultCard
                    eventBanner={roboDangalEvent?.banner}
                    eventCategory={roboDangalEvent?.category}
                    eventPrizePool={roboDangalEvent?.prizePool}
                  />
                ) : (
                  <EventResultCard result={result} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Among Us Minigame Section ── */}
        <div className="mt-20">
          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20" />
            <img
              src="/kill.gif"
              alt=""
              className="w-8 h-8 object-contain opacity-70"
            />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20" />
          </div>

          <HandDrawnCard className="overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                  Among Us Minigame
                </p>
                <h2 className="hand-drawn-title text-3xl sm:text-4xl text-white mb-3">
                  The Arcade GOATs 🐐
                </h2>
                <p className="text-white/60 text-sm sm:text-base italic max-w-sm mx-auto">
                  &quot;Y&apos;all didn&apos;t win anything but you still the
                  GOATs&quot;
                </p>
              </div>

              {/* Podium */}
              {minigameLoading ? (
                <div className="flex justify-center py-10">
                  <img
                    src="/kill.gif"
                    alt="Loading"
                    className="w-12 h-12 object-contain opacity-60 animate-pulse"
                  />
                </div>
              ) : minigameTop3.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-8">
                  No scores yet — be the first crewmate on the board!
                </p>
              ) : (
                <div className="flex items-end justify-center gap-3 sm:gap-8">
                  {/* 2nd Place */}
                  {minigameTop3[1] ? (
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                      <div className="relative mb-1">
                        {minigameTop3[1].avatar != null ? (
                          <Image
                            src={`/${minigameTop3[1].avatar}.png`}
                            alt={minigameTop3[1].username ?? ""}
                            width={52}
                            height={52}
                            className="rounded-full border-2 border-slate-300/60 object-cover"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-full bg-slate-600 border-2 border-slate-300/60 flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.4)"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        )}
                        <RankBadge rank={2} color="silver" />
                      </div>
                      <span className="text-slate-300 font-bold text-sm text-center truncate w-full">
                        {minigameTop3[1].username ??
                          minigameTop3[1].fullName ??
                          "???"}
                      </span>
                      <span className="text-[#fff675] font-bold text-sm tabular-nums">
                        {minigameTop3[1].amongUsScore.toLocaleString()}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-slate-600/50 to-slate-400/20 border-2 border-slate-300/50 rounded-t-lg flex items-center justify-center origin-bottom"
                        style={{
                          height: "80px",
                          animation:
                            "results-bar-grow 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
                        }}
                      >
                        <span className="text-slate-200 font-bold text-2xl">
                          2
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 max-w-[140px]" />
                  )}

                  {/* 1st Place */}
                  {minigameTop3[0] && (
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                      <div style={{ animation: "results-crown 1.8s ease-in-out infinite" }}>
                        <CrownIcon />
                      </div>
                      <div
                        className="relative"
                        style={{
                          filter:
                            "drop-shadow(0 0 14px rgba(234,179,8,0.55))",
                        }}
                      >
                        {minigameTop3[0].avatar != null ? (
                          <Image
                            src={`/${minigameTop3[0].avatar}.png`}
                            alt={minigameTop3[0].username ?? ""}
                            width={68}
                            height={68}
                            className="rounded-full border-2 border-yellow-400/80 object-cover"
                          />
                        ) : (
                          <div className="w-17 h-17 rounded-full bg-yellow-700 border-2 border-yellow-400/80 flex items-center justify-center">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.5)"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        )}
                      </div>
                      <span
                        className="text-yellow-300 font-bold text-base text-center truncate w-full"
                        style={{ textShadow: "0 0 14px rgba(234,179,8,0.5)" }}
                      >
                        {minigameTop3[0].username ??
                          minigameTop3[0].fullName ??
                          "???"}
                      </span>
                      <span
                        className="text-[#fff675] font-bold text-lg tabular-nums"
                        style={{
                          animation:
                            "results-score-glow 2s ease-in-out infinite",
                        }}
                      >
                        {minigameTop3[0].amongUsScore.toLocaleString()}
                      </span>
                      <div
                        className="w-full border-2 border-yellow-400/50 rounded-t-lg flex items-center justify-center origin-bottom"
                        style={{
                          height: "128px",
                          background:
                            "linear-gradient(to top, rgba(161,122,0,0.55), rgba(234,179,8,0.15))",
                          boxShadow: "0 0 28px rgba(234,179,8,0.2) inset",
                          animation:
                            "results-bar-grow 0.65s cubic-bezier(0.34,1.56,0.64,1) 0s both",
                        }}
                      >
                        <span
                          className="text-yellow-200 font-bold text-3xl"
                          style={{
                            textShadow: "0 0 20px rgba(234,179,8,0.8)",
                          }}
                        >
                          1
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {minigameTop3[2] ? (
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                      <div className="relative mb-1">
                        {minigameTop3[2].avatar != null ? (
                          <Image
                            src={`/${minigameTop3[2].avatar}.png`}
                            alt={minigameTop3[2].username ?? ""}
                            width={52}
                            height={52}
                            className="rounded-full border-2 border-amber-600/60 object-cover"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-full bg-amber-800 border-2 border-amber-600/60 flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.4)"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        )}
                        <RankBadge rank={3} color="bronze" />
                      </div>
                      <span className="text-amber-500 font-bold text-sm text-center truncate w-full">
                        {minigameTop3[2].username ??
                          minigameTop3[2].fullName ??
                          "???"}
                      </span>
                      <span className="text-[#fff675] font-bold text-sm tabular-nums">
                        {minigameTop3[2].amongUsScore.toLocaleString()}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-amber-900/40 to-amber-700/20 border-2 border-amber-600/50 rounded-t-lg flex items-center justify-center origin-bottom"
                        style={{
                          height: "56px",
                          animation:
                            "results-bar-grow 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.4s both",
                        }}
                      >
                        <span className="text-amber-400 font-bold text-xl">
                          3
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 max-w-[140px]" />
                  )}
                </div>
              )}
            </div>
          </HandDrawnCard>
        </div>
      </main>
    </div>
  );
}
