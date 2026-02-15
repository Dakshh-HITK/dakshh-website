import { auth } from "@/auth";
import generateCode from "@/lib/generateTeamID";
import Event, { IEventDocument } from "@/lib/models/Events";
import Registration from "@/lib/models/Registrations";
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

        await connect();

        const { id } = await params;
        const event = await Event.findById(id) as IEventDocument;

        const existingRegistration = await Registration.findOne({
            eventId: event._id,
            owner: session.user.id,
        });

        if (existingRegistration) {
            return NextResponse.json(
                { error: "You have already registered for this event" },
                { status: 400 }
            );
        }

        if (!event.isTeamEvent) {
            return NextResponse.json({ error: "This event is a Solo Event" }, { status: 400 });
        }
        if (event.isPaidEvent) {
            return NextResponse.json({ error: "The Event is a paid event" }, { status: 400 });
        }

        const newCode = `DAKSHH-${generateCode()}`;

        const newRegistration = new Registration({
            eventId: event._id,
            isTeam: true,
            teamId: newCode,
            owner: session.user.id,
            verified: true
        });

        if (newRegistration) {
            event.registrations.push(newRegistration._id);
            await Promise.all([newRegistration.save(), event.save()]);
        }

        return NextResponse.json({ 
            message: `Registered in ${event.eventName} Successfully!`,
            eventId: newRegistration.teamId
        }, { status: 201 });
    } catch (error) {
        console.error("Registering in Solo Event Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}