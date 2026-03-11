"use client";

import { useEffect, useState } from "react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = ["#00d4ff", "#fff675", "#ff4655", "#7bff7b", "#ff9f43"];

interface Stats {
  users: {
    total: number;
    verified: number;
    completeProfiles: number;
    byRole: { role: string; count: number }[];
    byProvider: { provider: string; count: number }[];
    signupsByDay: { date: string; signups: number; profilesCompleted: number }[];
  };
  events: {
    total: number;
    byCategory: { category: string; count: number }[];
    teamCount: number;
    soloCount: number;
    paidCount: number;
    foodCount: number;
  };
  registrations: {
    total: number;
    verified: number;
    checkedIn: number;
    teamCount: number;
    soloCount: number;
    byDay: { date: string; registrations: number; profilesCompleted: number }[];
    byEvent: { eventName: string; count: number }[];
  };
  teams: { total: number };
  adminUsers: {
    total: number;
    active: number;
    pending: number;
    byRole: { role: string; count: number }[];
  };
  leaderboard: { username?: string; fullName?: string; amongUsScore: number; avatar?: number }[];
  amongUs: { totalPlayers: number; totalScore: number; highestScore: number };
}

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useAmongUsToast();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-panel/stats", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch stats");
      setStats(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch stats";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <p className="text-white/70">Loading stats...</p>
      </HandDrawnCard>
    );
  }

  if (error || !stats) {
    return (
      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <p className="text-red-400 mb-4">{error ?? "Failed to load stats"}</p>
        <button
          type="button"
          onClick={fetchStats}
          className="hand-drawn-button py-2 px-4"
        >
          Retry
        </button>
      </HandDrawnCard>
    );
  }

  const { users, events, registrations, teams, adminUsers, leaderboard, amongUs } = stats;

  const StatCard = ({
    label,
    value,
    sub,
  }: {
    label: string;
    value: number | string;
    sub?: string;
  }) => (
    <div className="p-2.5 sm:p-3 rounded bg-black/20 border border-white/10 min-w-0">
      <div className="text-cyan text-xs sm:text-sm font-semibold truncate">{label}</div>
      <div className="text-white text-xl sm:text-2xl font-bold">{value}</div>
      {sub && <div className="text-white/60 text-xs truncate">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        <StatCard label="Participants" value={users.total} />
        <StatCard label="Verified users" value={users.verified} />
        <StatCard label="Complete profiles" value={users.completeProfiles} />
        <StatCard label="Events" value={events.total} />
        <StatCard label="Registrations" value={registrations.total} />
        <StatCard label="Verified regs" value={registrations.verified} />
        <StatCard label="Checked in" value={registrations.checkedIn} />
        <StatCard label="Teams" value={teams.total} />
        <StatCard label="Admin users" value={adminUsers.total} />
        <StatCard label="Active admins" value={adminUsers.active} sub={`${adminUsers.pending} pending`} />
      </div>

      
      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
          User signups (last 30 days)
        </h2>
        <div className="min-h-[180px]">
          {users.signupsByDay.length > 0 ? (
            <div className="h-[220px] sm:h-[280px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={users.signupsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#00d4ff" tick={{ fill: "#fff", fontSize: 10 }} />
                <YAxis stroke="#00d4ff" tick={{ fill: "#fff", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
                  labelStyle={{ color: "#00d4ff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="signups"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  dot={{ fill: "#00d4ff", r: 4 }}
                  name="Signups"
                />
                <Line
                  type="monotone"
                  dataKey="profilesCompleted"
                  stroke="#7bff7b"
                  strokeWidth={2}
                  dot={{ fill: "#7bff7b", r: 4 }}
                  name="Profile completed"
                />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-white/60">No signups in the last 30 days</p>
          )}
        </div>
      </HandDrawnCard>


      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
          Registration breakdown
        </h2>
        <div className="flex flex-wrap gap-3 sm:gap-4 p-2.5 sm:p-3 rounded bg-black/20 border border-white/10">
          <div className="text-cyan font-semibold">
            Team: <span className="text-white">{registrations.teamCount}</span>
          </div>
          <div className="text-cyan font-semibold">
            Solo: <span className="text-white">{registrations.soloCount}</span>
          </div>
          <div className="text-cyan font-semibold">
            Verified: <span className="text-white">{registrations.verified}</span>
          </div>
          <div className="text-cyan font-semibold">
            Check-in rate:{" "}
            <span className="text-white">
              {registrations.total > 0
                ? Math.round((registrations.checkedIn / registrations.total) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
      </HandDrawnCard>

      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
          Registrations (last 30 days)
        </h2>
        <div className="min-h-[180px]">
          {registrations.byDay.length > 0 ? (
            <div className="h-[220px] sm:h-[280px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrations.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#00d4ff" tick={{ fill: "#fff", fontSize: 10 }} />
                  <YAxis stroke="#00d4ff" tick={{ fill: "#fff", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
                    labelStyle={{ color: "#00d4ff" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#fff675"
                    strokeWidth={2}
                    dot={{ fill: "#fff675", r: 3 }}
                    name="Registrations"
                  />
                  <Line
                    type="monotone"
                    dataKey="profilesCompleted"
                    stroke="#7bff7b"
                    strokeWidth={2}
                    dot={{ fill: "#7bff7b", r: 3 }}
                    name="Profile completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-white/60">No registrations in the last 30 days</p>
          )}
        </div>
      </HandDrawnCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <HandDrawnCard className="p-4 sm:p-6 md:p-8">
          <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
            Events by category
          </h2>
          <div className="min-h-[180px]">
            {events.byCategory.length > 0 ? (
              <div className="h-[220px] sm:h-[280px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={events.byCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {events.byCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                  <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-white/60">No events</p>
            )}
          </div>
        </HandDrawnCard>

        <HandDrawnCard className="p-4 sm:p-6 md:p-8">
          <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
            Registrations per event (top 10)
          </h2>
          <div className="min-h-[180px]">
            {registrations.byEvent.length > 0 ? (
              <div className="h-[220px] sm:h-[280px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrations.byEvent} layout="vertical" margin={{ left: 50, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="#00d4ff" tick={{ fill: "#fff" }} />
                  <YAxis type="category" dataKey="eventName" stroke="#00d4ff" tick={{ fill: "#fff", fontSize: 10 }} width={60} />
                  <Tooltip
                    contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                  <Bar dataKey="count" fill="#00d4ff" name="Registrations" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            ) : (
              <p className="text-white/60">No registrations</p>
            )}
          </div>
        </HandDrawnCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <HandDrawnCard className="p-4 sm:p-6 md:p-8">
          <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
            Users by role
          </h2>
          <div className="min-h-[180px]">
            {users.byRole.length > 0 ? (
              <div className="h-[220px] sm:h-[280px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={users.byRole}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {users.byRole.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                  <Legend />
                </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-white/60">No users</p>
            )}
          </div>
        </HandDrawnCard>

        <HandDrawnCard className="p-4 sm:p-6 md:p-8">
          <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
            Admin users by role
          </h2>
          <div className="min-h-[180px]">
            {adminUsers.byRole.length > 0 ? (
              <div className="h-[220px] sm:h-[280px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={adminUsers.byRole}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {adminUsers.byRole.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                  <Legend />
                </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-white/60">No admin users</p>
            )}
          </div>
        </HandDrawnCard>
      </div>

      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
          Check-in overview
        </h2>
        <div className="h-[220px] sm:h-[280px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Checked in", count: registrations.checkedIn, fill: "#7bff7b" },
                { name: "Not checked in", count: Math.max(0, registrations.total - registrations.checkedIn), fill: "#ff4655" },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#00d4ff" tick={{ fill: "#fff" }} />
              <YAxis stroke="#00d4ff" tick={{ fill: "#fff" }} />
              <Tooltip
                contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {[
                  "#7bff7b",
                  "#ff4655",
                ].map((fill, i) => (
                  <Cell key={i} fill={fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HandDrawnCard>

      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
          <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
            Among Us game stats
          </h2>
          <div className="flex flex-wrap gap-3 sm:gap-4 p-2.5 sm:p-3 rounded bg-black/20 border border-white/10">
            <div className="text-cyan font-semibold">
              Players who played: <span className="text-white">{amongUs.totalPlayers}</span>
            </div>
            <div className="text-cyan font-semibold">
              Highest score: <span className="text-white">{amongUs.highestScore}</span>
            </div>
            <div className="text-cyan font-semibold">
              Total score: <span className="text-white">{amongUs.totalScore}</span>
            </div>
            <div className="text-cyan font-semibold">
              Avg score:{" "}
              <span className="text-white">
                {amongUs.totalPlayers > 0
                  ? Math.round(amongUs.totalScore / amongUs.totalPlayers)
                  : 0}
              </span>
            </div>
          </div>
        </HandDrawnCard>

      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
          <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
            Top 10 leaderboard (Among Us)
          </h2>
          <div className="space-y-2">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 p-2 rounded bg-black/20 border border-white/10 min-w-0"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-cyan font-bold w-8 sm:w-10 shrink-0">#{i + 1}</span>
                    <span className="text-white font-medium truncate">
                      {entry.username}
                    </span>
                  </div>
                  <span className="text-[#fff675] font-bold shrink-0">{entry.amongUsScore}</span>
                </div>
              ))
            ) : (
              <p className="text-white/60">No players yet</p>
            )}
          </div>
        </HandDrawnCard>


      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <h2 className="hand-drawn-title text-white text-lg sm:text-xl mb-3 sm:mb-4">
          Event breakdown
        </h2>
        <div className="flex flex-wrap gap-3 sm:gap-4 p-2.5 sm:p-3 rounded bg-black/20 border border-white/10">
          <div className="text-cyan font-semibold">
            Team events: <span className="text-white">{events.teamCount}</span>
          </div>
          <div className="text-cyan font-semibold">
            Solo events: <span className="text-white">{events.soloCount}</span>
          </div>
          <div className="text-cyan font-semibold">
            Paid events: <span className="text-white">{events.paidCount}</span>
          </div>
          <div className="text-cyan font-semibold">
            Food provided: <span className="text-white">{events.foodCount}</span>
          </div>
        </div>
      </HandDrawnCard>

    </div>
  );
}
