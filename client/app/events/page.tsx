"use client";

import Navbar from "../components/Navbar";
import { DotOrbit } from "@paper-design/shaders-react";
import Crewmates from "../components/Crewmates";
import EventCard from "../components/EventCard";
import CategoryDropdown, {
  type Category,
} from "../components/Events/CategoryDropdown";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Power } from "lucide-react";

type PublicEvent = {
  _id: string;
  eventName: string;
  category:
  | "Software"
  | "Hardware"
  | "Entrepreneurship"
  | "Gaming"
  | "Quiz"
  | "Design and Prototyping";
  description: string;
  banner: string;
  clubs: string[];
  date: string;
  time: string;
  venue: string;
  isTeamEvent: boolean;
  isActive: boolean;
  maxMembersPerTeam: number;
  minMembersPerTeam: number;
  prizePool: string;
};

export default function Events() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayLoading, setDisplayLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !displayLoading && events.length > 0) {
      const savedPosition = sessionStorage.getItem("eventsScrollPosition");

      if (savedPosition) {
        window.scrollTo({
          top: parseInt(savedPosition),
          behavior: "auto",
        });

        sessionStorage.removeItem("eventsScrollPosition");
      }
    }
  }, [loading, displayLoading, events]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return events.filter((ev) => {
      const matchesQuery =
        query.length === 0 ? true : ev.eventName.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" ? true : ev.category === selectedCategory;

      const matchesActive =
        showOnlyActive ? ev.isActive === true : true;

      return matchesQuery && matchesCategory && matchesActive;
    });
  }, [events, searchQuery, selectedCategory, showOnlyActive]);

  async function getEvents(): Promise<PublicEvent[]> {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/public`, {
        cache: "no-store",
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      return data as PublicEvent[];
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getEvents().then(setEvents);
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setDisplayLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || displayLoading) {
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

  // Server Component - we render a client component for the interactive parts
  return (
    <div className="w-full min-h-full relative" data-main-content>
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

      <div className="relative z-10 h-full overflow-hidden">
        <Crewmates />
        <div className="relative z-10 pt-24 pb-12 px-4 max-w-7xl mx-auto">
          <h1 className="hand-drawn-title text-4xl sm:text-5xl text-center text-white mb-4">
            All Events
          </h1>
          <p className="text-center text-white/70 mb-8">
            Browse events and filter by category or search by name.
          </p>

          <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/70">
                Active Only
              </span>

              <button
                onClick={() => setShowOnlyActive((prev) => !prev)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300
      ${showOnlyActive ? "bg-green-500/30" : "bg-white/10"}
    `}
              >
                {/* Track Glow */}
                {showOnlyActive && (
                  <div className="absolute inset-0 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                )}

                {/* Knob */}
                <div
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center
        transition-all duration-300
        ${showOnlyActive
                      ? "translate-x-7 bg-green-400 text-black"
                      : "translate-x-0 bg-white/70 text-black"
                    }
      `}
                >
                  <Power size={12} />
                </div>
              </button>
            </div>

            <div className="w-full sm:w-64">
              <CategoryDropdown
                value={selectedCategory}
                onChange={setSelectedCategory}
              />
            </div>

            <div className="w-full sm:flex-1">
              <label htmlFor="event-search" className="sr-only">
                Search events
              </label>
              <input
                id="event-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="hand-drawn-input w-full"
              />
            </div>
          </div>

          {events.length === 0 ? (
            <div className="py-20 text-center text-white/70">
              No events available at the moment. Check back later.
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-20 text-center text-white/70">
              No events match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((ev) => (
                <EventCard
                  key={String(ev._id)}
                  _id={ev._id}
                  eventName={ev.eventName}
                  description={ev.description}
                  category={ev.category}
                  banner={ev.banner}
                  clubs={ev.clubs}
                  date={ev.date}
                  time={ev.time}
                  venue={ev.venue}
                  isTeamEvent={ev.isTeamEvent}
                  isActive={ev.isActive}
                  minMembersPerTeam={ev.minMembersPerTeam}
                  maxMembersPerTeam={ev.maxMembersPerTeam}
                  prizePool={ev.prizePool}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
