"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HandDrawnCard from "./HandDrawnCard";
import { PublicEventProps } from "@/types/interface";
import ReadMoreModal from "./Events/modals/ReadMoreModal";

type LegacyProps = {
  title?: string;
  teams?: string;
  prizePool?: string;
  isActive: boolean;
  featured?: boolean;
};

type Props = Partial<PublicEventProps> & LegacyProps & { featured?: boolean };

export default function EventCard(props: Props) {
  const {
    _id,
    eventName,
    title,
    description,
    category,
    banner,
    date,
    time,
    venue,
    isTeamEvent,
    isActive,
    minMembersPerTeam,
    maxMembersPerTeam,
    prizePool,
    featured = false,
    clubs,
  } = props;

  const [showDesc, setShowDesc] = useState(false);

  const fullDescription = typeof description === "string" ? description : "";
  const { previewDescription, isTruncated } = useMemo(() => {
    const MAX_CHARS = 200;
    const needsTruncate = fullDescription.length > MAX_CHARS;
    return {
      isTruncated: needsTruncate,
      previewDescription: needsTruncate
        ? `${fullDescription.slice(0, MAX_CHARS).trimEnd()}…`
        : fullDescription,
    };
  }, [fullDescription]);

  const displayTitle = eventName ?? title ?? "Untitled Event";
  const displayCategory = category ?? "General";
  const clubList = Array.isArray(clubs)
    ? clubs
    : typeof clubs === "string"
      ? [clubs]
      : [];
  const displayClub = clubList.length > 0 ? clubList[0] : "Club";

  const hasPrizePool =
    prizePool !== undefined &&
    prizePool !== null &&
    String(prizePool).trim() !== "";

  const card = (
    <HandDrawnCard
      className={`h-full flex flex-col ${featured ? "border-yellow border-2 sm:border-3 md:border-4" : ""} cursor-pointer`}
    >
      {/* Top Row: Club Name (Left) + Category (Right) */}
      <div className="flex justify-between items-center mb-4">
        {/* Club Name - Left Side */}
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-xs uppercase text-white/70">{displayClub}</span>
          {isActive && (
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span>
            </div>
          )}
        </div>

        {/* Category Badge - Right Side */}
        <span className="text-[10px]! sm:text-xs! uppercase tracking-wider text-center text-cyan px-2 py-1 border border-cyan rounded">
          {displayCategory}
        </span>
      </div>

      {/* Center Section: Circular Badge with Banner Image */}
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white flex items-center justify-center overflow-hidden bg-black/20">
          {banner ? (
            <Image
              src={banner}
              alt={`${displayTitle} banner`}
              width={120}
              height={120}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Event Title - Below Badge */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
        {displayTitle}
      </h3>

      {/* Description */}
      <div className="mb-4">
        <p className="text-white/70 text-sm sm:text-base text-left">
          {previewDescription}
        </p>

        {isTruncated && (
          <button
            type="button"
            onClick={() => setShowDesc(true)}
            className="mt-2 text-cyan text-xs uppercase tracking-wider hover:underline"
          >
            Read more
          </button>
        )}
      </div>

      {/* Event Details Section - Vertical Stack */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Date + Time (single row) */}
        {(date || time) && (
          <div className="flex items-center gap-2 flex-wrap">
            {date && (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-cyan shrink-0"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <span className="text-white/70 text-sm">{date}</span>
              </>
            )}

            {date && time && <span className="text-white/40 text-xs">•</span>}

            {time && (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-cyan shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-white/70 text-sm">{time}</span>
              </>
            )}
          </div>
        )}

        {/* Venue (next line) */}
        {venue && (
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow shrink-0"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-white/70 text-sm">{venue}</span>
          </div>
        )}

        {/* Format (single row) */}
        {typeof isTeamEvent !== "undefined" && (
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-cyan shrink-0"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-white/70 text-sm">
              Format:{" "}
              {isTeamEvent
                ? `Team (${minMembersPerTeam} - ${maxMembersPerTeam} members)`
                : "Individual"}
            </span>
          </div>
        )}

        {/* Prizepool (separate row) */}
        {hasPrizePool && (
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow shrink-0"
            >
              <path d="M8 21h8" />
              <path d="M12 17v4" />
              <path d="M7 4h10" />
              <path d="M17 4v6a5 5 0 0 1-10 0V4" />
              <path d="M5 6a2 2 0 0 0 2 2" />
              <path d="M19 6a2 2 0 0 1-2 2" />
            </svg>
            <span className="text-white/70 text-sm">
              Prizepool: {prizePool}
            </span>
          </div>
        )}
      </div>

      {/* Bottom: Register Button */}
      <Link
        href={_id ? `/events/${String(_id)}` : "/events"}
        className="block mt-auto"
        onClick={() => {
          sessionStorage.setItem("eventsScrollPosition", window.scrollY.toString());
        }}
      >
        <button className="hand-drawn-button w-full px-3 py-2 text-sm uppercase">
          Explore
        </button>
      </Link>
    </HandDrawnCard>
  );

  return (
    <div className="flex flex-col h-full">
      {card}
      {showDesc && (
        <ReadMoreModal
          text={fullDescription}
          onClose={() => setShowDesc(false)}
        />
      )}
    </div>
  );
}
