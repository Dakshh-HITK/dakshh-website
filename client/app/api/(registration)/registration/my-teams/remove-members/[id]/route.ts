import { auth } from "@/auth";
import Registration from "@/lib/models/Registrations";
import Team from "@/lib/models/Team";
import connect from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();

        const { id } = await params;
        const { memberId } = await request.json();

        const teamData = await Team.findById(id);
        if (!teamData) {
            return NextResponse.json(
                { error: "Team not found" },
                { status: 400 }
            );
        }

        console.log(session.user.id, teamData.teamLeader);
        if (session.user.id !== teamData.teamLeader.toString()) {
            return NextResponse.json(
                { error: "Only Team Leader can update the team" },
                { status: 400 }
            );
        }
        if (!teamData.team.includes(memberId)) {
            return NextResponse.json(
                { error: "The user is not a part of this team" },
                { status: 400 }
            );
        }
        if (teamData.paymentStatus == "completed") {
            return NextResponse.json(
                { error: "Team members cannot be altered after completing payment" },
                { status: 400 }
            );
        }

        const registration = await Registration.findOne({
            teamId: teamData._id,
            participant: memberId
        });

        if (!registration) {
            return NextResponse.json(
                { error: "Member not registered for this team" },
                { status: 404 }
            );
        }

        const updatedTeam = await Team.findByIdAndUpdate(
            id,
            { $pull: { team: memberId } },
            { new: true }
        );
        if (!updatedTeam) {
            return NextResponse.json(
                { error: "Failed to update team members" },
                { status: 400 }
            );
        }

        await Registration.deleteOne({
            teamId: id,
            participant: memberId
        });

        return NextResponse.json(
            { message: "Member removed and registration cancelled successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in Fetching Registered events:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}