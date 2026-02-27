import { auth } from "@/auth";
import generateCode from "@/lib/generateTeamID";
import Event, { IEventDocument } from "@/lib/models/Events";
import Registration from "@/lib/models/Registrations";
import Team from "@/lib/models/Team";
import User from "@/lib/models/User";
import connect from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { teamName } = await req.json();

        await connect();

        const { id } = await params;
        const event = await Event.findById(id) as IEventDocument;

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 400 }
            );
        }

        if (event.registrations.length >= event.teamLimit!) {
            return NextResponse.json(
                { error: "Registration limit reached for this event" },
                { status: 400 }
            );
        }

        const existingRegistration = await Registration.findOne({
            eventId: event._id,
            participant: session.user.id,
        });

        if (existingRegistration) {
            return NextResponse.json(
                { error: "You have already registered for this event" },
                { status: 400 }
            );
        }

        if (!event.isActive) {
            return NextResponse.json({ error: "This event is not accepting registrations right now" }, { status: 400 });
        }
        if (!event.isTeamEvent) {
            return NextResponse.json({ error: "This event is a Solo Event" }, { status: 400 });
        }
        if (event.isPaidEvent) {
            return NextResponse.json({ error: "The Event is a paid event" }, { status: 400 });
        }

        const user = await User.findById(session.user.id);

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

        const newCode = `DAKSHH-${generateCode()}`;

        const newTeam = new Team({
            eventId: event._id,
            teamCode: newCode,
            teamName: teamName || "",
            teamLeader: session.user.id,
            team: [session.user.id],
        });

        let newRegistration;
        if (newTeam) {
            newRegistration = new Registration({
                eventId: event._id,
                isInTeam: true,
                teamId: newTeam._id,
                participant: session.user.id,
                verified: true
            });
        }

        if (newRegistration) {
            event.registrations.push(newTeam._id);
            await Promise.all([newRegistration.save(), event.save(), newTeam.save()]);
        }

        return NextResponse.json({
            message: `Registered in ${event.eventName} Successfully!`,
            eventId: newRegistration.teamId,
            isVerified: true,
            isProfileComplete: true
        }, { status: 201 });
    } catch (error) {
        console.error("Creating Team Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}