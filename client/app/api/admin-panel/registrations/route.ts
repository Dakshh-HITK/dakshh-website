import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import Registration from "@/lib/models/Registrations";
import Event from "@/lib/models/Events";
import User from "@/lib/models/User";
import { getAdminSession } from "@/lib/admin-session";

function canAccessRegistrations(
  session: { role: string; permissions: string[]; isMaster?: boolean } | null
): boolean {
  if (!session) return false;
  if (session.isMaster || session.role === "master") return true;
  if (session.role === "admin") return true;
  if (session.role === "camsguy") return true;
  if (session.role === "imposter")
    return session.permissions.includes("registrations");
  return false;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session || !canAccessRegistrations(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId") ?? "";
    const verifiedParam = searchParams.get("verified");
    const checkedInParam = searchParams.get("checkedIn");
    const search = searchParams.get("search")?.trim() ?? "";

    await connect();

    const query: Record<string, unknown> = {};

    if (eventId) {
      query.eventId = eventId;
    }

    if (verifiedParam === "true") query.verified = true;
    else if (verifiedParam === "false") query.verified = false;

    if (checkedInParam === "true") query.checkedIn = true;
    else if (checkedInParam === "false") query.checkedIn = false;

    let participantIds: string[] | null = null;
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const users = await User.find({
        $or: [
          { email: searchRegex },
          { username: searchRegex },
          { fullName: searchRegex },
        ],
      })
        .select("_id")
        .lean();
      participantIds = users.map((u) => String((u as { _id?: unknown })._id ?? ""));
      if (participantIds.length === 0) {
        return NextResponse.json({ registrations: [], events: [] });
      }
      query.participant = { $in: participantIds };
    }

    const regs = await Registration.find(query)
      .populate("participant", "username email fullName")
      .populate("eventId", "eventName")
      .populate("teamId", "teamCode teamLeader team")
      .sort({ createdAt: -1 })
      .lean();

    const events = await Event.find({})
      .select("_id eventName")
      .sort({ eventName: 1 })
      .lean();

    return NextResponse.json({
      registrations: regs.map((r) => {
        const rAny = r as Record<string, unknown>;
        const participant = rAny.participant as { _id?: unknown; username?: string; email?: string; fullName?: string } | null;
        const event = rAny.eventId as { _id?: unknown; eventName?: string } | null;
        const team = rAny.teamId as { teamCode?: string } | null;
        const eventIdRaw = event?._id ?? rAny.eventId;
        return {
          id: String(rAny._id ?? ""),
          eventId: String(eventIdRaw ?? ""),
          eventName: event?.eventName ?? "",
          isInTeam: rAny.isInTeam ?? false,
          teamId: rAny.teamId ? String((rAny.teamId as { _id?: unknown })?._id ?? rAny.teamId) : null,
          teamCode: team?.teamCode ?? null,
          participantId: participant ? String(participant._id ?? "") : String(rAny.participant ?? ""),
          participantName: participant?.fullName || participant?.username || "",
          participantEmail: participant?.email ?? "",
          verified: rAny.verified ?? false,
          checkedIn: rAny.checkedIn ?? false,
          checkedInAt: rAny.checkedInAt ?? null,
          foodServedCount: rAny.foodServedCount ?? 0,
          createdAt: rAny.createdAt,
          updatedAt: rAny.updatedAt,
        };
      }),
      events: events.map((e) => ({
        id: String((e as { _id?: unknown })._id ?? ""),
        eventName: (e as { eventName?: string }).eventName ?? "",
      })),
    });
  } catch (err) {
    console.error("Admin registrations list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
