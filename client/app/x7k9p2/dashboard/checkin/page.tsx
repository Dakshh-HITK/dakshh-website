import { redirect } from "next/navigation";
import connect from "@/lib/mongoose";
import Event from "@/lib/models/Events";
import { getAdminSession } from "@/lib/admin-session";
import { getAdminBasePath } from "@/lib/admin-config";
import { DotOrbit } from "@paper-design/shaders-react";
import HandDrawnCard from "@/app/components/HandDrawnCard";
import AdminCheckInClient from "./AdminCheckInClient";

interface VolunteerEvent {
  _id: string;
  eventName: string;
  category: string;
  isFoodProvided: boolean;
  maxFoodServingsPerParticipant: number;
}

function canCheckIn(
  session: { role: string; permissions: string[]; isMaster?: boolean } | null
): boolean {
  if (!session) return false;
  if (session.isMaster || session.role === "master") return true;
  if (session.role === "admin" || session.role === "crewmate") return true;
  if (session.role === "camsguy") return true;
  if (session.role === "imposter")
    return session.permissions.includes("checkin");
  return false;
}

export default async function AdminCheckInPage() {
  const session = await getAdminSession();
  const basePath = getAdminBasePath();
  if (!session) redirect(`/${basePath}`);

  if (!canCheckIn(session)) redirect(`/${basePath}/dashboard`);

  await connect();
  const eventDocs = await Event.find({})
    .select("eventName category isFoodProvided maxFoodServingsPerParticipant")
    .sort({ eventName: 1 })
    .lean<{
      _id: unknown;
      eventName?: string;
      category?: string;
      isFoodProvided?: boolean;
      maxFoodServingsPerParticipant?: number;
    }[]>();

  const events: VolunteerEvent[] = eventDocs.map((event) => ({
    _id: String(event._id),
    eventName: event.eventName ?? "Untitled Event",
    category: event.category ?? "Uncategorized",
    isFoodProvided: event.isFoodProvided ?? false,
    maxFoodServingsPerParticipant: Math.max(
      1,
      event.maxFoodServingsPerParticipant ?? 1
    ),
  }));

  return (
    <>
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
      <div className="relative z-10 min-h-screen pt-24 px-4 pb-10">
        <div className="max-w-4xl mx-auto">
          <HandDrawnCard className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="hand-drawn-title text-white text-2xl">
                Event Check-in
              </h2>
            </div>
            <AdminCheckInClient events={events} readonly={session?.role === "camsguy"} />
          </HandDrawnCard>
        </div>
      </div>
    </>
  );
}
