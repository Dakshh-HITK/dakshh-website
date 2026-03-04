"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Calendar, MapPin, Video, Users, Quote } from "lucide-react";
import Navbar from "../components/Navbar";
import { DotOrbit } from "@paper-design/shaders-react";
import Crewmates from "../components/Crewmates";
import axios from "axios";

interface HandCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

function HandCard({ children, className = "", ...props }: HandCardProps) {
  return (
    <div className={`hand-drawn-card ${className}`} {...props}>
      {children}
    </div>
  );
}

interface SeminarData {
  _id: string;
  title: string;
  speaker: string;
  speakerImage: string;
  speakerBio: string;
  description: string;
  speakerNote?: string;
  dateTime: string;
  mode: "online" | "offline";
  venue: string;
  isActive?: boolean;
  isRegisterationNeeded?: boolean;
  club?: string;
}

function SeminarCard({
  seminar,
  onClick,
}: {
  seminar: SeminarData;
  onClick: () => void;
}) {
  const now = new Date();
  const seminarDate = new Date(seminar.dateTime);
  const isPast = seminarDate < now;

  const statusStyles = isPast
    ? "border-slate-500 shadow-[4px_4px_0px_0px_rgba(100,116,139,1)] opacity-80"
    : "border-cyan-400 shadow-[6px_6px_0px_0px_rgba(34,211,238,1)] hover:-translate-y-1 transition-transform";

  return (
    <HandCard
      onClick={onClick}
      className={`relative cursor-pointer flex flex-col justify-between items-center p-6 bg-slate-900 border-2 rounded-xl overflow-hidden ${statusStyles}`}
    >
      <h3 className="text-2xl font-black text-white mb-4 border-b border-slate-700 pb-3">
        {seminar.title}
      </h3>

      <div className="flex items-center gap-2 text-cyan-400 font-medium mb-4">
        <Users size={20} />
        <span className="uppercase tracking-wider text-lg">
          {seminar.speaker}
        </span>
      </div>

      <p className="text-slate-400 mb-6 leading-relaxed">
        {seminar.description}
      </p>

      {seminar.speakerNote && (
        <div className="flex gap-3 bg-cyan-950/20 p-4 mb-6 border-l-4 border-cyan-500 italic">
          <Quote size={20} className="text-cyan-500 shrink-0" />
          <p className="text-sm text-cyan-100">"{seminar.speakerNote}"</p>
        </div>
      )}

      {seminar.club && (
        <span className="text-sm text-slate-200 mb-2">
          Organized by{" "}
          <span className="text-red-400 font-medium uppercase tracking-wider">
            {seminar.club}
          </span>
        </span>
      )}

      <div className="pt-4 w-full flex flex-col md:flex-row justify-between items-center border-t border-slate-800 text-sm text-slate-400">
        <div className="flex items-center gap-3">
          <Calendar size={16} />
          {seminarDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          —{" "}
          {seminarDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <div className="flex items-center gap-3 mt-3 md:mt-0">
          {seminar.mode === "online" ? (
            <Video size={16} />
          ) : (
            <MapPin size={16} />
          )}
          <span className="capitalize">
            {seminar.mode} • {seminar.venue}
          </span>
        </div>
      </div>

      {seminar.isActive && (
        <div className="flex items-center">
          <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span>
          <span className="ml-2 text-green-400 font-bold">Active</span>
        </div>
      )}

      <div className="absolute top-0 left-0 border bg-black/60 backdrop-blur-2xl w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-bold text-lg uppercase tracking-wider">
        Click for details
      </div>

      {isPast && (
        <div className="absolute top-8 right-6 rotate-[-14deg] border-[3px] border-red-700 px-6 py-2 text-3xl font-black uppercase tracking-[0.25em] text-red-700 rounded-lg bg-black/60 backdrop-blur-sm shadow-[0_0_25px_rgba(185,28,28,0.45)]">
          DONE
        </div>
      )}
    </HandCard>
  );
}

function SeminarModal({
  userRegisteredSeminars,
  register,
  seminar,
  onClose,
}: {
  userRegisteredSeminars: string[];
  register: (seminarId: string) => Promise<void>;
  seminar: SeminarData;
  onClose: () => void;
}) {
  const seminarDate = new Date(seminar.dateTime);
  const isPast = seminarDate < new Date();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
      onClick={onClose}
    >
      <HandCard
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900 border-2 border-cyan-400 p-8 rounded-2xl animate-scaleIn shadow-[8px_8px_0px_0px_rgba(34,211,238,1)]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
        >
          ✕
        </button>

        <h2 className="text-3xl md:text-4xl font-black text-white mb-6 border-b border-slate-700 pb-4">
          {seminar.title}
        </h2>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative w-40 h-40 flex-shrink-0">
            <Image
              src={seminar.speakerImage}
              alt={seminar.speaker}
              fill
              className="rounded-xl object-cover border-2 border-cyan-500"
            />
          </div>

          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-2">
              {seminar.speaker}
            </h3>
            <p className="text-slate-400 leading-relaxed">
              {seminar.speakerBio}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-lg font-semibold text-white mb-3">
            About This Seminar
          </h4>
          <p className="text-slate-300 leading-relaxed">
            {seminar.description}
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-slate-700 pt-6 mb-6 text-sm text-slate-400">
          <div>
            📅{" "}
            {seminarDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            —{" "}
            {seminarDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div>
            📍 {seminar.mode} • {seminar.venue}
          </div>
        </div>

        {!isPast && seminar.isRegisterationNeeded && seminar.isActive && (
          <div className="text-center">
            {userRegisteredSeminars.includes(seminar._id) ? (
              <div className="text-green-400 font-bold text-lg">
                You are already onBoard!
              </div>
            ) : (
              <button
                onClick={() => register(seminar._id)}
                className="inline-block bg-cyan-500 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-cyan-600 transition-colors"
              >
                Register Now
              </button>
            )}
          </div>
        )}

        {!isPast && seminar.isActive && !seminar.isRegisterationNeeded && (
          <div className="text-center text-green-400 font-bold text-lg">
            No Registration Required - Join Us Live!
          </div>
        )}

        {!isPast && !seminar.isActive && (
          <div className="text-center text-yellow-400 font-bold text-lg">
            Coming Soon
          </div>
        )}

        {isPast && (
          <div className="text-center text-red-500 font-bold text-lg">
            Event Ended
          </div>
        )}
      </HandCard>
    </div>
  );
}

export default function SeminarsPage() {
  const [selectedSeminar, setSelectedSeminar] = useState<SeminarData | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [userRegisteredSeminars, setUserRegisteredSeminars] = useState<
    string[]
  >([]);
  const [seminars, setSeminars] = useState<SeminarData[]>([]);

  useEffect(() => {
    async function fetchSeminars() {
      setLoading(true);
      try {
        const response = await axios.get("/api/seminar");
        setSeminars(response.data.SeminarData);
        setUserRegisteredSeminars(response.data.userRegisteredSeminars);
      } catch (error) {
        console.error("Failed to fetch seminar data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSeminars();
  }, []);

  const register = async (seminarId: string) => {
    try {
      const response = await axios.post("/api/seminar/registration", {
        seminarId,
      });
      alert(response.data.message);
      setUserRegisteredSeminars((prev) =>
        prev.includes(seminarId) ? prev : [...prev, seminarId],
      );
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to register for seminar");
    }
  };

  const now = new Date();

  const { upcoming, past } = useMemo(() => {
    const now = new Date();

    const upcomingSeminars = seminars
      .filter((s) => new Date(s.dateTime) >= now)
      .sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );

    const pastSeminars = seminars
      .filter((s) => new Date(s.dateTime) < now)
      .sort(
        (a, b) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
      );

    return { upcoming: upcomingSeminars, past: pastSeminars };
  }, [seminars]);


  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
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

        <Image
          src="/among-us-thumbs-up.gif"
          alt="Loading"
          className="object-contain drop-shadow-2xl"
          height={120}
          width={120}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen relative">
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

      <div className="absolute inset-0 h-full overflow-hidden pointer-events-none z-0">
        <Crewmates />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-16">
        <section>
          <h2 className="text-3xl font-bold mb-8 text-white">
            Upcoming Seminars
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {upcoming.map((seminar) => (
              <SeminarCard
                key={seminar._id}
                seminar={seminar}
                onClick={() => setSelectedSeminar(seminar)}
              />
            ))}
          </div>
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-8 text-gray-400">
              Past Seminars
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {past.map((seminar) => (
                <SeminarCard
                  key={seminar._id}
                  seminar={seminar}
                  onClick={() => setSelectedSeminar(seminar)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {selectedSeminar && (
        <SeminarModal
          userRegisteredSeminars={userRegisteredSeminars}
          register={register}
          seminar={selectedSeminar}
          onClose={() => setSelectedSeminar(null)}
        />
      )}
    </div>
  );
}
