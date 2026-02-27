import { auth } from "@/auth";
import Event from "@/lib/models/Events";
import Registration from "@/lib/models/Registrations";
import Team from "@/lib/models/Team";
import connect from "@/lib/mongoose";
import { NextResponse } from "next/server";
import {
  MyTeamResponse,
  PopulatedTeamUser,
  RegistrationLean,
  TeamLean,
} from "@/types/interface";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { id } = await params;

    const event = await Event.findById(id)
      .select(
        "_id eventName category date time duration venue description banner rules clubs isTeamEvent pocs minMembersPerTeam maxMembersPerTeam isPaidEvent fees prizePool isActive doc",
      )
      .lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const registrationDoc = await Registration.findOne({
      eventId: id,
      participant: session.user.id,
    })
      .select("_id isInTeam teamId verified createdAt")
      .lean();
    const registration = (
      Array.isArray(registrationDoc) ? registrationDoc[0] : registrationDoc
    ) as RegistrationLean | null;

    let myTeam: MyTeamResponse | null = null;
    if (registration?.teamId) {
      const rawTeamDoc = await Team.findById(registration.teamId)
        .select(
          "_id teamCode teamName teamLeader team paymentStatus createdAt updatedAt",
        )
        .populate("teamLeader", "username fullName")
        .populate("team", "username fullName")
        .lean();
      const rawTeam = (
        Array.isArray(rawTeamDoc) ? rawTeamDoc[0] : rawTeamDoc
      ) as TeamLean | null;

      if (rawTeam) {
        const teamLeader = rawTeam.teamLeader as PopulatedTeamUser | undefined;
        const teamMembers = (
          Array.isArray(rawTeam.team) ? rawTeam.team : []
        ) as PopulatedTeamUser[];

        const normalizedMembersMap = new Map<string, PopulatedTeamUser>();
        if (teamLeader?._id) {
          normalizedMembersMap.set(String(teamLeader._id), teamLeader);
        }
        for (const member of teamMembers) {
          if (!member?._id) continue;
          normalizedMembersMap.set(String(member._id), member);
        }

        const isCurrentUserTeamLeader =
          String(teamLeader?._id) === String(session.user.id);

        myTeam = {
          _id: String(rawTeam._id),
          teamCode: rawTeam.teamCode,
          teamName: rawTeam.teamName,
          paymentStatus: rawTeam.paymentStatus,
          createdAt: rawTeam.createdAt,
          updatedAt: rawTeam.updatedAt,
          isTeamLeader: isCurrentUserTeamLeader,
          members: Array.from(normalizedMembersMap.values()).map((member) => ({
            _id: String(member._id),
            username: member.username || "",
            fullName: member.fullName || "",
            isLeader: String(member._id) === String(teamLeader?._id),
          })),
          teamSize: normalizedMembersMap.size,
        };
      }
    }

    return NextResponse.json({
      ...event,
      userRegistration: {
        isRegistered: Boolean(registration),
        isInTeam: Boolean(registration?.isInTeam),
        verified: Boolean(registration?.verified),
        registrationId: registration?._id ? String(registration._id) : null,
      },
      myTeam,
    });
  } catch (error) {
    console.error("Fetch Event Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
