/* eslint-disable prefer-const */
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { DotOrbit } from "@paper-design/shaders-react";
import Crewmates from "../components/Crewmates";
import axios from "axios";
import { SeminarData } from "@/types/interface";
import SeminarCard from "../components/Seminars/SeminarCard";
import SeminarModal from "../components/Seminars/SeminarModal";
import ConfirmationModal from "../components/Events/modals/ConfirmationModal";
import toast from "react-hot-toast";

export default function SeminarsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSeminar, setSelectedSeminar] = useState<SeminarData | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [userRegisteredSeminars, setUserRegisteredSeminars] = useState<
    string[]
  >([]);
  const [seminars, setSeminars] = useState<SeminarData[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingSeminarId, setPendingSeminarId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSeminars() {
      setLoading(true);
      try {
        const response = await axios.get("/api/seminar");
        console.log(response.data);
        setSeminars(response.data.SeminarData);
        setUserRegisteredSeminars(response.data.userRegisteredSeminars);
      } catch (error: any) {
        console.error("Failed to fetch seminar data:", error);
        toast.error(error.response?.data?.error || "Failed to fetch Seminars");
      } finally {
        setLoading(false);
      }
    }
    fetchSeminars();
  }, []);

  const openConfirmModal = (seminarId: string): void => {
    if (!session) {
      router.push("/auth?callbackUrl=/seminars");
      return;
    }
    setPendingSeminarId(seminarId);
    setShowConfirmModal(true);
  };

  const confirmRegistration = async (): Promise<void> => {
    if (!pendingSeminarId) return;

    setShowConfirmModal(false);
    const seminarId = pendingSeminarId;
    setPendingSeminarId(null);

    try {
      const response = await axios.post("/api/seminar/registration", {
        seminarId,
      });
      toast.success(response.data.message);
      setUserRegisteredSeminars((prev) =>
        prev.includes(seminarId) ? prev : [...prev, seminarId],
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to register for seminar",
      );
    }
  };

  const register = async (seminarId: string): Promise<void> => {
    if (!session) {
      router.push("/auth?callbackUrl=/seminars");
      return;
    }
    setPendingSeminarId(seminarId);
    setShowConfirmModal(true);
  };

  const { upcoming, past } = useMemo(() => {
    const now = new Date();

    // Helper function to turn your custom string format into a JS Date object
    const parseSeminarDateTime = (dateStr: string, timeStr: string) => {
      const [day, month, year] = dateStr.split("/").map(Number);

      const startTimeStr = timeStr.split(" - ")[0]; // "07:00 PM"
      const [time, modifier] = startTimeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return new Date(2000 + year, month - 1, day, hours, minutes);
    };

    const processedSeminars = seminars.map((s) => ({
      ...s,
      timestamp: parseSeminarDateTime(s.date, s.time).getTime(),
    }));

    const upcomingSeminars = processedSeminars
      .filter((s) => s.timestamp >= now.getTime())
      .sort((a, b) => a.timestamp - b.timestamp);

    const pastSeminars = processedSeminars
      .filter((s) => s.timestamp < now.getTime())
      .sort((a, b) => b.timestamp - a.timestamp);

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
          isLoggedIn={!!session}
        />
      )}

      <ConfirmationModal
        open={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingSeminarId(null);
        }}
        onConfirm={confirmRegistration}
        title="Register for Seminar?"
        message="Are you sure you want to deploy as a crewmate for this mission?"
        confirmText="Launch Mission"
        cancelText="Abort Mission"
      />
    </div>
  );
}
