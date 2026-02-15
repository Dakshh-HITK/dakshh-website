"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import HandDrawnCard from "../components/HandDrawnCard";
import AvatarModal from "./AvatarModal";
import AmongUsGame from "./AmongUsGame";
import { DotOrbit } from "@paper-design/shaders-react";

interface ProfileData {
  username: string;
  avatar: number | null;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  college?: string;
  stream?: string;
  isProfileComplete?: boolean;
  qrPayload?: string;
}

export default function ProfileClient({
  initialUsername,
  initialAvatar,
  initialEmail,
}: {
  initialUsername: string;
  initialAvatar: number | null;
  initialEmail: string;
}) {
  const tabs = [
    { id: "details", label: "Details" },
    { id: "teams", label: "Teams" },
    { id: "events", label: "Events" },
    { id: "arcade", label: "Arcade" },
  ] as const;

  const [profile, setProfile] = useState<ProfileData>({
    username: initialUsername,
    avatar: initialAvatar ?? 1,
    email: initialEmail,
    fullName: "",
    phoneNumber: "",
    college: "",
    stream: "",
    isProfileComplete: false,
  });
  const [activeTab, setActiveTab] = useState<
    "details" | "teams" | "events" | "arcade"
  >("details");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        setProfile({
          username: data.username,
          avatar: data.avatar ?? 1,
          email: data.email ?? "",
          fullName: data.fullName ?? "",
          phoneNumber: data.phoneNumber ?? "",
          college: data.college ?? "",
          stream: data.stream ?? "",
          isProfileComplete: data.isProfileComplete ?? false,
          qrPayload: data.qrPayload ?? "",
        });

        setFormData({
          fullName: data.fullName ?? "",
          phoneNumber: data.phoneNumber ?? "",
          college: data.college ?? "",
          stream: data.stream ?? "",
        });
      } catch {
        // ignore fetch errors for now
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      setProfile((prev) => ({
        ...prev,
        ...data,
      }));
      setIsEditing(false);
    } else {
      const errorData = await res.json();
      alert(errorData.error || "Failed to update profile");
    }
  };

  const handleAvatarSelect = async (avatar: number) => {
    setLoading(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setProfile((p) => ({ ...p, avatar: data.avatar ?? avatar }));
    }
  };

  const displayAvatar = profile.avatar ?? 1;

  const tabs = [
    { id: "details", label: "Details" },
    { id: "teams", label: "Teams" },
    { id: "events", label: "Events" },
    { id: "arcade", label: "Arcade" },
  ] as const;

  return (
    <div className="w-full relative" data-main-content>
      <Navbar />
      <div className="fixed inset-0 w-full h-full z-0">
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

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-35 pb-10">
        <div className="max-w-2xl w-full mx-auto space-y-6 text-center">
          {/* Top Section: Avatar and Username */}
          <HandDrawnCard className="p-6 sm:p-8 relative">
            <div className="absolute top-4 right-4 text-cyan text-xs font-mono">
              {profile.isProfileComplete
                ? "PROFILE COMPLETE"
                : "PROFILE INCOMPLETE"}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-cyan transition-colors ring-2 ring-white/30">
                  <Image
                    src={`/${displayAvatar}.png`}
                    alt="Avatar"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setQrModalOpen(true)}
                    className="absolute inset-0 sm:pointer-events-none"
                    aria-label="Show profile QR"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  disabled={loading}
                  className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 sm:top-0 sm:right-0 sm:bottom-auto sm:left-auto sm:translate-x-1/4 sm:-translate-y-1/4 z-20 w-10 h-10 rounded-full bg-white text-black border-2 border-black shadow-[0_0_0_2px_rgba(0,0,0,0.35)] hover:bg-cyan transition-colors disabled:opacity-60 flex items-center justify-center"
                  title="Edit avatar"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6"
                    aria-hidden="true"
                    fill="currentColor"
                  >
                    <path d="M3 17.25V21h3.75l11-11-3.75-3.75-11 11Zm14.71-9.04a1 1 0 0 0 0-1.42l-1.5-1.5a1 1 0 0 0-1.42 0l-1.13 1.13 3.75 3.75 1.3-1.3Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 z-20 w-10 h-10 rounded-full bg-white text-black border-2 border-black shadow-[0_0_0_2px_rgba(0,0,0,0.35)] hover:bg-yellow transition-colors flex items-center justify-center"
                  title="Show profile QR"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6"
                    aria-hidden="true"
                    fill="currentColor"
                  >
                    <path d="M3 3h7v7H3V3Zm2 2v3h3V5H5Zm9-2h7v7h-7V3Zm2 2v3h3V5h-3ZM3 14h7v7H3v-7Zm2 2v3h3v-3H5Zm9-2h2v2h-2v-2Zm3 0h4v2h-4v-2Zm-3 3h2v4h-2v-4Zm3 3h4v1h-4v-1Zm2-3h2v2h-2v-2Z" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col text-center sm:text-left">
                <h1 className="hand-drawn-title text-white text-4xl! sm:text-4xl mb-2">
                  {profile.username}
                </h1>
                <p className="text-cyan text-sm">
                  {profile.email || "No email"}
                </p>
              </div>
            </div>
          </HandDrawnCard>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`hand-drawn-button px-4 py-2 text-sm sm:text-base transition-all duration-300 ${
                  tab.id === "arcade" ? "hidden md:inline-flex" : ""
                } ${
                  activeTab === tab.id
                    ? "bg-cyan text-black scale-105"
                    : "bg-transparent text-white border-white/50 hover:border-cyan hover:text-cyan"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-100">
            {activeTab === "details" && (
              <HandDrawnCard className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="hand-drawn-title text-white text-2xl">
                    Student Details
                  </h2>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-white text-sm">Full Name</label>
                        <input
                          type="text"
                          value={formData.fullName || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full bg-black/30 border-2 border-white/30 rounded px-3 py-2 text-white focus:border-cyan outline-none"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-white text-sm">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={formData.phoneNumber || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneNumber: e.target.value,
                            })
                          }
                          className="w-full bg-black/30 border-2 border-white/30 rounded px-3 py-2 text-white focus:border-cyan outline-none"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-white text-sm">College</label>
                        <input
                          type="text"
                          value={formData.college || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              college: e.target.value,
                            })
                          }
                          className="w-full bg-black/30 border-2 border-white/30 rounded px-3 py-2 text-white focus:border-cyan outline-none"
                          placeholder="Enter college name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-white text-sm">Stream</label>
                        <input
                          type="text"
                          value={formData.stream || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, stream: e.target.value })
                          }
                          className="w-full bg-black/30 border-2 border-white/30 rounded px-3 py-2 text-white focus:border-cyan outline-none"
                          placeholder="Enter stream (e.g. CSE)"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="hand-drawn-button px-6 py-2 bg-cyan text-black hover:bg-white"
                      >
                        {loading ? "Saving..." : "Save Details"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-white hover:text-red-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <label className="block text-white/50 text-xs uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <p className="text-white text-lg">
                        {profile.fullName || (
                          <span className="text-white/30 italic">Not set</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <p className="text-white text-lg">
                        {profile.phoneNumber || (
                          <span className="text-white/30 italic">Not set</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs uppercase tracking-wider mb-1">
                        College
                      </label>
                      <p className="text-white text-lg">
                        {profile.college || (
                          <span className="text-white/30 italic">Not set</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs uppercase tracking-wider mb-1">
                        Stream
                      </label>
                      <p className="text-white text-lg">
                        {profile.stream || (
                          <span className="text-white/30 italic">Not set</span>
                        )}
                      </p>
                    </div>
                    <div className="md:col-span-2 pt-4 border-t border-white/10">
                      {profile.isProfileComplete ? (
                        <div className="text-green-400 flex items-center gap-2">
                          <span>✓</span> Profile Complete
                        </div>
                      ) : (
                        <div className="text-yellow flex items-center gap-2">
                          <span>⚠️</span> Complete your profile to register for
                          events
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex justify-center mt-6 gap-4">
                        <button
                          onClick={() => {
                            setFormData({
                              fullName: profile.fullName,
                              phoneNumber: profile.phoneNumber,
                              college: profile.college,
                              stream: profile.stream,
                            });
                            setIsEditing(true);
                          }}
                          className="hand-drawn-button px-6 py-2 bg-cyan text-black hover:bg-white"
                        >
                          Edit Details
                        </button>

                        <button
                          onClick={() => signOut()}
                          className="hand-drawn-button px-6 py-2 bg-cyan text-black hover:bg-white"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </HandDrawnCard>
            )}

            {activeTab === "teams" && (
              <HandDrawnCard className="p-6 sm:p-8 text-center min-h-75 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">👥</div>
                <h2 className="hand-drawn-title text-white text-2xl mb-2">
                  My Teams
                </h2>
                <p className="text-white/60">
                  You haven&apos;t joined any teams yet.
                </p>
                <button className="mt-6 hand-drawn-button px-6 py-2 text-sm">
                  Create or Join Team
                </button>
              </HandDrawnCard>
            )}

            {activeTab === "events" && (
              <HandDrawnCard className="p-6 sm:p-8">
                <h2 className="hand-drawn-title text-white text-xl sm:text-2xl mb-4">
                  My Events
                </h2>
                <p className="text-cyan text-sm mb-4">
                  List of events you have registered to
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-white/30">
                        <th className="py-2 pr-4 text-cyan font-semibold">
                          Event / Team Name
                        </th>
                        <th className="py-2 pr-4 text-cyan font-semibold">
                          Crewmates
                        </th>
                        <th className="py-2 text-cyan font-semibold">
                          Date / Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Image
                              src="/1.png"
                              alt=""
                              width={48}
                              height={48}
                              className="opacity-50"
                            />
                            <span className="text-white/60 text-sm">
                              No events yet
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </HandDrawnCard>
            )}

            {activeTab === "arcade" && (
              <HandDrawnCard className="p-6">
                <h2 className="hand-drawn-title text-white text-xl sm:text-2xl mb-2">
                  Bored?
                </h2>
                <p className="text-cyan text-sm mb-4">Welcome to the Arcade!</p>
                <p className="text-white/70 text-sm mb-4 md:hidden">
                  This game is only available on laptops/desktops.
                </p>
                <button
                  type="button"
                  onClick={() => setGameOpen(true)}
                  className="hand-drawn-button w-full py-4 text-lg hidden md:block"
                >
                  PLAY GAME
                </button>
              </HandDrawnCard>
            )}
          </div>
        </div>
      </div>

      <AvatarModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatar={displayAvatar}
        onSelect={handleAvatarSelect}
      />

      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <HandDrawnCard className="w-full max-w-sm p-6 text-center">
            <h3 className="hand-drawn-title text-white text-2xl mb-2">
              Profile QR
            </h3>
            <p className="text-white/70 text-sm mb-4">
              This QR works for all events. Volunteers validate it against the
              selected event registration list.
            </p>
            {profile.qrPayload ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(profile.qrPayload)}`}
                  alt="Profile QR"
                  className="w-52 h-52 rounded border border-white/20 bg-white p-2"
                />
                <p className="text-white/40 text-[10px] break-all">
                  {profile.qrPayload}
                </p>
              </div>
            ) : (
              <p className="text-white/50 text-sm">QR is being prepared.</p>
            )}
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="hand-drawn-button mt-4 px-5 py-2 text-sm"
            >
              Close
            </button>
          </HandDrawnCard>
        </div>
      )}

      {gameOpen && <AmongUsGame onClose={() => setGameOpen(false)} />}
    </div>
  );
}
