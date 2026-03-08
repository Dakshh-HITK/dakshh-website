"use client";

import Navbar from "@/app/components/Navbar";
import { DotOrbit } from "@paper-design/shaders-react";
import Crewmates from "@/app/components/Crewmates";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import DialCarousel from "@/app/components/Events/DialCarousel";
import BackVentButton from "@/app/components/Events/BackVentButton";

import RulesModal from "@/app/components/Events/modals/RulesModal";
import PocModal from "@/app/components/Events/modals/PocModal";
import { MessageSquare, ScrollText, FileText } from "lucide-react";
import { EventDetails } from "@/types/interface";
import CreateTeamModal from "@/app/components/Events/modals/CreateTeamModal";
import ConfirmationModal from "@/app/components/Events/modals/ConfirmationModal";

const EventPage = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const id = useMemo(() => {
    const fromParams = params?.id;
    if (typeof fromParams === "string") return fromParams;
    if (Array.isArray(fromParams) && fromParams[0]) return fromParams[0];
    if (pathname?.startsWith("/events/")) {
      const segments = pathname.split("/").filter(Boolean);
      const eventsIdx = segments.indexOf("events");
      if (eventsIdx !== -1 && segments[eventsIdx + 1])
        return segments[eventsIdx + 1];
    }
    return null;
  }, [params?.id, pathname]);

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<boolean>(false);
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [displayLoading, setDisplayLoading] = useState(true);

  const [showRules, setShowRules] = useState(false);
  const [showPoc, setShowPoc] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showSoloConfirm, setShowSoloConfirm] = useState(false);
  const [completingPayment, setCompletingPayment] = useState(false);
  const [unstopLinks, setUnstopLinks] = useState<Record<string, string>>({});

  const fetchData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    const alreadyHaveEvent = event?._id === id;
    if (!alreadyHaveEvent) setLoading(true);
    let redirecting = false;
    try {
      const eventRes = await fetch(`/api/events/${id}`, {
        credentials: "include",
      });
      if (eventRes.status === 401) {
        redirecting = true;
        const callbackUrl = encodeURIComponent(`/events/${id}`);
        const message = encodeURIComponent(
          "Please log in to view event details",
        );
        router.replace(`/auth?callbackUrl=${callbackUrl}&message=${message}`);
        return;
      }
      if (!eventRes.ok) throw new Error("Failed to fetch event");
      const eventData = await eventRes.json();
      setEvent(eventData);

      const similarEvents = await fetch(
        `/api/events/similar?category=${eventData.category}`,
        { credentials: "include" },
      );
      if (similarEvents.ok) {
        const allData = await similarEvents.json();
        setAllEvents(allData);
      }
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || "Failed to fetch events");
    } finally {
      if (!redirecting) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    fetch("/api/events/unstop-links")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, string>) => setUnstopLinks(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) {
      document.body.classList.add("loader-complete");
      document.body.classList.remove("loader-ready");
      document.body.style.overflow = "";
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setDisplayLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleRegistrationResponse = async (registration: Response) => {
    const data = await registration.json().catch(() => ({}));
    let redirecting = false;

    if (registration.status === 401) {
      redirecting = true;
      const callbackUrl = encodeURIComponent(`/events/${id}`);
      const message = encodeURIComponent("Please log in to view event details");
      toast.error(data.error || "Please log in to continue");
      router.replace(`/auth?callbackUrl=${callbackUrl}&message=${message}`);
      return { redirecting, data };
    }

    if (data.isProfileComplete === false) {
      redirecting = true;
      const callbackUrl = encodeURIComponent(`/events/${id}`);
      const message = encodeURIComponent("Please complete your details");
      toast.error(data.error);
      router.replace(`/profile?callbackUrl=${callbackUrl}&message=${message}`);
      return { redirecting, data };
    }

    if (!registration.ok) {
      toast.error(data.error || "Failed to register in event");
      return { redirecting, data };
    }

    if (data.message) {
      toast.success(data.message);
    }
    await fetchData();
    return { redirecting, data };
  };

  const registerSoloEvent = async () => {
    if (!id || !event) return;

    setRegistering(true);
    let redirecting = false;

    try {
      const endpoint = event.isPaidEvent
        ? `/api/registration/solo/paid/${id}`
        : `/api/registration/solo/${id}`;

      const registration = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const response = await handleRegistrationResponse(registration);
      redirecting = response.redirecting;
    } catch (error) {
      console.error(error);
      toast.error(
        (error as Error)?.message || "Failed to Register in the event",
      );
    } finally {
      if (!redirecting) setRegistering(false);
    }
  };

  const openSoloConfirmation = () => {
    if (loading || registering || Boolean(event?.userRegistration?.isRegistered)) {
      return;
    }
    setShowSoloConfirm(true);
  };

  const confirmSoloRegistration = async () => {
    setShowSoloConfirm(false);
    await registerSoloEvent();
  };

  const createTeam = async (teamName: string) => {
    if (!id || !event) return;
    setShowCreateTeam(false);
    setRegistering(true);
    let redirecting = false;

    const endpoint = event.isPaidEvent
      ? `/api/registration/team/paid/${id}`
      : `/api/registration/team/create/${id}`;

    try {
      const registration = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName }),
      });
      const response = await handleRegistrationResponse(registration);
      redirecting = response.redirecting;
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || "Failed to create team");
    } finally {
      if (!redirecting) setRegistering(false);
    }
  };

  const joinTeam = async () => {
    if (!id || !event) return;
    if (!teamCodeInput.trim()) {
      toast.error("Enter a valid team code");
      return;
    }

    setRegistering(true);
    let redirecting = false;

    try {
      const endpoint = event.isPaidEvent
        ? `/api/registration/team/paid/join/${id}`
        : `/api/registration/team/join/${id}`;

      const registration = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamCode: teamCodeInput.trim().toUpperCase() }),
      });
      const response = await handleRegistrationResponse(registration);
      redirecting = response.redirecting;
      if (registration.ok) {
        setTeamCodeInput("");
      }
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || "Failed to join team");
    } finally {
      if (!redirecting) setRegistering(false);
    }
  };

  const completePayment = async () => {
    if (!id || !event?.myTeam?._id) return;

    setCompletingPayment(true);

    try {
      const response = await fetch(
        `/api/registration/team/complete-payment/${event.myTeam._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to complete payment");
        return;
      }

      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || "Failed to complete payment");
    } finally {
      setCompletingPayment(false);
    }
  };

  const completeSoloPayment = async () => {
    if (!id || !event?.userRegistration?.registrationId) return;

    setCompletingPayment(true);

    try {
      const response = await fetch(
        `/api/registration/solo/complete-payment/${event.userRegistration.registrationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to complete payment");
        return;
      }

      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || "Failed to complete payment");
    } finally {
      setCompletingPayment(false);
    }
  };

  if (loading || displayLoading) {
    return (
      <div className="min-h-screen w-screen bg-black text-white flex items-center justify-center">
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

        <img
          src="/kill.gif"
          alt="Loading"
          className="object-contain drop-shadow-2xl w-1/3 bg-none"
        />
      </div>
    );
  }

  if (!id && !event) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        <p className="text-white/80">Invalid event URL.</p>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black text-white font-sans selection:bg-red-500 selection:text-white">
      <Navbar />

      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
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

      <div className="fixed inset-0 z-10 pointer-events-none">
        <Crewmates />
      </div>

      {id && <DialCarousel events={allEvents} activeId={id} />}

      <main className="relative z-20 pt-24 sm:pb-12 pb-20 px-4 w-full h-full flex flex-col items-center">
        <div className="w-full max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <BackVentButton />

          <div className="flex-1 lg:pl-32 mt-10 flex justify-center md:justify-start">
            <div className="inline-flex items-center gap-3">
              {event.banner && (
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-3 border-white/60 shrink-0 bg-black/40"
                  style={{ filter: "url(#wobbly-border)" }}
                >
                  <img
                    src={event.banner}
                    alt={event.eventName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h1 className="hand-drawn-title text-3xl! sm:text-5xl! lg:text-6xl! text-white">
                {event.eventName}
              </h1>
            </div>
          </div>

          <div className="hidden md:block">
            <div
              className="border-2 border-white rounded-2xl px-6 py-3 bg-black/50 rotate-2 transform hover:rotate-0 transition-transform duration-300"
              style={{ filter: "url(#wobbly-border)" }}
            >
              <p className="text-sm uppercase tracking-widest text-gray-400">
                Date
              </p>
              <p className="text-2xl font-bold">{event.date}</p>
              <p className="text-sm text-yellow-400">{event.time}</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="hidden lg:block lg:col-span-1"></div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="block md:hidden mb-4">
              <div className="border-2 border-white rounded-xl px-4 py-2 bg-black/50 text-center">
                <p className="font-bold">
                  {event.date} • {event.time}
                </p>
              </div>
            </div>

            <HandDrawnCard className="min-h-[400px] flex flex-col p-6 sm:p-10 relative group">
              <h2 className="text-2xl! md:text-4xl! font-bold mb-6 text-yellow-400 uppercase tracking-wider">
                Mission Instructions
              </h2>

              <div className="prose prose-invert max-w-none flex-1 overflow-y-auto pr-2 custom-scrollbar text-lg leading-relaxed">
                <p>{event.description}</p>

                {event.isTeamEvent && (
                  <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <p className="text-blue-300 font-bold mb-1">Team Mission</p>
                    <p className="text-sm">
                      Members: {event.minMembersPerTeam} -{" "}
                      {event.maxMembersPerTeam}
                    </p>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {event.category && (
                    <div className="p-3 bg-white/5 rounded">
                      <span className="text-xs text-gray-400 block uppercase">
                        Category
                      </span>
                      <span className="font-mono text-purple-300">
                        {event.category}
                      </span>
                    </div>
                  )}
                  <div className="p-3 bg-white/5 rounded">
                    <span className="text-xs text-gray-400 block uppercase">
                      Venue
                    </span>
                    <span className="font-mono">{event.venue}</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded">
                    <span className="text-xs text-gray-400 block uppercase">
                      Prize Pool
                    </span>
                    <span className="font-mono text-yellow-400">
                      {event.prizePool}
                    </span>
                  </div>
                  {event.duration && (
                    <div className="p-3 bg-white/5 rounded">
                      <span className="text-xs text-gray-400 block uppercase">
                        Duration
                      </span>
                      <span className="font-mono">{event.duration}</span>
                    </div>
                  )}
                  <div className="p-3 bg-white/5 rounded">
                    <span className="text-xs text-gray-400 block uppercase">
                      Entry Fee
                    </span>
                    <span className="font-mono text-green-400">
                      {event.isPaidEvent ? `₹${event.fees}` : "Free"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sticky bottom-0 pt-4 bg-linear-to-t from-black/90 to-transparent space-y-3">
                {/* ── UNSTOP REDIRECT (Hack Among Us / Skeld Sprint / ModelForge) ── */}
                {unstopLinks[event.eventName] ? (
                  <div className="flex justify-center">
                    <a
                      href={unstopLinks[event.eventName]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <button className="hand-drawn-button text-xl px-12 py-4 bg-green-600 hover:bg-green-700 w-full">
                        Register on Unstop
                      </button>
                    </a>
                  </div>
                ) : (
                  /* ── ORIGINAL REGISTRATION UI (kept, not removed) ── */
                  <>
                    {!event.isActive ? (
                      <div className="flex justify-center">
                        <button
                          className="hand-drawn-button text-xl px-12 py-4 cursor-not-allowed w-full sm:w-auto opacity-80"
                          disabled
                        >
                          COMING SOON
                        </button>
                      </div>
                    ) : event.isTeamEvent ? (
                      event.userRegistration?.isRegistered && event.myTeam ? (
                        <div className="rounded-lg border border-blue-500/40 bg-blue-900/20 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-blue-200 font-semibold">
                              You are in a team
                            </p>
                            <p className="text-xs text-blue-100">
                              {event.myTeam.teamSize}/{event.maxMembersPerTeam}{" "}
                              members
                            </p>
                          </div>

                          <p className="text-xs text-blue-100/80">Team Name</p>
                          <p className="font-mono text-white break-all">
                            {event.myTeam.teamName}
                          </p>

                          <p className="text-xs text-blue-100/80">Team Code</p>
                          <p className="font-mono text-white break-all">
                            {event.myTeam.teamCode}
                          </p>
                          <div className="space-y-1">
                            {event.myTeam.members?.map((member) => {
                              const displayName =
                                member.fullName || member.username || "Unknown";
                              return (
                                <div
                                  key={member._id}
                                  className="flex items-center justify-between text-sm text-blue-50"
                                >
                                  <span>{displayName}</span>
                                  {member.isLeader && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-200">
                                      Leader
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {event.isPaidEvent &&
                            event.myTeam.isTeamLeader &&
                            event.myTeam.paymentStatus !== "completed" && (
                              <button
                                className="hand-drawn-button w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                                onClick={completePayment}
                                disabled={completingPayment}
                              >
                                {completingPayment ? (
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span>💳</span>
                                    <span>Complete Payment</span>
                                  </>
                                )}
                              </button>
                            )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              value={teamCodeInput}
                              onChange={(e) => setTeamCodeInput(e.target.value)}
                              placeholder="Enter Team Code (e.g. DAKSHH-ABCD12)"
                              className="flex-1 rounded-lg border border-white/25 bg-black/70 px-3 py-2 text-sm outline-none focus:border-cyan"
                              disabled={loading || registering}
                            />
                            <button
                              className="hand-drawn-button px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm"
                              disabled={loading || registering}
                              onClick={joinTeam}
                            >
                              {registering ? (
                                <div className="w-6 h-6 mx-10 border-4 border-red-100 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                "JOIN TEAM"
                              )}
                            </button>
                          </div>
                          <button
                            className="hand-drawn-button text-xl px-12 py-4 bg-red-600 hover:bg-red-700 w-full"
                            disabled={loading || registering}
                            onClick={() => setShowCreateTeam(true)}
                          >
                            {registering ? (
                              <div className="w-6 h-6 mx-10 border-4 border-red-100 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "CREATE MY TEAM"
                            )}
                          </button>
                        </div>
                      )
                    ) : event.userRegistration?.isRegistered ? (
                      event.isPaidEvent && !event.userRegistration?.verified ? (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <button
                              className="hand-drawn-button text-xl px-12 py-4 bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto"
                              disabled={loading || completingPayment}
                              onClick={completeSoloPayment}
                            >
                              {completingPayment ? (
                                <div className="w-6 h-6 mx-10 border-4 border-red-100 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                "COMPLETE PAYMENT"
                              )}
                            </button>
                          </div>
                          <p className="text-center text-sm text-yellow-200">
                            Payment pending - Complete payment to verify registration
                          </p>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <button
                            className="hand-drawn-button text-xl px-12 py-4 bg-green-600 hover:bg-green-700 w-full sm:w-auto cursor-not-allowed"
                            disabled
                          >
                            REGISTERED
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-center">
                        <button
                          className="hand-drawn-button text-xl px-12 py-4 bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                          disabled={
                            loading ||
                            registering ||
                            Boolean(event.userRegistration?.isRegistered)
                          }
                          onClick={openSoloConfirmation}
                        >
                          {registering ? (
                            <div className="w-6 h-6 mx-10 border-4 border-red-100 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "REGISTER"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </HandDrawnCard>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <button
              onClick={() => setShowRules(true)}
              className="group relative"
            >
              <HandDrawnCard className="p-6 transition-transform group-hover:-translate-y-1 bg-blue-900/20 group-hover:bg-blue-900/40 border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold uppercase">
                    Rules & Regulations
                  </span>
                  <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
                    <ScrollText />
                  </div>
                </div>
              </HandDrawnCard>
            </button>

            {event.pocs && event.pocs.length > 0 && (
              <button
                onClick={() => setShowPoc(true)}
                className="group relative"
              >
                <HandDrawnCard className="p-6 transition-transform group-hover:-translate-y-1 bg-green-900/20 group-hover:bg-green-900/40 border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold uppercase">
                      Contact POCs
                    </span>
                    <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
                      <MessageSquare />
                    </div>
                  </div>
                </HandDrawnCard>
              </button>
            )}

            {event.clubs && event.clubs.length > 0 && (
              <HandDrawnCard className="p-6 bg-purple-900/20 border-purple-300">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 text-center">
                  Organized By
                </p>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl font-bold text-purple-200 tracking-wide">
                    {event.clubs[0]}
                  </span>
                  {event.clubs.length > 1 && (
                    <>
                      <span className="text-sm text-gray-500 font-mono">✕</span>
                      <span className="text-2xl font-bold text-purple-200 tracking-wide">
                        {event.clubs[1]}
                      </span>
                    </>
                  )}
                </div>
              </HandDrawnCard>
            )}
            {event.doc && (
              <a
                href={event.doc}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block"
              >
                <HandDrawnCard className="p-6 transition-transform group-hover:-translate-y-1 bg-amber-900/20 group-hover:bg-amber-900/40 border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold uppercase">
                      Download Mission Protocol
                    </span>
                    <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
                      <FileText />
                    </div>
                  </div>
                </HandDrawnCard>
              </a>
            )}
          </div>
        </div>
      </main>

      {showRules && (
        <RulesModal rules={event.rules} onClose={() => setShowRules(false)} />
      )}

      {showPoc && (
        <PocModal pocs={event.pocs} onClose={() => setShowPoc(false)} />
      )}

      {showCreateTeam && (
        <CreateTeamModal
          onClose={() => setShowCreateTeam(false)}
          onConfirm={createTeam}
          registering={registering}
        />
      )}

      <ConfirmationModal
        open={showSoloConfirm}
        onClose={() => setShowSoloConfirm(false)}
        onConfirm={confirmSoloRegistration}
        loading={registering}
        title="Ready for Launch?"
        message="Are you sure you want to deploy as a crewmate for this mission?"
        confirmText="Launch Mission"
        cancelText="Abort Mission"
      />
    </div>
  );
};

export default EventPage;
