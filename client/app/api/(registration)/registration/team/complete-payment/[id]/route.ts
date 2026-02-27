import { auth } from "@/auth";
import Event, { IEventDocument } from "@/lib/models/Events";
import Team from "@/lib/models/Team";
import connect from "@/lib/mongoose";
import { NextResponse } from "next/server";

const PAYMENT_URL = "https://www.theheritage.ac.in/Events/DAKSHH.aspx";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { id: teamId } = await params;

    // Find the team
    const team = await Team.findById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if the user is the team leader
    if (String(team.teamLeader) !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team leader can complete payment" },
        { status: 403 },
      );
    }

    // Get the event to check minMembersPerTeam
    const event = (await Event.findById(team.eventId)) as IEventDocument | null;

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if team has minimum required members (team array already includes all members including leader)
    const teamSize = team.team.length;
    if (teamSize < event.minMembersPerTeam) {
      return NextResponse.json(
        {
          error: `Team must have at least ${event.minMembersPerTeam} members to complete payment. Currently: ${teamSize}`,
          minRequired: event.minMembersPerTeam,
          currentCount: teamSize,
        },
        { status: 400 },
      );
    }

    // Return the payment URL for redirect
    return NextResponse.json({
      message: "Payment validation successful",
      paymentUrl: PAYMENT_URL,
      teamId: team._id,
      teamName: team.teamName,
      teamCode: team.teamCode,
      eventName: event.eventName,
      fees: event.fees,
      teamSize: teamSize,
    });
  } catch (error) {
    console.error("Complete Payment Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
