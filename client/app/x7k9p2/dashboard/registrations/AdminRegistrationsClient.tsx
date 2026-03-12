"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";
import { getAdminBasePath } from "@/lib/admin-config";
import { Mail } from "lucide-react";
import * as XLSX from "xlsx";

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
  // Extended fields from API for export
  teamPaymentStatus?: string | null;
  participantUsername?: string;
  participantRoles?: string[];
  participantProvider?: string;
  participantAmongUsScore?: number;
  participantEmailVerified?: string | Date | null;
  participantVerified?: boolean;
  participantStream?: string;
  participantIsProfileComplete?: boolean;
  participantCreatedAt?: string | Date | null;
  participantUpdatedAt?: string | Date | null;
  checkedInBy?: string | null;
  lastFoodServedAt?: string | Date | null;
}

interface EventOption {
  id: string;
  eventName: string;
  minMembersPerTeam?: number;
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
  const [statusFilter, setStatusFilter] = useState("");
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
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());
  const [selectedTeamCodes, setSelectedTeamCodes] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const toast = useAmongUsToast();

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    if (selectionMode) {
      setSelectedRegIds(new Set());
      setSelectedTeamCodes(new Set());
    }
  };
  const router = useRouter();
  const basePath = getAdminBasePath();

  const toggleRegSelection = (id: string) => {
    setSelectedRegIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTeamSelection = (code: string) => {
    setSelectedTeamCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleEmailSelected = () => {
    const participantIds = Array.from(selectedRegIds)
      .map((id) => {
        const reg = registrations.find((r) => r.id === id);
        return reg?.participantId;
      })
      .filter(Boolean) as string[];
    const teamCodes = Array.from(selectedTeamCodes);
    const params = new URLSearchParams();
    if (participantIds.length) params.set("participants", participantIds.join(","));
    if (teamCodes.length) params.set("teams", teamCodes.join(","));
    router.push(`/${basePath}/dashboard/mail?${params}`);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (key: keyof RegistrationRow | "participant") => {
    setSortKey(key);
    setSortDir((prev) => (sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
  };

  // Status filter: complete = solo or team with enough members; incomplete = team with fewer than min
  const filteredByStatus = useMemo(() => {
    if (!statusFilter) return registrations;
    const teamMemberCount = new Map<string, number>();
    registrations.forEach((r) => {
      if (r.isInTeam && r.teamCode) {
        teamMemberCount.set(r.teamCode, (teamMemberCount.get(r.teamCode) ?? 0) + 1);
      }
    });
    const minForEvent = new Map<string, number>();
    events.forEach((e) => {
      minForEvent.set(e.eventName, e.minMembersPerTeam ?? 1);
    });
    return registrations.filter((reg) => {
      if (!reg.isInTeam || !reg.teamCode) {
        return statusFilter === "complete"; // solo = complete
      }
      const count = teamMemberCount.get(reg.teamCode) ?? 0;
      const min = minForEvent.get(reg.eventName) ?? 1;
      const isComplete = count >= min;
      return statusFilter === "complete" ? isComplete : !isComplete;
    });
  }, [registrations, events, statusFilter]);

  const sortedRegistrations = [...filteredByStatus].sort((a, b) => {
    const key = sortKey ?? "eventName";
    let va: string | number | boolean | null;
    let vb: string | number | boolean | null;
    if (key === "participant") {
      va = a.participantName || a.participantEmail || "";
      vb = b.participantName || b.participantEmail || "";
    } else if (key === "checkedInAt") {
      va = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
      vb = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
    } else if (key === "createdAt") {
      va = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      vb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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
    const source = statusFilter ? filteredByStatus : registrations;
    const teamsMap: Record<
      string,
      {
        teamCode: string;
        teamName: string | null;
        members: RegistrationRow[];
        eventName: string;
      }
    > = {};

    source.forEach((reg) => {
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

  const formatDate = (d: string | Date | null | undefined): string => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return isNaN(date.getTime()) ? "" : date.toISOString();
  };

  const buildExportRow = (reg: RegistrationRow): Record<string, string | number | boolean> => {
    const teamMembersStr = reg.teamMembers?.length
      ? reg.teamMembers
          .map((m) => `${m.fullName || m.username || "?"} (${m.email || ""})`)
          .join("; ")
      : "";
    return {
      id: reg.id,
      eventId: reg.eventId,
      eventName: reg.eventName,
      isInTeam: reg.isInTeam,
      teamId: reg.teamId ?? "",
      teamCode: reg.teamCode ?? "",
      teamName: reg.teamName ?? "",
      teamPaymentStatus: reg.teamPaymentStatus ?? "",
      teamMembers: teamMembersStr,
      participantId: reg.participantId,
      participantUsername: reg.participantUsername ?? reg.participantName ?? "",
      participantEmail: reg.participantEmail ?? "",
      participantFullName: reg.participantName ?? "",
      participantCollege: reg.participantCollege ?? "",
      participantPhone: reg.participantPhone ?? "",
      participantRoles: Array.isArray(reg.participantRoles) ? reg.participantRoles.join(", ") : "",
      participantProvider: reg.participantProvider ?? "",
      participantAmongUsScore: reg.participantAmongUsScore ?? 0,
      participantEmailVerified: formatDate(reg.participantEmailVerified),
      participantVerified: reg.participantVerified ?? false,
      participantStream: reg.participantStream ?? "",
      participantIsProfileComplete: reg.participantIsProfileComplete ?? false,
      participantCreatedAt: formatDate(reg.participantCreatedAt),
      participantUpdatedAt: formatDate(reg.participantUpdatedAt),
      verified: reg.verified,
      checkedIn: reg.checkedIn,
      checkedInAt: formatDate(reg.checkedInAt),
      checkedInBy: reg.checkedInBy ?? "",
      foodServedCount: reg.foodServedCount,
      lastFoodServedAt: formatDate(reg.lastFoodServedAt),
      createdAt: formatDate(reg.createdAt),
      updatedAt: formatDate(reg.updatedAt),
    };
  };

  const escapeCsvValue = (v: string | number | boolean): string => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const handleExportCSV = () => {
    setExportDropdownOpen(false);
    const rows = sortedRegistrations.map(buildExportRow);
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => escapeCsvValue(r[h])).join(",")),
    ];
    const csv = csvLines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const eventName = eventFilter ? events.find((e) => e.id === eventFilter)?.eventName : "";
    a.download = eventName
      ? `registrations-${eventName.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`
      : `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  };

  const handleExportXLSX = () => {
    setExportDropdownOpen(false);
    const rows = sortedRegistrations.map(buildExportRow);
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }
    const uniqueEvents = [...new Set(rows.map((r) => r.eventName as string))];
    const wb = XLSX.utils.book_new();

    if (uniqueEvents.length > 1) {
      uniqueEvents.forEach((eventName) => {
        const eventRows = rows.filter((r) => r.eventName === eventName);
        const ws = XLSX.utils.json_to_sheet(eventRows);
        const safeName = eventName.replace(/[:\\/?*\[\]]/g, "").slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, safeName || "Sheet");
      });
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    }

    const eventName = eventFilter ? events.find((e) => e.id === eventFilter)?.eventName : "";
    const filename = eventName
      ? `registrations-${eventName.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`
      : `registrations-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success("Exported as XLSX");
  };

  return (
    <>
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <h2 className="hand-drawn-title admin-section-title text-white mb-3 sm:mb-4">
          Registrations
        </h2>
        <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Row 1: Search bar full width */}
          <div>
            <label className="block text-cyan text-sm font-semibold mb-1">
              Search (email/name)
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hand-drawn-input w-full"
              placeholder="Search..."
            />
          </div>

          {/* Row 2: Filters and actions */}
          <div className="flex flex-wrap gap-3 sm:gap-4 items-end">
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
            <div className="w-22">
              <label className="block text-cyan text-sm font-semibold mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="hand-drawn-select"
              >
                <option value="">All</option>
                <option value="complete">Complete</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>

            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`hand-drawn-button ${selectionMode ? "bg-cyan/30" : ""}`}
            >
              {selectionMode ? "Done" : "Select"}
            </button>

            <div className="relative flex flex-col w-full sm:w-auto sm:ml-auto" ref={exportDropdownRef}>
              <span className="block text-sm font-semibold mb-1 invisible select-none" aria-hidden="true">
                &nbsp;
              </span>
              <button
                type="button"
                onClick={() => setExportDropdownOpen((o) => !o)}
                className="hand-drawn-button min-w-[140px] px-5 py-3 text-base"
              >
                Export
              </button>
              {exportDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded border border-white/20 bg-black/95 py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    Export as CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleExportXLSX}
                    className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    Export as XLSX
                  </button>
                </div>
              )}
            </div>
            {selectionMode && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (viewMode === "list") {
                      const allSelected = sortedRegistrations.every((r) => selectedRegIds.has(r.id));
                      if (allSelected) {
                        setSelectedRegIds(new Set());
                        setSelectedTeamCodes(new Set());
                      } else {
                        setSelectedRegIds(new Set(sortedRegistrations.map((r) => r.id)));
                        setSelectedTeamCodes(new Set());
                      }
                    } else {
                      const teams = getTeamStats();
                      const allSelected = teams.every((t) => selectedTeamCodes.has(t.teamCode));
                      if (allSelected) {
                        setSelectedRegIds(new Set());
                        setSelectedTeamCodes(new Set());
                      } else {
                        setSelectedRegIds(new Set());
                        setSelectedTeamCodes(new Set(teams.map((t) => t.teamCode)));
                      }
                    }
                  }}
                  className="hand-drawn-button"
                >
                  {viewMode === "list"
                    ? sortedRegistrations.every((r) => selectedRegIds.has(r.id))
                      ? "Deselect all"
                      : "Select all"
                    : getTeamStats().every((t) => selectedTeamCodes.has(t.teamCode))
                      ? "Deselect all"
                      : "Select all"}
                </button>
                {(selectedRegIds.size > 0 || selectedTeamCodes.size > 0) && (
                  <button
                    type="button"
                    onClick={handleEmailSelected}
                    className="hand-drawn-button flex items-center gap-2"
                    style={{ background: "rgba(0, 200, 200, 0.2)" }}
                  >
                    <Mail size={18} />
                    Email selected (
                {selectedTeamCodes.size > 0 && (
                  <>{selectedTeamCodes.size} teams</>
                )}
                {selectedTeamCodes.size > 0 && selectedRegIds.size > 0 && ", "}
                {selectedRegIds.size > 0 && (
                  <>{selectedRegIds.size} participants</>
                )}
                )
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {!loading && registrations.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4 p-2.5 sm:p-3 rounded bg-black/20 border border-white/10">
            <div className="text-cyan font-semibold">
              Total: <span className="text-white">{filteredByStatus.length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Verified: <span className="text-white">{filteredByStatus.filter((r) => r.verified).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Checked in: <span className="text-white">{filteredByStatus.filter((r) => r.checkedIn).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Unique teams: <span className="text-white">{new Set(filteredByStatus.filter((r) => r.isInTeam && r.teamCode).map((r) => r.teamCode)).size}</span>
            </div>
            <div className="text-cyan font-semibold">
              In team: <span className="text-white">{filteredByStatus.filter((r) => r.isInTeam).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Solo: <span className="text-white">{filteredByStatus.filter((r) => !r.isInTeam).length}</span>
            </div>
          </div>
        )}
        {loading ? (
          <p className="text-white/70">Loading...</p>
        ) : filteredByStatus.length === 0 ? (
          <p className="text-white/70">No registrations found.</p>
        ) : viewMode === "teams" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {getTeamStats().map((team) => (
              <div
                key={team.teamCode}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start gap-2 mb-2">
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedTeamCodes.has(team.teamCode)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTeamSelection(team.teamCode);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 shrink-0"
                    />
                  )}
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => handleTeamClick(team)}
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
                  {(() => {
                    const minRequired = events.find((e) => e.eventName === team.eventName)?.minMembersPerTeam ?? 1;
                    const isIncomplete = team.members.length < minRequired;
                    return isIncomplete ? (
                      <span className="bg-amber-500/30 text-amber-300 px-2 py-1 rounded font-semibold">
                        INCOMPLETE
                      </span>
                    ) : null;
                  })()}
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
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/${basePath}/dashboard/mail?team=${encodeURIComponent(team.teamCode)}`);
                    }}
                    className="hand-drawn-button py-1 px-2 text-sm flex items-center gap-1 flex-1 justify-center"
                    style={{ background: "rgba(0, 0, 0, 0.7)" }}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs sm:text-sm min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-white/30">
                  {selectionMode && (
                    <th className="py-2 pr-2 text-cyan font-semibold w-10">
                      <input
                        type="checkbox"
                        checked={
                          sortedRegistrations.length > 0 &&
                          sortedRegistrations.every((r) => selectedRegIds.has(r.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRegIds(
                              new Set(sortedRegistrations.map((r) => r.id))
                            );
                          } else {
                            setSelectedRegIds(new Set());
                          }
                        }}
                        aria-label="Select all"
                      />
                    </th>
                  )}
                  <SortTh col="eventName" label="Event" />
                  <SortTh col="createdAt" label="Registered at" />
                  <SortTh col="participant" label="Participant" />
                  <SortTh col="teamName" label="Team" />
                  <SortTh col="teamCode" label="Team code" />
                  <SortTh col="verified" label="Verified" />
                  <SortTh col="checkedIn" label="Checked in" />
                  <SortTh col="checkedInAt" label="Checked in at" />
                  <SortTh col="foodServedCount" label="Food" />
                  <th className="py-2 text-cyan font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRegistrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-white/10">
                    {selectionMode && (
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedRegIds.has(reg.id)}
                          onChange={() => toggleRegSelection(reg.id)}
                          aria-label={`Select ${reg.participantName || reg.participantEmail}`}
                        />
                      </td>
                    )}
                    <td className="py-2 pr-3 text-white">{reg.eventName}</td>
                    <td className="py-2 pr-3 text-white/70 text-xs">
                      {reg.createdAt
                        ? new Date(reg.createdAt).toLocaleString()
                        : "-"}
                    </td>
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
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/${basePath}/dashboard/mail?participant=${encodeURIComponent(reg.participantId)}`
                            )
                          }
                          className="hand-drawn-button py-1 px-2 text-sm flex items-center gap-1"
                          style={{ background: "rgba(0, 0, 0, 0.7)" }}
                          title="Email participant"
                        >
                          <Mail size={14} />
                          Email
                        </button>
                        {canWrite &&
                          (editingId === reg.id ? (
                            <>
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
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(reg)}
                              className="hand-drawn-button py-1 px-2 text-sm"
                              style={{ background: "rgba(0, 0, 0, 0.7)" }}
                            >
                              Edit
                            </button>
                          ))}
                      </div>
                    </td>
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
