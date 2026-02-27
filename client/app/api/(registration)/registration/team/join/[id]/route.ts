import { auth } from "@/auth";
import Event, { IEventDocument } from "@/lib/models/Events";
import Registration from "@/lib/models/Registrations";
import Team, { ITeamDocument } from "@/lib/models/Team";
import User, { IUserDocument } from "@/lib/models/User";
import connect from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { teamCode } = await request.json().catch(() => ({}));
        const { id } = await params;

        if (!teamCode) {
            return NextResponse.json({ error: "Team code is required" }, { status: 400 });
        }

        await connect();

        const targetTeam = await Team.findOne({ teamCode: teamCode.toUpperCase() }) as ITeamDocument;

        if (!targetTeam) {
            return NextResponse.json({ error: "Team not found. Please check the code." }, { status: 404 });
        }

        const event = await Event.findById(targetTeam.eventId) as IEventDocument;
        if (!event) {
            return NextResponse.json({ error: "Event no longer exists" }, { status: 400 });
        }
        if (event.registrations.length >= event.teamLimit!) {
            return NextResponse.json(
                { error: "Registration limit reached for this event" },
                { status: 400 }
            );
        }
        if (!event.isActive) {
            return NextResponse.json({ error: "This event is not accepting registrations right now" }, { status: 400 });
        }
        if (String(event._id) !== id) {
            return NextResponse.json({ error: "Team code is for a different event" }, { status: 400 });
        }
        if (!event.isTeamEvent) {
            return NextResponse.json({ error: "This event is a Solo Event" }, { status: 400 });
        }
        if (event.isPaidEvent) {
            return NextResponse.json({ error: "The Event is a paid event" }, { status: 400 });
        }

        const user = await User.findById(session.user.id) as IUserDocument;

        if (!user.verified) {
            return NextResponse.json({
                error: "Verify your account to Register",
                isVerified: false
            }, { status: 401 });
        }

        if (!user.isProfileComplete) {
            return NextResponse.json({
                error: "Complete your profile to Register",
                isProfileComplete: false
            }, { status: 400 });
        }

        const existingRegistration = await Registration.findOne({
            eventId: event._id,
            participant: session.user.id,
        });

        if (existingRegistration) {
            return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 });
        }

        if (targetTeam.team.length >= event.maxMembersPerTeam) {
            return NextResponse.json({ error: "This team is already full" }, { status: 400 });
        }

        const newRegistration = new Registration({
            eventId: event._id,
            isInTeam: true,
            teamId: targetTeam._id,
            participant: session.user.id,
            verified: true
        });

        targetTeam.team.push(user._id);

        await Promise.all([
            newRegistration.save(),
            targetTeam.save()
        ]);

        return NextResponse.json({
            message: `Successfully joined team for ${event.eventName}!`,
            isVerified: true,
            isProfileComplete: true
        }, { status: 201 });
    } catch (error) {
        console.error("Joining Team Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}