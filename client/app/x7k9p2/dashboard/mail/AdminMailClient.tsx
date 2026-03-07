"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import { useSearchParams } from "next/navigation";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { useAmongUsToast } from "@/app/components/ui/among-us-toast";
import { getAdminBasePath } from "@/lib/admin-config";
import { Mail, Sparkles, X, ChevronDown, ChevronRight, Settings, Eye } from "lucide-react";
import { marked } from "marked";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Participant {
  id: string;
  email: string;
  fullName: string;
}

interface RegistrationRow {
  id: string;
  participantId: string;
  participantEmail: string;
  participantName: string;
  eventName?: string;
  isInTeam?: boolean;
  teamCode: string | null;
  teamName: string | null;
  teamMembers: { id: string; email: string; fullName: string }[];
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface TeamInfo {
  teamCode: string;
  teamName: string | null;
  eventName: string;
  members: { id: string; email: string; fullName: string }[];
}

interface RecipientInfo {
  email: string;
  fullName?: string;
  teamName?: string | null;
  teamCode?: string | null;
  eventNames?: string | null;
}

interface AdminMailClientProps {
  canSend: boolean;
}

const PLACEHOLDERS = [
  { key: "{{fullName}}", desc: "Recipient's full name" },
  { key: "{{participantName}}", desc: "Same as fullName" },
  { key: "{{teamName}}", desc: "Team name (from selected event in Placeholder settings)" },
  { key: "{{teamCode}}", desc: "Team code (from selected event)" },
  { key: "{{eventName}}", desc: "Event name (from selected event)" },
  { key: "{{email}}", desc: "Recipient's email" },
] as const;

function buildTeamOptions(r: RecipientInfo): { teamName: string; teamCode: string; eventName: string }[] {
  const teamNames = (r.teamName ?? "").split(/\s*,\s*/).filter(Boolean);
  const teamCodes = (r.teamCode ?? "").split(/\s*,\s*/).filter(Boolean);
  const eventNames = (r.eventNames ?? "").split(/\s*,\s*/).filter(Boolean);
  const maxLen = Math.max(teamNames.length, teamCodes.length, eventNames.length);
  if (maxLen === 0) return [];
  const rows: { teamName: string; teamCode: string; eventName: string }[] = [];
  for (let i = 0; i < maxLen; i++) {
    rows.push({
      teamName: teamNames[i] ?? "",
      teamCode: teamCodes[i] ?? "",
      eventName: eventNames[i] ?? "",
    });
  }
  return rows;
}

function replacePlaceholders(
  text: string,
  r: RecipientInfo & { eventName?: string | null }
): string {
  return text
    .replace(/\{\{fullName\}\}/gi, r.fullName ?? "")
    .replace(/\{\{participantName\}\}/gi, r.fullName ?? "")
    .replace(/\{\{teamName\}\}/gi, r.teamName ?? "")
    .replace(/\{\{teamCode\}\}/gi, r.teamCode ?? "")
    .replace(/\{\{eventName\}\}/gi, r.eventName ?? r.eventNames ?? "")
    .replace(/\{\{eventNames\}\}/gi, r.eventName ?? r.eventNames ?? "")
    .replace(/\{\{email\}\}/gi, r.email ?? "");
}

function aggregateRegistrationsForEmail(
  email: string,
  registrations: RegistrationRow[]
): { teamName: string; teamCode: string; eventNames: string } {
  const regs = registrations.filter(
    (r) => r.participantEmail?.toLowerCase() === email.toLowerCase()
  );
  const teamNames = [...new Set(regs.filter((r) => r.teamName).map((r) => r.teamName!))];
  const teamCodes = [...new Set(regs.filter((r) => r.teamCode).map((r) => r.teamCode!))];
  const eventNames = [...new Set(regs.filter((r) => r.eventName).map((r) => r.eventName!))];
  return {
    teamName: teamNames.join(", "),
    teamCode: teamCodes.join(", "),
    eventNames: eventNames.join(", "),
  };
}

export default function AdminMailClient({ canSend }: AdminMailClientProps) {
  const searchParams = useSearchParams();
  const basePath = getAdminBasePath();
  const toast = useAmongUsToast();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipients, setSelectedRecipients] = useState<
    Map<string, RecipientInfo>
  >(new Map());
  const [subject, setSubject] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [sending, setSending] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiDetails, setAiDetails] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "participants" | "registered" | "teams" | "admins"
  >("participants");
  const recipientDropdownRef = useRef<HTMLDivElement>(null);
  const [recipientDropdownOpen, setRecipientDropdownOpen] = useState(false);
  const urlPreselectionApplied = useRef(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientSearchDebounced, setRecipientSearchDebounced] = useState("");
  const [placeholdersExpanded, setPlaceholdersExpanded] = useState(false);
  const [placeholderSettingsOpen, setPlaceholderSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecipientEmail, setPreviewRecipientEmail] = useState<string>("");
  const [recipientPlaceholderSelection, setRecipientPlaceholderSelection] = useState<
    Map<string, { teamName: string; teamCode: string; eventName: string }>
  >(new Map());
  const [accordionExpanded, setAccordionExpanded] = useState<Set<string>>(new Set());

  // Debounce search: wait ~400ms after last keystroke before filtering
  useEffect(() => {
    if (!recipientDropdownOpen) return;
    const t = setTimeout(() => {
      setRecipientSearchDebounced(recipientSearch);
    }, 400);
    return () => clearTimeout(t);
  }, [recipientSearch, recipientDropdownOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partRes, regRes, usersRes] = await Promise.all([
        fetch("/api/admin-panel/participants", { cache: "no-store" }),
        fetch("/api/admin-panel/registrations", { cache: "no-store" }),
        fetch("/api/admin-panel/users", { cache: "no-store" }),
      ]);

      const partData = await partRes.json().catch(() => ({}));
      const regData = await regRes.json().catch(() => ({}));
      const usersData = await usersRes.json().catch(() => ({}));

      if (partRes.ok) setParticipants(partData.participants ?? []);
      if (regRes.ok) setRegistrations(regData.registrations ?? []);
      if (usersRes.ok) setAdminUsers(usersData.users ?? []);
    } catch (e) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive teams from registrations
  const teams: TeamInfo[] = (() => {
    const map: Record<
      string,
      { teamCode: string; teamName: string | null; eventName: string; members: Map<string, { id: string; email: string; fullName: string }> }
    > = {};
    registrations.forEach((r) => {
      if (r.isInTeam && r.teamCode) {
        if (!map[r.teamCode]) {
          map[r.teamCode] = {
            teamCode: r.teamCode,
            teamName: r.teamName,
            eventName: r.eventName ?? "",
            members: new Map(),
          };
        }
        const m = map[r.teamCode];
        if (r.teamMembers?.length) {
          r.teamMembers.forEach((mem) => {
            if (mem.email) m.members.set(mem.email, mem);
          });
        } else if (r.participantEmail) {
          m.members.set(r.participantEmail, {
            id: r.participantId,
            email: r.participantEmail,
            fullName: r.participantName || "",
          });
        }
      }
    });
    return Object.values(map).map((t) => ({
      teamCode: t.teamCode,
      teamName: t.teamName,
      eventName: t.eventName,
      members: Array.from(t.members.values()),
    }));
  })();

  const registeredEmails = new Set(
    registrations.map((r) => r.participantEmail).filter(Boolean)
  );

  const adminsByRole = {
    admin: adminUsers.filter((u) => u.role === "admin"),
    crewmate: adminUsers.filter((u) => u.role === "crewmate"),
    imposter: adminUsers.filter((u) => u.role === "imposter"),
    camsguy: adminUsers.filter((u) => u.role === "camsguy"),
  };

  const teamParam = searchParams.get("team") ?? "";
  const teamsParam = searchParams.get("teams") ?? "";
  const participantParam = searchParams.get("participant") ?? "";
  const participantsParam = searchParams.get("participants") ?? "";

  // Stable key for URL params - ensures useEffect deps array never changes size
  const urlPreselectKey = `${teamParam}|${teamsParam}|${participantParam}|${participantsParam}`;

  // Pre-selection from URL - run only once when data has loaded (loading becomes false)
  useEffect(() => {
    if (
      urlPreselectionApplied.current ||
      loading ||
      !urlPreselectKey.replace(/\|/g, "").trim()
    ) {
      return;
    }
    urlPreselectionApplied.current = true;
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      const teamCodes = [
        ...(teamParam ? [teamParam] : []),
        ...(teamsParam ? teamsParam.split(",").map((s) => s.trim()) : []),
      ];
      const emailToTeams = new Map<string, { teamNames: string[]; teamCodes: string[]; eventNames: string[] }>();
      teamCodes.forEach((code) => {
        const t = teams.find((x) => x.teamCode === code);
        t?.members.forEach((m) => {
          const existing = emailToTeams.get(m.email) ?? { teamNames: [], teamCodes: [], eventNames: [] };
          if (t.teamName && !existing.teamNames.includes(t.teamName)) existing.teamNames.push(t.teamName);
          if (t.teamCode && !existing.teamCodes.includes(t.teamCode)) existing.teamCodes.push(t.teamCode);
          if (t.eventName && !existing.eventNames.includes(t.eventName)) existing.eventNames.push(t.eventName);
          emailToTeams.set(m.email, existing);
        });
      });
      emailToTeams.forEach((info, email) => {
        const m = teams.flatMap((t) => t.members).find((x) => x.email === email);
        next.set(email, {
          email,
          fullName: m?.fullName || undefined,
          teamName: info.teamNames.length ? info.teamNames.join(", ") : undefined,
          teamCode: info.teamCodes.length ? info.teamCodes.join(", ") : undefined,
          eventNames: info.eventNames.length ? info.eventNames.join(", ") : undefined,
        });
      });
        if (participantParam) {
          const p =
            participants.find((x) => x.id === participantParam) ||
            registrations.find((r) => r.participantId === participantParam);
          const email =
            p && "participantEmail" in p
              ? (p as RegistrationRow).participantEmail
              : p && "email" in p
                ? (p as Participant).email
                : null;
          if (email) {
            const agg = aggregateRegistrationsForEmail(email, registrations);
            next.set(email, {
              email,
              fullName:
                (p as Participant).fullName ||
                (registrations.find((r) => r.participantId === participantParam) as RegistrationRow | undefined)?.participantName ||
                undefined,
              teamName: agg.teamName || undefined,
              teamCode: agg.teamCode || undefined,
              eventNames: agg.eventNames || undefined,
            });
          }
        }
        if (participantsParam) {
          const ids = participantsParam.split(",").map((s) => s.trim());
          ids.forEach((id) => {
            const p =
              participants.find((x) => x.id === id) ||
              registrations.find((r) => r.participantId === id);
            const email =
              p && "participantEmail" in p
                ? (p as RegistrationRow).participantEmail
                : p && "email" in p
                  ? (p as Participant).email
                  : null;
            if (email) {
              const agg = aggregateRegistrationsForEmail(email, registrations);
              next.set(email, {
                email,
                fullName:
                  (p as Participant).fullName ||
                  (registrations.find((r) => r.participantId === id) as RegistrationRow | undefined)?.participantName ||
                  undefined,
                teamName: agg.teamName || undefined,
                teamCode: agg.teamCode || undefined,
                eventNames: agg.eventNames || undefined,
              });
            }
          });
        }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- teams/participants/registrations used from closure; adding them would cause infinite loop
  }, [loading, urlPreselectKey]);

  const toggleRecipient = (info: RecipientInfo) => {
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      if (next.has(info.email)) next.delete(info.email);
      else next.set(info.email, info);
      return next;
    });
  };

  const addTeam = (team: TeamInfo) => {
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      team.members.forEach((m) => {
        const existing = next.get(m.email);
        const existingTeams = existing?.teamName ? existing.teamName.split(", ") : [];
        const existingCodes = existing?.teamCode ? existing.teamCode.split(", ") : [];
        const existingEvents = existing?.eventNames ? existing.eventNames.split(", ") : [];
        const newTeamName = team.teamName ?? "";
        const newTeamCode = team.teamCode ?? "";
        const newEvent = team.eventName ?? "";
        const teamNames = [...new Set([...existingTeams, newTeamName].filter(Boolean))];
        const teamCodes = [...new Set([...existingCodes, newTeamCode].filter(Boolean))];
        const eventNames = [...new Set([...existingEvents, newEvent].filter(Boolean))];
        next.set(m.email, {
          email: m.email,
          fullName: m.fullName || existing?.fullName || undefined,
          teamName: teamNames.length ? teamNames.join(", ") : undefined,
          teamCode: teamCodes.length ? teamCodes.join(", ") : undefined,
          eventNames: eventNames.length ? eventNames.join(", ") : undefined,
        });
      });
      return next;
    });
  };

  const toggleRole = (role: "admin" | "crewmate" | "imposter" | "camsguy") => {
    const roleAdmins = filteredAdminsByRole[role];
    const allSelected = roleAdmins.length > 0 && roleAdmins.every((u) => selectedRecipients.has(u.email));
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      roleAdmins.forEach((u) => {
        const displayName = u.email.split("@")[0] || u.email;
        if (allSelected) {
          next.delete(u.email);
        } else {
          next.set(u.email, { email: u.email, fullName: displayName });
        }
      });
      return next;
    });
  };

  const removeRecipient = (email: string) => {
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      next.delete(email);
      return next;
    });
    setRecipientPlaceholderSelection((prev) => {
      const next = new Map(prev);
      next.delete(email);
      return next;
    });
  };

  const getResolvedRecipient = (r: RecipientInfo): RecipientInfo & { eventName?: string | null } => {
    const selection = recipientPlaceholderSelection.get(r.email);
    const options = buildTeamOptions(r);
    if (selection && options.some((o) => o.teamCode === selection.teamCode && o.eventName === selection.eventName)) {
      return { ...r, teamName: selection.teamName, teamCode: selection.teamCode, eventNames: selection.eventName, eventName: selection.eventName };
    }
    if (options.length > 0) {
      const first = options[0];
      return { ...r, teamName: first.teamName, teamCode: first.teamCode, eventNames: first.eventName, eventName: first.eventName };
    }
    return { ...r, eventName: r.eventNames ?? undefined };
  };

  const handleAiDraft = async () => {
    setAiLoading(true);
    try {
      const hasTeamEventData = selectedList.some((r) => buildTeamOptions(r).length > 0);
      const res = await fetch("/api/admin-panel/mail/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: aiDetails,
          placeholders: PLACEHOLDERS.map((p) => ({ key: p.key, desc: p.desc })),
          recipientCount: selectedList.length,
          hasTeamEventData,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      if (data.subject) setSubject(data.subject);
      setBodyMarkdown(data.email ?? "");
      setAiModalOpen(false);
      setAiDetails("");
      toast.success("Draft generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate draft");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    const recipients = Array.from(selectedRecipients.values()).map((r) => {
      const resolved = getResolvedRecipient(r);
      return {
        email: resolved.email,
        fullName: resolved.fullName,
        teamName: resolved.teamName,
        teamCode: resolved.teamCode,
        eventNames: resolved.eventName ?? resolved.eventNames,
      };
    });
    if (recipients.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }
    if (!subject.trim()) {
      toast.error("Enter a subject");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin-panel/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          bodyMarkdown,
          recipients,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast.success(`Email sent to ${recipients.length} recipient(s)`);
      setSubject("");
      setBodyMarkdown("");
      setSelectedRecipients(new Map());
      setRecipientPlaceholderSelection(new Map());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        recipientDropdownRef.current &&
        !recipientDropdownRef.current.contains(e.target as Node)
      ) {
        setRecipientDropdownOpen(false);
        setRecipientSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedList = Array.from(selectedRecipients.values());

  const searchLower = recipientSearchDebounced.trim().toLowerCase();
  const matchesSearch = (str: string) =>
    !searchLower || str.toLowerCase().includes(searchLower);

  const filteredParticipants = searchLower
    ? participants.filter(
        (p) =>
          matchesSearch(p.fullName) ||
          matchesSearch(p.email) ||
          matchesSearch(p.id)
      )
    : participants;

  const filteredRegistered = searchLower
    ? Array.from(registeredEmails).filter((email) => {
        const reg = registrations.find((r) => r.participantEmail === email);
        const name = reg?.participantName ?? "";
        return matchesSearch(name) || matchesSearch(email);
      })
    : Array.from(registeredEmails);

  const filteredTeams = searchLower
    ? teams.filter(
        (t) =>
          matchesSearch(t.teamName ?? "") ||
          matchesSearch(t.teamCode) ||
          matchesSearch(t.eventName)
      )
    : teams;

  const filteredAdminsByRole = searchLower
    ? {
        admin: adminsByRole.admin.filter((u) => matchesSearch(u.email)),
        crewmate: adminsByRole.crewmate.filter((u) => matchesSearch(u.email)),
        imposter: adminsByRole.imposter.filter((u) => matchesSearch(u.email)),
        camsguy: adminsByRole.camsguy.filter((u) => matchesSearch(u.email)),
      }
    : adminsByRole;

  return (
    <>
      <HandDrawnCard className="p-6 sm:p-8" overflowVisible>
        <h2 className="hand-drawn-title text-white text-2xl mb-4">
          Compose Email
        </h2>

        {/* Recipients */}
        <div className="mb-4" ref={recipientDropdownRef}>
          <label className="block text-cyan text-sm font-semibold mb-2">
            Recipients
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setRecipientDropdownOpen((o) => !o)}
              className="hand-drawn-button flex items-center gap-2"
            >
              <Mail size={18} />
              Add recipients ({selectedList.length} selected)
            </button>
            {recipientDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 w-full max-w-md rounded border border-white/20 bg-black/95 py-2 shadow-xl max-h-80 overflow-y-auto">
                <div className="px-2 mb-2">
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    placeholder="Search by name..."
                    className="hand-drawn-input w-full text-sm"
                  />
                </div>
                <div className="flex border-b border-white/10 mb-2 pb-2">
                  {(
                    [
                      "participants",
                      "registered",
                      "teams",
                      "admins",
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-sm capitalize ${
                        activeTab === tab
                          ? "bg-cyan text-white font-bold"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="px-2 max-h-48 overflow-y-auto">
                  {activeTab === "participants" && (
                    <div className="space-y-1">
                      {filteredParticipants.slice(0, 50).map((p) => {
                          const agg = aggregateRegistrationsForEmail(p.email, registrations);
                          return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRecipients.has(p.email)}
                            onChange={() =>
                              toggleRecipient({
                                email: p.email,
                                fullName: p.fullName,
                                teamName: agg.teamName || undefined,
                                teamCode: agg.teamCode || undefined,
                                eventNames: agg.eventNames || undefined,
                              })
                            }
                          />
                          <span className="text-white text-sm truncate">
                            {p.fullName || p.email} ({p.email})
                          </span>
                        </label>
                      );})}
                      {(filteredParticipants.length > 50 ||
                        (searchLower && filteredParticipants.length === 0)) && (
                        <p className="text-white/50 text-xs px-2">
                          {searchLower && filteredParticipants.length === 0
                            ? "No matches"
                            : "Showing first 50"}
                        </p>
                      )}
                    </div>
                  )}
                  {activeTab === "registered" && (
                    <div className="space-y-1">
                      {filteredRegistered.slice(0, 50).map((email) => {
                          const firstReg = registrations.find(
                            (r) => r.participantEmail === email
                          );
                          const agg = aggregateRegistrationsForEmail(email, registrations);
                          return (
                            <label
                              key={email}
                              className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={selectedRecipients.has(email)}
                                onChange={() =>
                                  toggleRecipient({
                                    email,
                                    fullName: firstReg?.participantName,
                                    teamName: agg.teamName || undefined,
                                    teamCode: agg.teamCode || undefined,
                                    eventNames: agg.eventNames || undefined,
                                  })
                                }
                              />
                              <span className="text-white text-sm truncate">
                                {firstReg?.participantName || email} ({email})
                              </span>
                            </label>
                          );
                      })}
                      {searchLower && filteredRegistered.length === 0 && (
                        <p className="text-white/50 text-xs px-2">No matches</p>
                      )}
                    </div>
                  )}
                  {activeTab === "teams" && (
                    <div className="space-y-2">
                      {filteredTeams.map((team) => (
                        <div
                          key={team.teamCode}
                          className="px-2 py-1 rounded hover:bg-white/5"
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={team.members.every((m) =>
                                selectedRecipients.has(m.email)
                              )}
                              onChange={() => addTeam(team)}
                            />
                            <span className="text-white text-sm font-medium">
                              {team.teamName || team.teamCode} ({team.teamCode}) -{" "}
                              {team.members.length} members
                            </span>
                          </label>
                        </div>
                      ))}
                      {searchLower && filteredTeams.length === 0 && (
                        <p className="text-white/50 text-xs px-2">No matches</p>
                      )}
                    </div>
                  )}
                  {activeTab === "admins" && (
                    <div className="space-y-2">
                      {(
                        [
                          "admin",
                          "crewmate",
                          "imposter",
                          "camsguy",
                        ] as const
                      ).map((role) => (
                        <div
                          key={role}
                          className="px-2 py-1 rounded hover:bg-white/5"
                        >
                          <button
                            type="button"
                            onClick={() => toggleRole(role)}
                            className="text-left w-full text-white text-sm capitalize hover:text-cyan"
                          >
                            {filteredAdminsByRole[role].every((u) =>
                              selectedRecipients.has(u.email)
                            )
                              ? "Deselect all"
                              : "Select all"}{" "}
                            {role}s ({filteredAdminsByRole[role].length})
                          </button>
                          <div className="ml-4 mt-1 space-y-0.5">
                            {filteredAdminsByRole[role].map((u) => (
                              <label
                                key={u.id}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRecipients.has(u.email)}
                                  onChange={() =>
                                    toggleRecipient({
                                      email: u.email,
                                      fullName: u.email.split("@")[0] || u.email,
                                    })
                                  }
                                />
                                <span className="text-white/80 text-xs">
                                  {u.email.split("@")[0]} ({u.email})
                                </span>
                              </label>
                            ))}
                          </div>
                          {searchLower &&
                            filteredAdminsByRole[role].length === 0 && (
                              <p className="text-white/50 text-xs ml-4">
                                No matches
                              </p>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {selectedList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedList.slice(0, 20).map((r) => (
                  <span
                    key={r.email}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white text-xs"
                  >
                    {r.fullName || r.email}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeRecipient(r.email);
                      }}
                      className="hover:text-red-400 shrink-0 p-0.5"
                      aria-label="Remove"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              {selectedList.length > 20 && (
                <span className="text-white/60 text-xs">
                  +{selectedList.length - 20} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="block text-cyan text-sm font-semibold mb-1">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="hand-drawn-input w-full"
            placeholder="Email subject (use {{fullName}}, {{teamName}}, etc.)"
          />
        </div>

        {/* Placeholder settings button */}
        {selectedList.length > 0 && (
          <button
            type="button"
            onClick={() => setPlaceholderSettingsOpen(true)}
            className="hand-drawn-button mb-4 flex items-center gap-2"
            style={{ background: "rgba(0, 200, 200, 0.15)" }}
          >
            <Settings size={18} />
            Placeholder settings
          </button>
        )}

        {/* Placeholders help */}
        <div className="mb-4 rounded border border-white/20 bg-black/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setPlaceholdersExpanded((e) => !e)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-cyan font-semibold hover:bg-white/5"
          >
            {placeholdersExpanded ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
            Personalization placeholders
          </button>
          {placeholdersExpanded && (
            <div className="px-3 pb-3 pt-0 border-t border-white/10">
              <p className="text-white/70 text-sm mb-2">
                Use these in subject and body. Each recipient gets their own
                values:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PLACEHOLDERS.map(({ key, desc }) => (
                  <code
                    key={key}
                    className="px-2 py-1 rounded bg-white/10 text-cyan text-xs font-mono"
                    title={desc}
                  >
                    {key}
                  </code>
                ))}
              </div>
              {selectedList.length > 0 && (
                <div className="rounded bg-black/40 p-3 border border-white/10">
                  <p className="text-cyan text-xs font-semibold mb-2">
                    Example preview (first recipient):
                  </p>
                  <div className="text-white/80 text-sm space-y-1">
                    <div>
                      <span className="text-white/50">Subject: </span>
                      {replacePlaceholders(subject || "Hi {{fullName}}", getResolvedRecipient(selectedList[0])) || "(empty)"}
                    </div>
                    <div className="mt-2 max-h-24 overflow-y-auto">
                      <span className="text-white/50">Body: </span>
                      <span className="whitespace-pre-wrap break-words">
                        {replacePlaceholders(
                          bodyMarkdown || "Hello {{fullName}}, your team {{teamName}}...",
                          getResolvedRecipient(selectedList[0])
                        ).slice(0, 200) || "(empty)"}
                        {(bodyMarkdown?.length ?? 0) > 200 ? "..." : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body - Markdown editor */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-cyan text-sm font-semibold">
              Body (Markdown supported)
            </label>
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="hand-drawn-button py-1 px-2 text-sm flex items-center gap-1"
              style={{ background: "rgba(0, 200, 200, 0.2)" }}
            >
              <Sparkles size={14} />
              Dakshh AI
            </button>
          </div>
          <div data-color-mode="dark" className="md-editor-toolbar-fix">
            <MDEditor
              value={bodyMarkdown}
              onChange={(v) => setBodyMarkdown(v ?? "")}
              height={300}
              preview="live"
              overflow={false}
            />
          </div>
        </div>

        {/* Preview & Send */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedList.length > 0) {
                setPreviewRecipientEmail(selectedList[0].email);
                setPreviewOpen(true);
              }
            }}
            disabled={selectedList.length === 0}
            className="hand-drawn-button py-2 px-4 flex items-center gap-2 disabled:opacity-60"
            style={{ background: "rgba(0, 200, 200, 0.15)" }}
          >
            <Eye size={18} />
            Preview
          </button>
          {canSend && (
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || selectedList.length === 0}
              className="hand-drawn-button py-2 px-6 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
          )}
        </div>
      </HandDrawnCard>

      {/* AI Draft Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md hand-drawn-card p-6">
            <h3 className="hand-drawn-title text-white text-xl mb-2">
              Dakshh AI
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Describe what you want to say and Dakshh AI will craft the email for you.
            </p>
            <textarea
              value={aiDetails}
              onChange={(e) => setAiDetails(e.target.value)}
              className="hand-drawn-input w-full min-h-[120px] mb-4"
              placeholder="e.g. Remind participants about the event tomorrow, include venue and time..."
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAiDraft}
                disabled={aiLoading}
                className="hand-drawn-button py-2 px-4 disabled:opacity-60"
              >
                {aiLoading ? "Generating..." : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiModalOpen(false);
                  setAiDetails("");
                }}
                className="py-2 px-4 text-white/70 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder settings modal */}
      {placeholderSettingsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-lg hand-drawn-card p-6 max-h-[85vh] flex flex-col">
            <h3 className="hand-drawn-title text-white text-xl mb-1">
              Placeholder settings
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Choose which event/team to use for {"{{teamName}}"}, {"{{teamCode}}"}, {"{{eventName}}"} per recipient.
            </p>
            <div className="flex-1 overflow-y-auto space-y-1 mb-4">
              {selectedList.map((r) => {
                const options = buildTeamOptions(r);
                const isExpanded = accordionExpanded.has(r.email);
                const currentSelection = recipientPlaceholderSelection.get(r.email);
                const selectedOption = options.find(
                  (o) => o.teamCode === currentSelection?.teamCode && o.eventName === currentSelection?.eventName
                ) ?? options[0];
                return (
                  <div
                    key={r.email}
                    className="rounded border border-white/20 bg-black/30 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setAccordionExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(r.email)) next.delete(r.email);
                          else next.add(r.email);
                          return next;
                        })
                      }
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-white hover:bg-white/5"
                    >
                      <span className="font-medium truncate pr-2">
                        {r.fullName || r.email}
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={18} className="shrink-0 text-cyan" />
                      ) : (
                        <ChevronRight size={18} className="shrink-0 text-cyan" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-white/10">
                        {options.length === 0 ? (
                          <p className="text-white/50 text-sm py-2">
                            No team/event data for this recipient
                          </p>
                        ) : (
                          <label className="block">
                            <span className="text-cyan text-xs font-semibold block mb-1">
                              Use for placeholders
                            </span>
                            <select
                              value={
                                selectedOption
                                  ? `${selectedOption.teamCode}::${selectedOption.eventName}`
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const [teamCode, eventName] = val.split("::");
                                const opt = options.find(
                                  (o) => o.teamCode === teamCode && o.eventName === eventName
                                );
                                if (opt) {
                                  setRecipientPlaceholderSelection((prev) => {
                                    const next = new Map(prev);
                                    next.set(r.email, opt);
                                    return next;
                                  });
                                }
                              }}
                              className="hand-drawn-select w-full text-sm"
                            >
                              {options.map((opt) => (
                                <option
                                  key={`${opt.teamCode}-${opt.eventName}`}
                                  value={`${opt.teamCode}::${opt.eventName}`}
                                >
                                  {opt.eventName} — {opt.teamName || opt.teamCode}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setPlaceholderSettingsOpen(false)}
              className="hand-drawn-button py-2 px-4 w-full"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Preview modal - portal to body so it appears above navbar */}
      {previewOpen && selectedList.length > 0 && (() => {
        const recipient = selectedList.find((r) => r.email === previewRecipientEmail) ?? selectedList[0];
        const resolved = getResolvedRecipient(recipient);
        const previewSubject = replacePlaceholders(subject || "(No subject)", resolved);
        const previewBody = replacePlaceholders(bodyMarkdown || "(No content)", resolved);
        const previewBodyHtml = marked(previewBody, { gfm: true }) as string;
        return createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-2xl hand-drawn-card p-6 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="hand-drawn-title text-white text-xl">
                  Email preview
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1 text-white/70 hover:text-white"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
              {selectedList.length > 1 && (
                <div className="mb-4">
                  <label className="block text-cyan text-sm font-semibold mb-1">
                    Preview as
                  </label>
                  <select
                    value={previewRecipientEmail}
                    onChange={(e) => setPreviewRecipientEmail(e.target.value)}
                    className="hand-drawn-select w-full"
                  >
                    {selectedList.map((r) => (
                      <option key={r.email} value={r.email}>
                        {r.fullName || r.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-4">
                <div className="text-cyan text-sm font-semibold mb-1">Subject</div>
                <div className="text-white bg-black/30 rounded px-3 py-2 border border-white/10">
                  {previewSubject || "(empty)"}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="text-cyan text-sm font-semibold mb-1">Body</div>
                <p className="text-white/50 text-xs mb-2">
                  Note: Empty new lines might not appear in this preview. But they will appear in the actual email just as in the markdown editor.
                </p>
                <div
                  className="text-white/90 bg-black/30 rounded p-4 border border-white/10 prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewBodyHtml }}
                />
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="mt-4 hand-drawn-button py-2 px-4 w-full"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        );
      })()}
    </>
  );
}
