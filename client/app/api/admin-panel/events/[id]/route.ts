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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session || !canAccessEvents(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connect();

    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const e = event as Record<string, unknown>;
    return NextResponse.json({
      id: String(e._id ?? ""),
      eventName: e.eventName,
      category: e.category,
      date: e.date,
      time: e.time,
      duration: e.duration,
      venue: e.venue,
      description: e.description,
      banner: e.banner ?? "",
      rules: e.rules ?? [],
      clubs: e.clubs ?? [],
      isTeamEvent: e.isTeamEvent ?? false,
      pocs: e.pocs ?? [],
      maxMembersPerTeam: e.maxMembersPerTeam ?? 1,
      minMembersPerTeam: e.minMembersPerTeam ?? 1,
      isPaidEvent: e.isPaidEvent ?? false,
      isFoodProvided: e.isFoodProvided ?? false,
      maxFoodServingsPerParticipant: e.maxFoodServingsPerParticipant ?? 1,
      fees: e.fees ?? 0,
      prizePool: e.prizePool ?? "TBD",
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    });
  } catch (err) {
    console.error("Admin get event error:", err);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session || !canWriteEvents(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    await connect();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (body.eventName !== undefined) {
      const eventName = typeof body.eventName === "string" ? body.eventName.trim() : "";
      if (eventName.length < 3 || eventName.length > 30) {
        return NextResponse.json(
          { error: "Event name must be 3–30 characters" },
          { status: 400 }
        );
      }
      const existing = await Event.findOne({
        eventName: new RegExp(`^${eventName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "An event with this name already exists" },
          { status: 409 }
        );
      }
      event.eventName = eventName;
    }

    if (body.category !== undefined) {
      if (!isValidCategory(body.category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      event.category = body.category;
    }

    if (body.date !== undefined) event.date = String(body.date).trim();
    if (body.time !== undefined) event.time = String(body.time).trim();
    if (body.duration !== undefined) event.duration = String(body.duration).trim();
    if (body.venue !== undefined) event.venue = String(body.venue).trim();
    if (body.description !== undefined) event.description = String(body.description).trim();
    if (body.banner !== undefined) event.banner = String(body.banner ?? "").trim();
    if (body.rules !== undefined) event.rules = toArray(body.rules);
    if (body.clubs !== undefined) event.clubs = toArray(body.clubs);
    if (typeof body.isTeamEvent === "boolean") event.isTeamEvent = body.isTeamEvent;
    if (body.pocs !== undefined) event.pocs = toPocs(body.pocs);

    if (body.maxMembersPerTeam !== undefined) {
      event.maxMembersPerTeam = Math.max(1, Number(body.maxMembersPerTeam) || 1);
    }
    if (body.minMembersPerTeam !== undefined) {
      event.minMembersPerTeam = Math.max(
        0,
        Math.min(event.maxMembersPerTeam, Number(body.minMembersPerTeam) || 1)
      );
    }

    if (typeof body.isPaidEvent === "boolean") event.isPaidEvent = body.isPaidEvent;
    if (typeof body.isFoodProvided === "boolean") event.isFoodProvided = body.isFoodProvided;
    if (body.maxFoodServingsPerParticipant !== undefined) {
      event.maxFoodServingsPerParticipant = Math.max(
        1,
        Number(body.maxFoodServingsPerParticipant) || 1
      );
    }
    if (typeof body.fees === "number") event.fees = body.fees;
    if (body.prizePool !== undefined) {
      event.prizePool = typeof body.prizePool === "string" ? body.prizePool.trim() || "TBD" : "TBD";
    }

    await event.save();

    const e = event.toObject ? event.toObject() : (event as unknown as Record<string, unknown>);
    return NextResponse.json({
      success: true,
      event: {
        id: String(e._id ?? ""),
        eventName: e.eventName,
        category: e.category,
        date: e.date,
        time: e.time,
        duration: e.duration,
        venue: e.venue,
        description: e.description,
        banner: e.banner ?? "",
        rules: e.rules ?? [],
        clubs: e.clubs ?? [],
        isTeamEvent: e.isTeamEvent ?? false,
        pocs: e.pocs ?? [],
        maxMembersPerTeam: e.maxMembersPerTeam ?? 1,
        minMembersPerTeam: e.minMembersPerTeam ?? 1,
        isPaidEvent: e.isPaidEvent ?? false,
        isFoodProvided: e.isFoodProvided ?? false,
        maxFoodServingsPerParticipant: e.maxFoodServingsPerParticipant ?? 1,
        fees: e.fees ?? 0,
        prizePool: e.prizePool ?? "TBD",
      },
    });
  } catch (err) {
    console.error("Admin update event error:", err);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session || !canWriteEvents(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connect();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await Event.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin delete event error:", err);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
