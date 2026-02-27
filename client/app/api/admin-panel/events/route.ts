import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import Event from "@/lib/models/Events";
import { getAdminSession } from "@/lib/admin-session";

const EVENT_CATEGORIES = [
  "Software",
  "Hardware",
  "Entrepreneurship",
  "Quiz",
  "Gaming",
] as const;

function canAccessEvents(
  session: { role: string; permissions: string[]; isMaster?: boolean } | null
): boolean {
  if (!session) return false;
  if (session.isMaster || session.role === "master") return true;
  if (session.role === "admin") return true;
  if (session.role === "camsguy") return true;
  if (session.role === "imposter")
    return session.permissions.includes("events");
  return false;
}

function canWriteEvents(
  session: { role: string; permissions: string[]; isMaster?: boolean } | null
): boolean {
  if (!session) return false;
  if (session.isMaster || session.role === "master") return true;
  if (session.role === "admin") return true;
  if (session.role === "imposter")
    return session.permissions.includes("events");
  return false;
}

function isValidCategory(c: unknown): c is (typeof EVENT_CATEGORIES)[number] {
  return typeof c === "string" && EVENT_CATEGORIES.includes(c as (typeof EVENT_CATEGORIES)[number]);
}

function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((x) => typeof x === "string");
  if (typeof val === "string") {
    return val
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toPocs(val: unknown): { name: string; mobile: string }[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter(
      (x): x is { name?: string; mobile?: string } =>
        x && typeof x === "object" && "name" in x && "mobile" in x
    )
    .map((p) => ({
      name: String(p.name ?? "").trim(),
      mobile: String(p.mobile ?? "").trim(),
    }))
    .filter((p) => p.name && p.mobile);
}

export async function GET() {
  const session = await getAdminSession();
  if (!session || !canAccessEvents(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();

    const events = await Event.find({})
      .sort({ eventName: 1 })
      .lean();

    return NextResponse.json({
      events: events.map((e) => ({
        id: String((e as { _id?: unknown })._id ?? ""),
        eventName: (e as { eventName?: string }).eventName,
        category: (e as { category?: string }).category,
        date: (e as { date?: string }).date,
        time: (e as { time?: string }).time,
        duration: (e as { duration?: string }).duration,
        venue: (e as { venue?: string }).venue,
        description: (e as { description?: string }).description,
        banner: (e as { banner?: string }).banner ?? "",
        rules: (e as { rules?: string[] }).rules ?? [],
        clubs: (e as { clubs?: string[] }).clubs ?? [],
        isTeamEvent: (e as { isTeamEvent?: boolean }).isTeamEvent ?? false,
        pocs: (e as { pocs?: { name: string; mobile: string }[] }).pocs ?? [],
        maxMembersPerTeam: (e as { maxMembersPerTeam?: number }).maxMembersPerTeam ?? 1,
        minMembersPerTeam: (e as { minMembersPerTeam?: number }).minMembersPerTeam ?? 1,
        isPaidEvent: (e as { isPaidEvent?: boolean }).isPaidEvent ?? false,
        isFoodProvided: (e as { isFoodProvided?: boolean }).isFoodProvided ?? false,
        maxFoodServingsPerParticipant:
          (e as { maxFoodServingsPerParticipant?: number }).maxFoodServingsPerParticipant ?? 1,
        fees: (e as { fees?: number }).fees ?? 0,
        prizePool: (e as { prizePool?: string }).prizePool ?? "TBD",
        createdAt: (e as { createdAt?: Date }).createdAt,
        updatedAt: (e as { updatedAt?: Date }).updatedAt,
      })),
    });
  } catch (err) {
    console.error("Admin events list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session || !canWriteEvents(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    const eventName = typeof body.eventName === "string" ? body.eventName.trim() : "";
    const category = body.category;
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const time = typeof body.time === "string" ? body.time.trim() : "";
    const duration = typeof body.duration === "string" ? body.duration.trim() : "";
    const venue = typeof body.venue === "string" ? body.venue.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!eventName || eventName.length < 3 || eventName.length > 30) {
      return NextResponse.json(
        { error: "Event name must be 3–30 characters" },
        { status: 400 }
      );
    }
    if (!isValidCategory(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }
    if (!date || !time || !duration || !venue || !description) {
      return NextResponse.json(
        { error: "date, time, duration, venue, and description are required" },
        { status: 400 }
      );
    }

    const maxMembersPerTeam = Math.max(
      1,
      typeof body.maxMembersPerTeam === "number" ? body.maxMembersPerTeam : 1
    );
    const minMembersPerTeam = Math.max(
      0,
      Math.min(
        maxMembersPerTeam,
        typeof body.minMembersPerTeam === "number" ? body.minMembersPerTeam : 1
      )
    );

    await connect();

    const existing = await Event.findOne({
      eventName: new RegExp(`^${eventName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (existing) {
      return NextResponse.json(
        { error: "An event with this name already exists" },
        { status: 409 }
      );
    }

    const event = new Event({
      eventName,
      category,
      date,
      time,
      duration,
      venue,
      description,
      banner: typeof body.banner === "string" ? body.banner.trim() : "",
      rules: toArray(body.rules),
      clubs: toArray(body.clubs),
      isTeamEvent: Boolean(body.isTeamEvent),
      pocs: toPocs(body.pocs),
      maxMembersPerTeam,
      minMembersPerTeam,
      isPaidEvent: Boolean(body.isPaidEvent),
      isFoodProvided: Boolean(body.isFoodProvided),
      maxFoodServingsPerParticipant: Math.max(
        1,
        typeof body.maxFoodServingsPerParticipant === "number"
          ? body.maxFoodServingsPerParticipant
          : 1
      ),
      fees: typeof body.fees === "number" ? body.fees : 0,
      prizePool: typeof body.prizePool === "string" ? body.prizePool.trim() || "TBD" : "TBD",
    });

    await event.save();

    return NextResponse.json({
      success: true,
      event: {
        id: event._id.toString(),
        eventName: event.eventName,
        category: event.category,
        date: event.date,
        time: event.time,
        duration: event.duration,
        venue: event.venue,
        description: event.description,
        banner: event.banner ?? "",
        rules: event.rules ?? [],
        clubs: event.clubs ?? [],
        isTeamEvent: event.isTeamEvent,
        pocs: event.pocs ?? [],
        maxMembersPerTeam: event.maxMembersPerTeam,
        minMembersPerTeam: event.minMembersPerTeam,
        isPaidEvent: event.isPaidEvent,
        isFoodProvided: event.isFoodProvided,
        maxFoodServingsPerParticipant: event.maxFoodServingsPerParticipant,
        fees: event.fees ?? 0,
        prizePool: event.prizePool ?? "TBD",
      },
    });
  } catch (err) {
    console.error("Admin create event error:", err);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
