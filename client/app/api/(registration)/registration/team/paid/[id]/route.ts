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
                { status: 404 }
            );
        }

        if (!event.isActive) {
            return NextResponse.json(
                { error: "This event is not accepting registrations right now" },
                { status: 400 }
            );
        }

        if (!event.isTeamEvent) {
            return NextResponse.json(
                { error: "This event is a solo event" },
                { status: 400 }
            );
        }

        if (!event.isPaidEvent) {
            return NextResponse.json(
                { error: "This event is not a paid event. Use the free registration route instead." },
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

        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (!user.verified) {
            return NextResponse.json(
                {
                    error: "Verify your account to register",
                    isVerified: false,
                },
                { status: 401 }
            );
        }

        if (!user.isProfileComplete) {
            return NextResponse.json(
                {
                    error: "Complete your profile to register",
                    isProfileComplete: false,
                },
                { status: 400 }
            );
        }

        const newCode = `DAKSHH-${generateCode()}`;

        const newTeam = new Team({
            eventId: event._id,
            teamCode: newCode,
            teamName: teamName || "",
            teamLeader: session.user.id,
            team: [session.user.id],
            paymentStatus: "pending",
        });

        const newRegistration = new Registration({
            eventId: event._id,
            isInTeam: true,
            teamId: newTeam._id,
            participant: session.user.id,
            verified: false,
        });

        event.registrations.push(newTeam._id);

        await Promise.all([newTeam.save(), newRegistration.save(), event.save()]);

        return NextResponse.json(
            {
                message: `Team created for ${event.eventName}. Complete payment to confirm your registration.`,
                teamId: newTeam._id,
                teamCode: newTeam.teamCode,
                paymentStatus: newTeam.paymentStatus,
                isVerified: true,
                isProfileComplete: true,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Paid Team Registration Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
