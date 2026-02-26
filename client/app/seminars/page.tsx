"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Calendar, MapPin, Video, Users, Quote } from "lucide-react";
import Navbar from "../components/Navbar";
import { DotOrbit } from "@paper-design/shaders-react";
import Crewmates from "../components/Crewmates";

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
  id: string;
  title: string;
  speaker: string;
  speakerImage: string;
  speakerBio: string;
  description: string;
  speakerNote?: string;
  dateTime: string;
  mode: "online" | "offline";
  venue: string;
  isPast: boolean;
}

const seminars: SeminarData[] = [
  {
    id: "1",
    title: "Quantum Computing: The Next Frontier",
    speaker: "Dr. Ananya Bose",
    speakerImage: "/peeking.png",
    speakerBio:
      "Dr. Ananya Bose is a leading researcher in quantum algorithms and computational physics with over 12 years of academic and industry experience.",
    description:
      "Explore the fascinating world of quantum computing and its potential to revolutionize technology.",
    speakerNote: "Bring your curiosity and questions about the quantum realm!",
    dateTime: "2026-03-15T18:00:00",
    mode: "online",
    venue: "Zoom Webinar",
    isPast: false,
  },
  {
    id: "2",
    title: "AI Ethics in Modern Society",
    speaker: "Prof. Sisir Kumar Das",
    speakerImage: "/peeking2.png",
    speakerBio:
      "Professor Sisir Kumar Das specializes in AI governance, ethics, and policy frameworks for responsible machine learning systems.",
    description:
      "A deep dive into the ethical implications of artificial intelligence and responsible AI development.",
    dateTime: "2026-03-22T19:00:00",
    mode: "offline",
    venue: "SV Auditorium, CB Building",
    isPast: false,
  },
  {
    id: "3",
    title: "Blockchain and Cryptocurrency Fundamentals",
    speaker: "Ms. Riya Sen",
    speakerImage: "/peeking.png",
    speakerBio:
      "Riya Sen is a blockchain consultant helping startups build secure decentralized applications.",
    description: "Understanding blockchain technology and crypto fundamentals.",
    dateTime: "2026-02-10T18:00:00",
    mode: "offline",
    venue: "ICT, Room 302",
    isPast: true,
  },
];

function SeminarCard({
  seminar,
  onClick,
}: {
  seminar: SeminarData;
  onClick: () => void;
}) {
  const date = new Date(seminar.dateTime);

  const statusStyles = seminar.isPast
    ? "border-slate-500 shadow-[4px_4px_0px_0px_rgba(100,116,139,1)] opacity-80"
    : "border-cyan-400 shadow-[6px_6px_0px_0px_rgba(34,211,238,1)] hover:-translate-y-1 transition-transform";

  return (
    <HandCard
      onClick={onClick}
      className={`relative cursor-pointer flex flex-col justify-around items-center p-6 bg-slate-900 border-2 rounded-xl overflow-hidden ${statusStyles}`}
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

      <div className="pt-4 w-full flex flex-col md:flex-row justify-between items-center border-t border-slate-800 text-sm text-slate-400">
        <div className="flex items-center gap-3">
          <Calendar size={16} />
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          —{" "}
          {date.toLocaleTimeString([], {
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

      {seminar.isPast && (
        <div className="absolute top-8 right-6 rotate-[-14deg] border-[3px] border-red-700 px-6 py-2 text-3xl font-black uppercase tracking-[0.25em] text-red-700 rounded-lg bg-black/60 backdrop-blur-sm shadow-[0_0_25px_rgba(185,28,28,0.45)]">
          DONE
        </div>
      )}
    </HandCard>
  );
}

function SeminarModal({
  seminar,
  onClose,
}: {
  seminar: SeminarData;
  onClose: () => void;
}) {
  const date = new Date(seminar.dateTime);

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
            📅 {date.toLocaleDateString()} —{" "}
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div>
            📍 {seminar.mode} • {seminar.venue}
          </div>
        </div>

        {!seminar.isPast ? (
          <button className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition">
            Register Now
          </button>
        ) : (
          <div className="text-center text-red-500 font-bold text-lg">
            Registration Closed
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

  const upcoming = seminars.filter((s) => !s.isPast);
  const past = seminars.filter((s) => s.isPast);

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
                key={seminar.id}
                seminar={seminar}
                onClick={() => setSelectedSeminar(seminar)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-8 text-gray-400">
            Past Seminars
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {past.map((seminar) => (
              <SeminarCard
                key={seminar.id}
                seminar={seminar}
                onClick={() => setSelectedSeminar(seminar)}
              />
            ))}
          </div>
        </section>
      </main>

      {selectedSeminar && (
        <SeminarModal
          seminar={selectedSeminar}
          onClose={() => setSelectedSeminar(null)}
        />
      )}
    </div>
  );
}
