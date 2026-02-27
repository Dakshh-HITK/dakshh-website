"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";

const EVENT_CATEGORIES = [
  "Software",
  "Hardware",
  "Entrepreneurship",
  "Quiz",
  "Gaming",
] as const;

function toArray(val: string): string[] {
  return val
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function fromArray(arr: string[]): string {
  return (arr ?? []).join("\n");
}

interface Poc {
  name: string;
  mobile: string;
}

interface EventRow {
  id: string;
  eventName: string;
  category: string;
  date: string;
  time: string;
  duration: string;
  venue: string;
  description: string;
  banner: string;
  rules: string[];
  clubs: string[];
  isTeamEvent: boolean;
  pocs: Poc[];
  maxMembersPerTeam: number;
  minMembersPerTeam: number;
  isPaidEvent: boolean;
  isFoodProvided: boolean;
  maxFoodServingsPerParticipant: number;
  fees: number;
  prizePool: string;
}

const emptyPoc: Poc = { name: "", mobile: "" };

function addPoc(form: EventRow | Omit<EventRow, "id">, setter: (f: EventRow | Omit<EventRow, "id">) => void) {
  setter({ ...form, pocs: [...form.pocs, { ...emptyPoc }] });
}
function removePoc(form: EventRow | Omit<EventRow, "id">, setter: (f: EventRow | Omit<EventRow, "id">) => void, idx: number) {
  setter({ ...form, pocs: form.pocs.filter((_, i) => i !== idx) });
}
function updatePoc(form: EventRow | Omit<EventRow, "id">, setter: (f: EventRow | Omit<EventRow, "id">) => void, idx: number, field: "name" | "mobile", value: string) {
  const next = [...form.pocs];
  next[idx] = { ...next[idx]!, [field]: value };
  setter({ ...form, pocs: next });
}

function EventFormFields({
  form,
  setForm,
}: {
  form: EventRow | Omit<EventRow, "id">;
  setForm: (f: EventRow | Omit<EventRow, "id">) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Event name</label>
          <input
            type="text"
            value={form.eventName}
            onChange={(e) => setForm({ ...form, eventName: e.target.value })}
            className="hand-drawn-input w-full"
            placeholder="Event name"
            required
          />
        </div>
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="hand-drawn-select"
          >
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Date</label>
          <input
            type="text"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="hand-drawn-input w-full"
            placeholder="e.g. 2025-03-15"
          />
        </div>
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Time</label>
          <input
            type="text"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="hand-drawn-input w-full"
            placeholder="e.g. 10:00 AM"
          />
        </div>
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Duration</label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            className="hand-drawn-input w-full"
            placeholder="e.g. 2 hours"
          />
        </div>
      </div>
      <div>
        <label className="block text-cyan text-sm font-semibold mb-1">Venue</label>
        <input
          type="text"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
          className="hand-drawn-input w-full"
          placeholder="Venue"
        />
      </div>
      <div>
        <label className="block text-cyan text-sm font-semibold mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="hand-drawn-input w-full min-h-[80px]"
          placeholder="Description"
        />
      </div>
      <div>
        <label className="block text-cyan text-sm font-semibold mb-1">Banner URL</label>
        <input
          type="text"
          value={form.banner}
          onChange={(e) => setForm({ ...form, banner: e.target.value })}
          className="hand-drawn-input w-full"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-cyan text-sm font-semibold mb-1">Rules (one per line)</label>
        <textarea
          value={fromArray(form.rules)}
          onChange={(e) => setForm({ ...form, rules: toArray(e.target.value) })}
          className="hand-drawn-input w-full min-h-[60px]"
          placeholder="Rule 1&#10;Rule 2"
        />
      </div>
      <div>
        <label className="block text-cyan text-sm font-semibold mb-1">Clubs (one per line)</label>
        <textarea
          value={fromArray(form.clubs)}
          onChange={(e) => setForm({ ...form, clubs: toArray(e.target.value) })}
          className="hand-drawn-input w-full min-h-[60px]"
          placeholder="Club 1&#10;Club 2"
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isTeamEvent}
            onChange={(e) => setForm({ ...form, isTeamEvent: e.target.checked })}
            className="rounded"
          />
          <span className="text-white text-sm">Team event</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPaidEvent}
            onChange={(e) => setForm({ ...form, isPaidEvent: e.target.checked })}
            className="rounded"
          />
          <span className="text-white text-sm">Paid event</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFoodProvided}
            onChange={(e) => setForm({ ...form, isFoodProvided: e.target.checked })}
            className="rounded"
          />
          <span className="text-white text-sm">Food provided</span>
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Min team size</label>
          <input
            type="number"
            min={0}
            value={form.minMembersPerTeam}
            onChange={(e) => setForm({ ...form, minMembersPerTeam: Number(e.target.value) || 0 })}
            className="hand-drawn-input w-full"
          />
        </div>
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Max team size</label>
          <input
            type="number"
            min={1}
            value={form.maxMembersPerTeam}
            onChange={(e) => setForm({ ...form, maxMembersPerTeam: Number(e.target.value) || 1 })}
            className="hand-drawn-input w-full"
          />
        </div>
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Fees</label>
          <input
            type="number"
            min={0}
            value={form.fees}
            onChange={(e) => setForm({ ...form, fees: Number(e.target.value) || 0 })}
            className="hand-drawn-input w-full"
          />
        </div>
        <div>
          <label className="block text-cyan text-sm font-semibold mb-1">Max food servings</label>
          <input
            type="number"
            min={1}
            value={form.maxFoodServingsPerParticipant}
            onChange={(e) => setForm({ ...form, maxFoodServingsPerParticipant: Number(e.target.value) || 1 })}
            className="hand-drawn-input w-full"
          />
        </div>
      </div>
      <div>
        <label className="block text-cyan text-sm font-semibold mb-1">Prize pool</label>
        <input
          type="text"
          value={form.prizePool}
          onChange={(e) => setForm({ ...form, prizePool: e.target.value })}
          className="hand-drawn-input w-full"
          placeholder="TBD"
        />
      </div>
      <div>
        <label className="block text-cyan text-sm font-semibold mb-2">POCs</label>
        {form.pocs.map((p, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="text"
              value={p.name}
              onChange={(e) => updatePoc(form, setForm, i, "name", e.target.value)}
              className="hand-drawn-input flex-1"
              placeholder="Name"
            />
            <input
              type="text"
              value={p.mobile}
              onChange={(e) => updatePoc(form, setForm, i, "mobile", e.target.value)}
              className="hand-drawn-input flex-1"
              placeholder="Mobile"
            />
            <button
              type="button"
              onClick={() => removePoc(form, setForm, i)}
              className="py-1 px-2 text-red-400 text-sm hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addPoc(form, setForm)}
          className="hand-drawn-button py-1 px-2 text-sm"
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
        >
          Add POC
        </button>
      </div>
    </div>
  );
}

const defaultEvent: Omit<EventRow, "id"> = {
  eventName: "",
  category: "Software",
  date: "",
  time: "",
  duration: "",
  venue: "",
  description: "",
  banner: "",
  rules: [],
  clubs: [],
  isTeamEvent: false,
  pocs: [],
  maxMembersPerTeam: 1,
  minMembersPerTeam: 1,
  isPaidEvent: false,
  isFoodProvided: false,
  maxFoodServingsPerParticipant: 1,
  fees: 0,
  prizePool: "TBD",
};

interface AdminEventsClientProps {
  canWrite: boolean;
}

export default function AdminEventsClient({ canWrite }: AdminEventsClientProps) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<Omit<EventRow, "id">>({ ...defaultEvent });
  const [sortKey, setSortKey] = useState<keyof EventRow | null>("eventName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toast = useAmongUsToast();

  const handleSort = (key: keyof EventRow) => {
    setSortKey(key);
    setSortDir((prev) => (sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
  };

  const sortedEvents = [...events].sort((a, b) => {
    const key = sortKey ?? "eventName";
    const va = (a as unknown as Record<string, unknown>)[key];
    const vb = (b as unknown as Record<string, unknown>)[key];
    let cmp: number;
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
    else if (typeof va === "boolean" && typeof vb === "boolean") cmp = (va ? 1 : 0) - (vb ? 1 : 0);
    else cmp = String(va ?? "").localeCompare(String(vb ?? ""), undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortTh = ({ col, label }: { col: keyof EventRow; label: string }) => (
    <th
      className="py-2 pr-3 text-cyan font-semibold cursor-pointer hover:text-cyan/80 select-none"
      onClick={() => handleSort(col)}
    >
      {label} {sortKey === col && (sortDir === "asc" ? " ↑" : " ↓")}
    </th>
  );

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-panel/events", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setEvents(data.events ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin-panel/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          rules: toArray(fromArray(createForm.rules)),
          clubs: toArray(fromArray(createForm.clubs)),
          pocs: createForm.pocs.filter((p) => p.name && p.mobile),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      toast.success("Event created");
      setCreateOpen(false);
      setCreateForm({ ...defaultEvent });
      await fetchEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !editForm || !canWrite) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin-panel/events/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          rules: toArray(fromArray(editForm.rules)),
          clubs: toArray(fromArray(editForm.clubs)),
          pocs: editForm.pocs.filter((p) => p.name && p.mobile),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      toast.success("Event updated");
      setEditingId(null);
      setEditForm(null);
      await fetchEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, eventName: string) => {
    if (!canWrite || !confirm(`Delete event "${eventName}"?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin-panel/events/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      toast.success("Event deleted");
      setEditingId(null);
      setEditForm(null);
      await fetchEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {canWrite && (
        <HandDrawnCard className="p-6 sm:p-8">
          <button
            type="button"
            onClick={() => setCreateOpen(!createOpen)}
            className="hand-drawn-button py-2 px-4 mb-4"
          >
            {createOpen ? "Cancel" : "Create new event"}
          </button>
          {createOpen && (
            <form onSubmit={handleCreate} className="mt-4 pt-4 border-t border-white/20">
              <EventFormFields form={createForm} setForm={setCreateForm} />
              <button
                type="submit"
                disabled={submitting}
                className="hand-drawn-button py-2 px-4 mt-4 disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create event"}
              </button>
            </form>
          )}
        </HandDrawnCard>
      )}

      <HandDrawnCard className="p-6 sm:p-8">
        <h2 className="hand-drawn-title text-white text-2xl mb-4">
          Events
        </h2>
        {!loading && events.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4 p-3 rounded bg-black/20 border border-white/10">
            <div className="text-cyan font-semibold">
              Total: <span className="text-white">{events.length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Team events: <span className="text-white">{events.filter((e) => e.isTeamEvent).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Paid events: <span className="text-white">{events.filter((e) => e.isPaidEvent).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Food provided: <span className="text-white">{events.filter((e) => e.isFoodProvided).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Solo events: <span className="text-white">{events.filter((e) => !e.isTeamEvent).length}</span>
            </div>
          </div>
        )}
        {loading ? (
          <p className="text-white/70">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-white/70">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-white/30">
                  <SortTh col="eventName" label="Event" />
                  <SortTh col="category" label="Category" />
                  <SortTh col="date" label="Date" />
                  <SortTh col="time" label="Time" />
                  <SortTh col="venue" label="Venue" />
                  <SortTh col="isTeamEvent" label="Team" />
                  <SortTh col="isPaidEvent" label="Paid" />
                  <SortTh col="fees" label="Fees" />
                  <SortTh col="prizePool" label="Prize" />
                  {canWrite && <th className="py-2 text-cyan font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((ev) => (
                  <tr key={ev.id} className="border-b border-white/10">
                    <td className="py-2 pr-3 text-white">{ev.eventName}</td>
                    <td className="py-2 pr-3 text-white/90">{ev.category}</td>
                    <td className="py-2 pr-3 text-white/90">{ev.date}</td>
                    <td className="py-2 pr-3 text-white/90">{ev.time}</td>
                    <td className="py-2 pr-3 text-white/80">{ev.venue}</td>
                    <td className="py-2 pr-3 text-white/80">{ev.isTeamEvent ? "Yes" : "No"}</td>
                    <td className="py-2 pr-3 text-white/80">{ev.isPaidEvent ? "Yes" : "No"}</td>
                    <td className="py-2 pr-3 text-white/80">{ev.fees}</td>
                    <td className="py-2 pr-3 text-white/80">{ev.prizePool}</td>
                    {canWrite && (
                      <td className="py-2">
                        {editingId === ev.id && editForm ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdate()}
                              disabled={submitting}
                              className="hand-drawn-button py-1 px-2 text-sm disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditForm(null);
                              }}
                              className="py-1 px-2 text-white/70 text-sm hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(ev.id);
                                setEditForm({ ...ev });
                              }}
                              className="hand-drawn-button py-1 px-2 text-sm"
                              style={{ background: "rgba(0, 0, 0, 0.7)" }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ev.id, ev.eventName)}
                              disabled={submitting}
                              className="py-1 px-2 text-red-400 text-sm hover:text-red-300 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
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

      {editingId && editForm &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 py-8 px-4">
            <div className="flex min-h-full items-start justify-center">
              <HandDrawnCard className="p-6 sm:p-8 max-w-2xl w-full my-8">
                <h2 className="hand-drawn-title text-white text-2xl mb-4">
                  Edit event
                </h2>
                <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 -mr-2">
                  <EventFormFields
                    form={editForm}
                    setForm={(f) => setEditForm(f as EventRow)}
                  />
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
                  <button
                    type="button"
                    onClick={() => handleUpdate()}
                    disabled={submitting}
                    className="hand-drawn-button py-2 px-4 disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditForm(null);
                    }}
                    className="py-2 px-4 text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </HandDrawnCard>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
