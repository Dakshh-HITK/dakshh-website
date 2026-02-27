import { auth } from "@/auth";
import Event, { IEventDocument } from "@/lib/models/Events";
import Registration from "@/lib/models/Registrations";
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

    const { id: registrationId } = await params;

    // Find the registration
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    // Check if the user is the participant
    if (String(registration.participant) !== session.user.id) {
      return NextResponse.json(
        { error: "You can only complete payment for your own registration" },
        { status: 403 },
      );
    }

    // Get the event
    const event = (await Event.findById(
      registration.eventId,
    )) as IEventDocument | null;

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Return the payment URL for redirect
    return NextResponse.json({
      message: "Payment validation successful",
      paymentUrl: PAYMENT_URL,
      registrationId: registration._id,
      eventName: event.eventName,
      fees: event.fees,
    });
  } catch (error) {
    console.error("Complete Solo Payment Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
