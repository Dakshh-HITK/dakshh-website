import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import Registration from "@/lib/models/Registration";
import Event from "@/lib/models/Event";

// Event name to look for — should match exactly what's in the DB
const CYBER_QUEST_EVENT_NAME = "Cyber Quest";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    await connect();

    // Find the Cyber Quest event (case-insensitive regex for safety)
    const event = await Event.findOne({
      eventName: { $regex: new RegExp("^cyber.?quest$", "i") },
    });

    if (!event) {
      // If the event doesn't exist in the DB yet, allow all users (dev mode)
      console.warn("[CTF] Cyber Quest event not found in DB — allowing all users.");
      return NextResponse.json({ registered: true, bypass: true });
    }

    // Check if this user has a registration for this event
    const registration = await Registration.findOne({
      eventId: event._id,
      participant: userId,
    });

    if (!registration) {
      return NextResponse.json({
        registered: false,
        message: "DUH, you forgot to register broski",
      });
    }

    return NextResponse.json({ registered: true });
  } catch (err) {
    console.error("[check-registration] error:", err);
    return NextResponse.json(
      { error: "Failed to check registration" },
      { status: 500 }
    );
  }
}
