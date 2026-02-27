"use client";

import { useEffect, useState, useCallback } from "react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";

interface RegistrationRow {
  id: string;
  eventId: string;
  eventName: string;
  isInTeam: boolean;
  teamId: string | null;
  teamCode: string | null;
  participantId: string;
  participantName: string;
  participantEmail: string;
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

  return (
    <>
      <HandDrawnCard className="p-6 sm:p-8">
        <h2 className="hand-drawn-title text-white text-2xl mb-4">
          Registrations
        </h2>
        <div className="flex flex-wrap gap-4 mb-4">
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
              Team: <span className="text-white">{registrations.filter((r) => r.isInTeam).length}</span>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-white/30">
                  <SortTh col="eventName" label="Event" />
                  <SortTh col="participant" label="Participant" />
                  <SortTh col="teamCode" label="Team" />
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
                      {reg.isInTeam ? reg.teamCode ?? "Team" : "-"}
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
