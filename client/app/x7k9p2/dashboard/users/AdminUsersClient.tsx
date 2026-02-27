"use client";

import { useEffect, useState } from "react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";
import {
  IMPOSTER_PERMISSIONS,
  type AdminRole,
  type ImposterPermission,
} from "@/lib/admin-types";

interface AdminUserRow {
  id: string;
  email: string;
  role: AdminRole;
  permissions: ImposterPermission[];
  invitedBy: string;
  hasPassword: boolean;
  createdAt: string;
}

export default function AdminUsersClient({ canWrite = true }: { canWrite?: boolean }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("crewmate");
  const [invitePermissions, setInvitePermissions] = useState<
    ImposterPermission[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>("crewmate");
  const [editPermissions, setEditPermissions] = useState<ImposterPermission[]>(
    []
  );
  const [sortKey, setSortKey] = useState<keyof AdminUserRow | "status" | null>("email");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toast = useAmongUsToast();

  const handleSort = (key: keyof AdminUserRow | "status") => {
    setSortKey(key);
    setSortDir((prev) => (sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
  };

  const sortedUsers = [...users].sort((a, b) => {
    const key = sortKey ?? "email";
    let va: string | number;
    let vb: string | number;
    if (key === "status") {
      va = a.hasPassword ? "Active" : "Pending";
      vb = b.hasPassword ? "Active" : "Pending";
    } else if (key === "permissions") {
      va = (a.permissions ?? []).join(",");
      vb = (b.permissions ?? []).join(",");
    } else {
      va = ((a as unknown as Record<string, unknown>)[key] as string | number) ?? "";
      vb = ((b as unknown as Record<string, unknown>)[key] as string | number) ?? "";
    }
    const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortTh = ({ col, label }: { col: keyof AdminUserRow | "status"; label: string }) => (
    <th
      className="py-2 pr-3 text-cyan font-semibold cursor-pointer hover:text-cyan/80 select-none"
      onClick={() => handleSort(col)}
    >
      {label} {sortKey === col && (sortDir === "asc" ? " ↑" : " ↓")}
    </th>
  );

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-panel/users", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setUsers(data.users ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin-panel/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          permissions: inviteRole === "imposter" ? invitePermissions : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to invite");
      toast.success(`Invited ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("crewmate");
      setInvitePermissions([]);
      await fetchUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin-panel/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          permissions: editRole === "imposter" ? editPermissions : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      toast.success("User updated");
      setEditingId(null);
      await fetchUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove ${email}?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin-panel/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to remove");
      toast.success("User removed");
      await fetchUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (
    perms: ImposterPermission[],
    p: ImposterPermission,
    setter: (p: ImposterPermission[]) => void
  ) => {
    if (perms.includes(p)) {
      setter(perms.filter((x) => x !== p));
    } else {
      setter([...perms, p]);
    }
  };

  return (
    <>
      {canWrite && (
        <HandDrawnCard className="p-6 sm:p-8">
          <h2 className="hand-drawn-title text-white text-2xl mb-3">
            Invite User
          </h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-cyan text-sm font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="hand-drawn-input w-full"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-cyan text-sm font-semibold mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                className="hand-drawn-select"
              >
                <option value="admin">Admin</option>
                <option value="crewmate">Crewmate</option>
                <option value="imposter">Imposter</option>
                <option value="camsguy">CamsGuy</option>
              </select>
            </div>
            {inviteRole === "imposter" && (
              <div>
                <label className="block text-cyan text-sm font-semibold mb-2">
                  Permissions
                </label>
                <div className="flex flex-wrap gap-2">
                  {IMPOSTER_PERMISSIONS.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={invitePermissions.includes(p)}
                        onChange={() =>
                          togglePermission(
                            invitePermissions,
                            p,
                            setInvitePermissions
                          )
                        }
                        className="rounded"
                      />
                      <span className="text-white text-sm capitalize">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="hand-drawn-button py-2 px-4 disabled:opacity-60"
            >
              {submitting ? "Inviting..." : "Invite"}
            </button>
          </form>
        </HandDrawnCard>
      )}

      <HandDrawnCard className="p-6 sm:p-8">
        <h2 className="hand-drawn-title text-white text-2xl mb-4">
          Admin Users
        </h2>
        {!loading && users.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4 p-3 rounded bg-black/20 border border-white/10">
            <div className="text-cyan font-semibold">
              Total: <span className="text-white">{users.length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Active: <span className="text-white">{users.filter((u) => u.hasPassword).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Pending: <span className="text-white">{users.filter((u) => !u.hasPassword).length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Admins: <span className="text-white">{users.filter((u) => u.role === "admin").length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Crewmates: <span className="text-white">{users.filter((u) => u.role === "crewmate").length}</span>
            </div>
            <div className="text-cyan font-semibold">
              Imposters: <span className="text-white">{users.filter((u) => u.role === "imposter").length}</span>
            </div>
            <div className="text-cyan font-semibold">
              CamsGuys: <span className="text-white">{users.filter((u) => u.role === "camsguy").length}</span>
            </div>
          </div>
        )}
        {loading ? (
          <p className="text-white/70">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-white/70">No admin users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-white/30">
                  <SortTh col="email" label="Email" />
                  <SortTh col="role" label="Role" />
                  <SortTh col="permissions" label="Permissions" />
                  <SortTh col="status" label="Status" />
                  {canWrite && <th className="py-2 text-cyan font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/10">
                    <td className="py-2 pr-3 text-white">{u.email}</td>
                    <td className="py-2 pr-3 text-white/90">
                      {editingId === u.id ? (
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as AdminRole)
                          }
                          className="hand-drawn-select py-1"
                        >
                          <option value="admin">Admin</option>
                          <option value="crewmate">Crewmate</option>
                          <option value="imposter">Imposter</option>
                          <option value="camsguy">CamsGuy</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/80">
                      {editingId === u.id && editRole === "imposter" ? (
                        <div className="flex flex-wrap gap-1">
                          {IMPOSTER_PERMISSIONS.map((p) => (
                            <label
                              key={p}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={editPermissions.includes(p)}
                                onChange={() =>
                                  togglePermission(
                                    editPermissions,
                                    p,
                                    setEditPermissions
                                  )
                                }
                                className="rounded"
                              />
                              <span className="text-xs capitalize">{p}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        u.permissions.join(", ") || "-"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/70">
                      {u.hasPassword ? "Active" : "Pending setup"}
                    </td>
                    {canWrite && (
                      <td className="py-2">
                        {editingId === u.id ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdate(u.id)}
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
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(u.id);
                                setEditRole(u.role);
                                setEditPermissions(u.permissions);
                              }}
                              className="hand-drawn-button py-1 px-2 text-sm"
                              style={{ background: "rgba(0, 0, 0, 0.7)" }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id, u.email)}
                              disabled={submitting}
                              className="py-1 px-2 text-red-400 text-sm hover:text-red-300 disabled:opacity-60"
                            >
                              Remove
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
    </>
  );
}
