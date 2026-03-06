"use client";

import { useEffect, useState, useCallback } from "react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";

import TeamDetailsModal from "./TeamDetailsModal";

interface TeamMember {
  id: string;
  username: string;
  fullName: string;
  email: string;
  college: string;
  phoneNumber: string;
  avatar: number | null;
  isLeader: boolean;
}

interface RegistrationRow {
  id: string;
  eventId: string;
  eventName: string;
  isInTeam: boolean;
  teamId: string | null;
  teamCode: string | null;
  teamName: string | null;
  teamMembers: TeamMember[];
  participantId: string;
  participantName: string;
  participantEmail: string;
  participantCollege: string;
  participantPhone: string;
  participantAvatar: number | null;
  verified: boolean;
  checkedIn: boolean;
  checkedInAt: string | null;
  foodServedCount: number;
  createdAt: string;
  updatedAt: string;
}

interface EventOption {
  id: string;
  eventName: string;
}

interface AdminRegistrationsClientProps {
  canWrite: boolean;
}

export default function AdminRegistrationsClient({
  canWrite,
}: AdminRegistrationsClientProps) {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventFilter, setEventFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [checkedInFilter, setCheckedInFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVerified, setEditVerified] = useState(false);
  const [editCheckedIn, setEditCheckedIn] = useState(false);
  const [editFoodServedCount, setEditFoodServedCount] = useState(0);
  const [sortKey, setSortKey] = useState<keyof RegistrationRow | "participant" | null>("eventName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "teams">("list");
  const [selectedTeam, setSelectedTeam] = useState<{
    teamCode: string;
    teamName: string | null;
    members: TeamMember[];
  } | null>(null);
  const toast = useAmongUsToast();

  const handleSort = (key: keyof RegistrationRow | "participant") => {
    setSortKey(key);
    setSortDir((prev) => (sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
  };

  const sortedRegistrations = [...registrations].sort((a, b) => {
    const key = sortKey ?? "eventName";
    let va: string | number | boolean | null;
    let vb: string | number | boolean | null;
    if (key === "participant") {
      va = a.participantName || a.participantEmail || "";
      vb = b.participantName || b.participantEmail || "";
    } else if (key === "checkedInAt") {
      va = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
      vb = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
    } else {
      va = ((a as unknown as Record<string, unknown>)[key] as string | number | boolean | null) ?? "";
      vb = ((b as unknown as Record<string, unknown>)[key] as string | number | boolean | null) ?? "";
    }
    let cmp: number;
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
    else if (typeof va === "boolean" && typeof vb === "boolean") cmp = (va ? 1 : 0) - (vb ? 1 : 0);
    else cmp = String(va ?? "").localeCompare(String(vb ?? ""), undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortTh = ({ col, label }: { col: keyof RegistrationRow | "participant"; label: string }) => (
    <th
      className="py-2 pr-3 text-cyan font-semibold cursor-pointer hover:text-cyan/80 select-none"
      onClick={() => handleSort(col)}
    >
      {label} {sortKey === col && (sortDir === "asc" ? " ↑" : " ↓")}
    </th>
  );

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.set("eventId", eventFilter);
      if (verifiedFilter) params.set("verified", verifiedFilter);
      if (checkedInFilter) params.set("checkedIn", checkedInFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin-panel/registrations?${params}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setRegistrations(data.registrations ?? []);
      setEvents(data.events ?? []);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to fetch registrations"
      );
    } finally {
      setLoading(false);
    }
  }, [eventFilter, verifiedFilter, checkedInFilter, search, toast]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleUpdate = async (id: string) => {
    if (!canWrite) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin-panel/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verified: editVerified,
          checkedIn: editCheckedIn,
          foodServedCount: editFoodServedCount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      toast.success("Registration updated");
      setEditingId(null);
      await fetchRegistrations();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update registration"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (reg: RegistrationRow) => {
    setEditingId(reg.id);
    setEditVerified(reg.verified);
    setEditCheckedIn(reg.checkedIn);
    setEditFoodServedCount(reg.foodServedCount);
  };

  const getTeamStats = () => {
    const teamsMap: Record<
      string,
      {
        teamCode: string;
        teamName: string | null;
        members: RegistrationRow[];
        eventName: string;
      }
    > = {};

    registrations.forEach((reg) => {
      if (reg.isInTeam && reg.teamCode) {
        if (!teamsMap[reg.teamCode]) {
          teamsMap[reg.teamCode] = {
            teamCode: reg.teamCode,
            teamName: reg.teamName,
            eventName: reg.eventName,
            members: [],
          };
        }
        teamsMap[reg.teamCode].members.push(reg);
      }
    });

    return Object.values(teamsMap);
  };

  const handleTeamClick = (team: { teamCode: string; teamName: string | null; members: RegistrationRow[] }) => {
    // If first member has teamMembers populated, use that (preferred as it has full user details)
    const firstMember = team.members[0];
    if (firstMember && firstMember.teamMembers && firstMember.teamMembers.length > 0) {
      setSelectedTeam({
        teamCode: team.teamCode,
        teamName: team.teamName,
        members: firstMember.teamMembers
      });
      return;
    }

    // Fallback: use flattened registration rows
    setSelectedTeam({
      teamCode: team.teamCode,
      teamName: team.teamName,
      members: team.members.map(m => ({
        id: m.participantId,
        username: m.participantName,
        fullName: m.participantName,
        email: m.participantEmail,
        college: m.participantCollege,
        phoneNumber: m.participantPhone,
        avatar: m.participantAvatar ?? null,
        isLeader: false 
      }))
    });
  };

  // Group registrations by team
  // (Note: we use the getTeamStats function now for display, but this could be useful for other stats)
  const teams = registrations.reduce((acc, reg) => {
    if (!reg.isInTeam || !reg.teamCode) return acc;
    if (!acc[reg.teamCode]) {
      acc[reg.teamCode] = {
        teamCode: reg.teamCode,
        teamName: reg.teamName,
        members: [],
        verifiedCount: 0,
        checkedInCount: 0,
        eventName: reg.eventName
      };
    }
    acc[reg.teamCode].members.push(reg);
    if (reg.verified) acc[reg.teamCode].verifiedCount++;
    if (reg.checkedIn) acc[reg.teamCode].checkedInCount++;
    return acc;
  }, {} as Record<string, {
    teamCode: string;
    teamName: string | null;
    members: RegistrationRow[];
    verifiedCount: number;
    checkedInCount: number;
    eventName: string;
  }>);

  const teamList = Object.values(teams);

  return (
    <>
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
      <HandDrawnCard className="p-6 sm:p-8">
        <h2 className="hand-drawn-title text-white text-2xl mb-4">
          Registrations
        </h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-cyan text-sm font-semibold">
              View Mode
            </label>
            <div className="flex bg-black/40 rounded p-1 border border-white/20 h-[42px]">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-cyan text-white font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("teams")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === "teams"
                    ? "bg-cyan text-white font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Teams
              </button>
            </div>
          </div>
          <div>
            <label className="block text-cyan text-sm font-semibold mb-1">
              Event
            </label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="hand-drawn-select"
            >
              <option value="">All events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.eventName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-cyan text-sm font-semibold mb-1">
              Verified
            </label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="hand-drawn-select"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-cyan text-sm font-semibold mb-1">
              Checked in
            </label>
            <select
              value={checkedInFilter}
              onChange={(e) => setCheckedInFilter(e.target.value)}
              className="hand-drawn-select"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-cyan text-sm font-semibold mb-1">
              Search (email/name)
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hand-drawn-input"
              placeholder="Search..."
            />
          </div>
        </div>
        {!loading && registrations.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4 p-3 rounded bg-black/20 border border-white/10">
            <div className="text-cyan font-semibold">
              Total: <span className="text-white">{registrations.length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Verified: <span className="text-white">{registrations.filter((r) => r.verified).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Checked in: <span className="text-white">{registrations.filter((r) => r.checkedIn).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Unique teams: <span className="text-white">{new Set(registrations.filter((r) => r.isInTeam && r.teamCode).map((r) => r.teamCode)).size}</span>
            </div>
            <div className="text-cyan font-semibold">
              In team: <span className="text-white">{registrations.filter((r) => r.isInTeam).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Solo: <span className="text-white">{registrations.filter((r) => !r.isInTeam).length}</span>
            </div>
          </div>
        )}
        {loading ? (
          <p className="text-white/70">Loading...</p>
        ) : registrations.length === 0 ? (
          <p className="text-white/70">No registrations found.</p>
        ) : viewMode === "teams" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getTeamStats().map((team) => (
              <div
                key={team.teamCode}
                onClick={() => handleTeamClick(team)}
                className="bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-all hover:scale-[1.02] group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-cyan transition-colors truncate pr-2">
                    {team.teamName || "Unnamed Team"}
                  </h3>
                  <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-white/60">
                    {team.teamCode}
                  </span>
                </div>
                
                <div className="text-sm text-cyan mb-3">{team.eventName}</div>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-white/5 px-2 py-1 rounded text-white/70">
                    👥 {team.members.length} members
                  </span>
                  <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">
                    ✓ {team.members.filter(m => m.verified).length} verified
                  </span>
                  {team.members.some(m => m.checkedIn) && (
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                      📍 {team.members.filter(m => m.checkedIn).length} in
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-white/30">
                  <SortTh col="eventName" label="Event" />
                  <SortTh col="participant" label="Participant" />
                  <SortTh col="teamName" label="Team" />
                  <SortTh col="teamCode" label="Team code" />
                  <SortTh col="verified" label="Verified" />
                  <SortTh col="checkedIn" label="Checked in" />
                  <SortTh col="checkedInAt" label="Checked in at" />
                  <SortTh col="foodServedCount" label="Food" />
                  {canWrite && (
                    <th className="py-2 text-cyan font-semibold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedRegistrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-white/10">
                    <td className="py-2 pr-3 text-white">{reg.eventName}</td>
                    <td className="py-2 pr-3 text-white/90">
                      <div>{reg.participantName || reg.participantEmail || "-"}</div>
                      <div className="text-white/60 text-xs">
                        {reg.participantEmail}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {reg.isInTeam ? (
                        <button
                          onClick={() => {
                            if (reg.teamCode) {
                              // Construct a minimal team object to pass to handleTeamClick
                              // It will look up full details or use what's available
                              const teamRows = registrations.filter(r => r.teamCode === reg.teamCode);
                              handleTeamClick({
                                teamCode: reg.teamCode!,
                                teamName: reg.teamName,
                                members: teamRows,
                              });
                            }
                          }}
                          className="hover:text-cyan hover:underline text-left"
                        >
                          {reg.teamName ?? reg.teamCode ?? "Team"}
                        </button>
                      ) : "-"}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {reg.isInTeam ? (reg.teamCode ?? "-") : "-"}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === reg.id ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editVerified}
                            onChange={(e) =>
                              setEditVerified(e.target.checked)
                            }
                            className="rounded"
                          />
                          <span className="text-sm">
                            {editVerified ? "Yes" : "No"}
                          </span>
                        </label>
                      ) : (
                        reg.verified ? "Yes" : "No"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === reg.id ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editCheckedIn}
                            onChange={(e) =>
                              setEditCheckedIn(e.target.checked)
                            }
                            className="rounded"
                          />
                          <span className="text-sm">
                            {editCheckedIn ? "Yes" : "No"}
                          </span>
                        </label>
                      ) : (
                        reg.checkedIn ? "Yes" : "No"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/70 text-xs">
                      {reg.checkedInAt
                        ? new Date(reg.checkedInAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === reg.id ? (
                        <input
                          type="number"
                          min={0}
                          value={editFoodServedCount}
                          onChange={(e) =>
                            setEditFoodServedCount(
                              Math.max(0, Number(e.target.value) || 0)
                            )
                          }
                          className="hand-drawn-input w-16"
                        />
                      ) : (
                        reg.foodServedCount
                      )}
                    </td>
                    {canWrite && (
                      <td className="py-2">
                        {editingId === reg.id ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdate(reg.id)}
                              disabled={submitting}
                              className="hand-drawn-button py-1 px-2 text-sm disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="py-1 px-2 text-white/70 text-sm hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(reg)}
                            className="hand-drawn-button py-1 px-2 text-sm"
                            style={{ background: "rgba(0, 0, 0, 0.7)" }}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HandDrawnCard>
    </>
  );
}
