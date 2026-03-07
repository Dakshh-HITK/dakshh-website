import { auth } from "@/auth";
import Event from "@/lib/models/Events";
import Registration from "@/lib/models/Registrations";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const registration = await Registration.findById(id);

        if (!registration) {
            return NextResponse.json(
                { error: "Cannot find the Registration" },
                { status: 400 },
            );
        }
        if (registration.isInTeam) {
            return NextResponse.json(
                { error: "Cannot De-register from a Team" },
                { status: 400 },
            );
        }

        const event = await Event.findById(registration.eventId);
        if (!event) {
            return NextResponse.json(
                { error: "Cannot find the Event" },
                { status: 400 },
            );
        }
        if (event.isPaidEvent && registration.verified) {
            return NextResponse.json(
                { error: "Cannot De-register after Payment verification" },
                { status: 400 },
            );
        }

        await Event.findByIdAndUpdate(registration.eventId, {
            $pull: { registrations: registration._id },
        });

        await Registration.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "Successfully de-registered from event" },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error in De-registering for event:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}