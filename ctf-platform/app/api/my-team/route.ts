import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import Registration from "@/lib/models/Registration";
import Event from "@/lib/models/Event";
import mongoose from "mongoose";

// Import the Team model from the shared DB (the event team, not CTFTeamScore)
const EventTeam =
  mongoose.models.Team ||
  mongoose.model(
    "Team",
    new mongoose.Schema(
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        teamCode: { type: String, unique: true },
        teamName: { type: String },
        teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        team: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        paymentStatus: {
          type: String,
          enum: ["pending", "completed", "failed"],
        },
      },
      { timestamps: true }
    )
  );

/**
 * GET /api/my-team?userId=...
 * Finds the user's team for the Cyber Quest event.
 * Returns teamId, teamName, teamMembers, and whether they're solo.
 */
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

    // Find Cyber Quest event
    const event = await Event.findOne({
      eventName: { $regex: new RegExp("^cyber.?quest$", "i") },
    });

    if (!event) {
      // Dev fallback: no event found, return a pseudo-team
      return NextResponse.json({
        teamId: userId,
        teamName: "Solo Player",
        isSolo: true,
        members: [userId],
      });
    }

    // Find user's registration for this event
    const registration = await Registration.findOne({
      eventId: event._id,
      participant: userId,
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Not registered for Cyber Quest" },
        { status: 403 }
      );
    }

    // If in a team
    if (registration.isInTeam && registration.teamId) {
      const team = await EventTeam.findById(registration.teamId)
        .populate("team", "username fullName")
        .populate("teamLeader", "username fullName")
        .lean();

      if (team) {
        const members = (team.team || []).map((m: { _id: mongoose.Types.ObjectId; username?: string; fullName?: string }) => ({
          id: m._id.toString(),
          username: m.username || m.fullName || "Unknown",
        }));

        return NextResponse.json({
          teamId: team._id.toString(),
          teamName: team.teamName || team.teamCode || "Unnamed Team",
          isSolo: false,
          members,
        });
      }
    }

    // Solo registration (not in a team) — treat user as their own team
    return NextResponse.json({
      teamId: `solo_${userId}`,
      teamName: "Solo Player",
      isSolo: true,
      members: [userId],
    });
  } catch (err) {
    console.error("[my-team] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}
