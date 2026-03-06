import { auth } from "@/auth";
import Team from "@/lib/models/Team";
import connect from "@/lib/mongoose";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();

        const teams = await Team.find({
            $or: [
                { teamLeader: session.user.id },
                { team: session.user.id }
            ]
        })
            .populate("eventId", "eventName category date time venue banner minMembersPerTeam maxMembersPerTeam isPaidEvent")
            .populate("teamLeader", "username fullName")
            .populate("team", "username fullName")
            .lean();

        const serializedTeams = teams.map((team: any) => {
            const teamLeader = team.teamLeader as {
                _id: mongoose.Types.ObjectId;
                username?: string;
                fullName?: string;
            };
            const teamMembers = Array.isArray(team.team) ? team.team : [];

            const normalizedMembersMap = new Map<string, any>();
            if (teamLeader?._id) {
                normalizedMembersMap.set(String(teamLeader._id), teamLeader);
            }
            for (const member of teamMembers) {
                if (!member?._id) continue;
                normalizedMembersMap.set(String(member._id), member);
            }

            return {
                ...team,
                teamSize: normalizedMembersMap.size,
                members: Array.from(normalizedMembersMap.values()).map((member: any) => ({
                    _id: String(member._id),
                    username: member.username || "",
                    fullName: member.fullName || "",
                    isLeader: String(member._id) === String(teamLeader?._id),
                })),
            };
        });

        return NextResponse.json({ teams: serializedTeams, currentUserId: session.user.id }, { status: 200 });
    } catch (error) {
        console.error("Error in Fetching Registered events:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}