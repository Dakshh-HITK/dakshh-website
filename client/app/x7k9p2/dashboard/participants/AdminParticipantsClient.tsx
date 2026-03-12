"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";
import { getAdminBasePath } from "@/lib/admin-config";
import { Mail } from "lucide-react";

const USER_ROLES = ["participant", "volunteer", "admin", "super_admin"] as const;

interface ParticipantRow {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  college: string;
  stream: string;
  avatar: number | null;
  amongUsScore: number;
  verified: boolean;
  roles: string[];
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminParticipantsClientProps {
  canWrite: boolean;
}

export default function AdminParticipantsClient({
  canWrite,
}: AdminParticipantsClientProps) {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ParticipantRow>>({});
  const [sortKey, setSortKey] = useState<keyof ParticipantRow | "rolesStr" | null>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toast = useAmongUsToast();
  const router = useRouter();
  const basePath = getAdminBasePath();

  const handleSort = (key: keyof ParticipantRow | "rolesStr") => {
    setSortKey(key);
    setSortDir((prev) => (sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    const key = sortKey ?? "username";
    let va: string | number | boolean;
    let vb: string | number | boolean;
    if (key === "rolesStr") {
      va = (a.roles ?? []).join(",");
      vb = (b.roles ?? []).join(",");
    } else {
      va = ((a as unknown as Record<string, unknown>)[key] as string | number | boolean) ?? "";
      vb = ((b as unknown as Record<string, unknown>)[key] as string | number | boolean) ?? "";
    }
    let cmp: number;
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
    else if (typeof va === "boolean" && typeof vb === "boolean") cmp = (va ? 1 : 0) - (vb ? 1 : 0);
    else cmp = String(va ?? "").localeCompare(String(vb ?? ""), undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortTh = ({ col, label }: { col: keyof ParticipantRow | "rolesStr"; label: string }) => (
    <th
      className="py-2 pr-3 text-cyan font-semibold cursor-pointer hover:text-cyan/80 select-none"
      onClick={() => handleSort(col)}
    >
      {label} {sortKey === col && (sortDir === "asc" ? " ↑" : " ↓")}
    </th>
  );

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin-panel/participants?${params}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setParticipants(data.participants ?? []);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to fetch participants"
      );
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleUpdate = async (id: string) => {
    if (!canWrite || !editForm) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      if (editForm.username !== undefined) payload.username = editForm.username;
      if (editForm.fullName !== undefined) payload.fullName = editForm.fullName;
      if (editForm.phoneNumber !== undefined) payload.phoneNumber = editForm.phoneNumber;
      if (editForm.college !== undefined) payload.college = editForm.college;
      if (editForm.stream !== undefined) payload.stream = editForm.stream;
      if (editForm.avatar !== undefined) payload.avatar = editForm.avatar;
      if (editForm.amongUsScore !== undefined) payload.amongUsScore = editForm.amongUsScore;
      if (editForm.verified !== undefined) payload.verified = editForm.verified;
      if (editForm.roles !== undefined) payload.roles = editForm.roles;

      const res = await fetch(`/api/admin-panel/participants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      toast.success("Participant updated");
      setEditingId(null);
      setEditForm({});
      await fetchParticipants();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update participant"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = (role: string) => {
    const current = editForm.roles ?? [];
    if (current.includes(role)) {
      setEditForm({ ...editForm, roles: current.filter((r) => r !== role) });
    } else {
      setEditForm({ ...editForm, roles: [...current, role] });
    }
  };

  return (
    <>
      <HandDrawnCard className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h2 className="hand-drawn-title admin-section-title text-white">
            Participants
          </h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="hand-drawn-input w-full sm:max-w-xs"
            placeholder="Search by email, username, or full name..."
          />
        </div>
        {!loading && participants.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4 p-2.5 sm:p-3 rounded bg-black/20 border border-white/10">
            <div className="text-cyan font-semibold">
              Total: <span className="text-white">{participants.length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Verified: <span className="text-white">{participants.filter((p) => p.verified).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Complete profiles: <span className="text-white">{participants.filter((p) => p.isProfileComplete).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Participants: <span className="text-white">{participants.filter((p) => (p.roles ?? []).includes("participant")).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Volunteers: <span className="text-white">{participants.filter((p) => (p.roles ?? []).includes("volunteer")).length}</span>
            </div>
          </div>
        )}
        {loading ? (
          <p className="text-white/70">Loading...</p>
        ) : participants.length === 0 ? (
          <p className="text-white/70">No participants found.</p>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-white/30">
                  <SortTh col="username" label="Username" />
                  <SortTh col="email" label="Email" />
                  <SortTh col="fullName" label="Full name" />
                  <SortTh col="phoneNumber" label="Phone" />
                  <SortTh col="college" label="College" />
                  <SortTh col="stream" label="Stream" />
                  <SortTh col="amongUsScore" label="Score" />
                  <SortTh col="verified" label="Verified" />
                  <SortTh col="rolesStr" label="Roles" />
                  <th className="py-2 text-cyan font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedParticipants.map((p) => (
                  <tr key={p.id} className="border-b border-white/10">
                    <td className="py-2 pr-3 text-white">
                      {editingId === p.id ? (
                        <input
                          type="text"
                          value={editForm.username ?? p.username}
                          onChange={(e) =>
                            setEditForm({ ...editForm, username: e.target.value })
                          }
                          className="hand-drawn-input w-28"
                        />
                      ) : (
                        p.username
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/90">{p.email}</td>
                    <td className="py-2 pr-3 text-white/90">
                      {editingId === p.id ? (
                        <input
                          type="text"
                          value={editForm.fullName ?? p.fullName}
                          onChange={(e) =>
                            setEditForm({ ...editForm, fullName: e.target.value })
                          }
                          className="hand-drawn-input w-32"
                        />
                      ) : (
                        p.fullName || "-"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === p.id ? (
                        <input
                          type="text"
                          value={editForm.phoneNumber ?? p.phoneNumber}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phoneNumber: e.target.value })
                          }
                          className="hand-drawn-input w-24"
                          placeholder="10 digits"
                        />
                      ) : (
                        p.phoneNumber || "-"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === p.id ? (
                        <input
                          type="text"
                          value={editForm.college ?? p.college}
                          onChange={(e) =>
                            setEditForm({ ...editForm, college: e.target.value })
                          }
                          className="hand-drawn-input w-28"
                        />
                      ) : (
                        p.college || "-"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === p.id ? (
                        <input
                          type="text"
                          value={editForm.stream ?? p.stream}
                          onChange={(e) =>
                            setEditForm({ ...editForm, stream: e.target.value })
                          }
                          className="hand-drawn-input w-24"
                        />
                      ) : (
                        p.stream || "-"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === p.id ? (
                        <input
                          type="number"
                          min={0}
                          value={editForm.amongUsScore ?? p.amongUsScore}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              amongUsScore: Number(e.target.value) || 0,
                            })
                          }
                          className="hand-drawn-input w-16"
                        />
                      ) : (
                        p.amongUsScore
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === p.id ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.verified ?? p.verified}
                            onChange={(e) =>
                              setEditForm({ ...editForm, verified: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm">
                            {editForm.verified ?? p.verified ? "Yes" : "No"}
                          </span>
                        </label>
                      ) : (
                        p.verified ? "Yes" : "No"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === p.id ? (
                        <div className="flex flex-wrap gap-1">
                          {USER_ROLES.map((r) => (
                            <label
                              key={r}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={(editForm.roles ?? p.roles).includes(r)}
                                onChange={() => toggleRole(r)}
                                className="rounded"
                              />
                              <span className="text-xs capitalize">
                                {r.replace("_", " ")}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        p.roles.join(", ") || "-"
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/${basePath}/dashboard/mail?participant=${encodeURIComponent(p.id)}`
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
                          (editingId === p.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdate(p.id)}
                                disabled={submitting}
                                className="hand-drawn-button py-1 px-2 text-sm disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditForm({});
                                }}
                                className="py-1 px-2 text-white/70 text-sm hover:text-white"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(p.id);
                                setEditForm({
                                  username: p.username,
                                  fullName: p.fullName,
                                  phoneNumber: p.phoneNumber,
                                  college: p.college,
                                  stream: p.stream,
                                  avatar: p.avatar,
                                  amongUsScore: p.amongUsScore,
                                  verified: p.verified,
                                  roles: [...p.roles],
                                });
                              }}
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
