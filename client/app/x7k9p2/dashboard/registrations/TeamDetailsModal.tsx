"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Mail } from "lucide-react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import { getAdminBasePath } from "@/lib/admin-config";

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

interface TeamData {
  teamCode: string;
  teamName: string | null;
  members: TeamMember[];
}

interface TeamDetailsModalProps {
  team: TeamData;
  onClose: () => void;
}

export default function TeamDetailsModal({
  team,
  onClose,
}: TeamDetailsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const basePath = getAdminBasePath();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setIsVisible(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex min-h-screen w-full items-center justify-center overflow-y-auto p-3 sm:p-4">
      {/* Backdrop - covers full viewport, above navbar (z-50) */}
      <div
        className={`fixed inset-0 z-0 bg-black/85 backdrop-blur-md transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`relative z-10 w-full max-w-2xl mx-2 sm:mx-0 transition-all duration-300 transform ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Close Button - outside card, solid background so whole area is clickable */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-20 w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-white/60 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer shadow-lg"
          style={{
            filter: "url(#wobbly-border)",
          }}
          aria-label="Close"
        >
          <X size={24} strokeWidth={2.5} style={{
            filter: "url(#wobbly-border)",
          }}/>
        </button>

        <HandDrawnCard className="bg-[#1a1a1a] border-2 border-white/80 p-4 sm:p-6 md:p-8 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6 shrink-0">
            <h2 className="hand-drawn-title text-2xl sm:text-3xl md:text-4xl text-cyan mb-2">
              {team.teamName || "Unnamed Team"}
            </h2>
            <div className="inline-block px-4 py-1 bg-white/10 rounded-full border border-white/20">
              <span className="text-white/70 text-sm font-mono">
                Code: <span className="text-white font-bold">{team.teamCode}</span>
              </span>
            </div>
          </div>

          {/* Members List - scrollable */}
          <div className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-xl text-white font-semibold mb-4 border-b border-white/10 pb-2 shrink-0">
              Crew Members ({team.members.length})
            </h3>
            
            <div className="grid gap-4 overflow-y-auto pr-1 -mr-1">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-lg border bg-white/5 border-white/10 transition-all hover:bg-white/10"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {member.avatar != null && member.avatar >= 1 && member.avatar <= 10 ? (
                        <Image
                          src={`/${member.avatar}.png`}
                          alt=""
                          width={40}
                          height={40}
                          className="rounded-full object-cover w-10 h-10 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-white/30 text-white shrink-0">
                          {(member.fullName || member.username || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium text-lg">
                            {member.fullName || member.username}
                          </span>
                          {member.isLeader && (
                            <span className="px-2 py-1 text-[10px] uppercase font-bold bg-cyan-400 text-black rounded border border-cyan-300">
                              Team Lead
                            </span>
                          )}
                        </div>
                        <div className="text-white/60 text-sm">
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-1 text-sm text-white/70">
                      {member.college && (
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center">🏫</span>
                          <span>{member.college}</span>
                        </div>
                      )}
                      {member.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center">📱</span>
                          <span>{member.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(
                  `/${basePath}/dashboard/mail?team=${encodeURIComponent(team.teamCode)}`
                );
              }}
              className="hand-drawn-button py-2 px-4 flex items-center gap-2"
              style={{ background: "rgba(0, 200, 200, 0.2)" }}
            >
              <Mail size={18} />
              Email team
            </button>
            <span className="text-white/30 text-xs italic">
              Who is the imposter?
            </span>
          </div>
        </HandDrawnCard>
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(modalContent, document.body);
}
