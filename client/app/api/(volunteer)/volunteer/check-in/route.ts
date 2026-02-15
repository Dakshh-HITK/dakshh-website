import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import Event from "@/lib/models/Events";
import Registration from "@/lib/models/Registrations";
import { normalizeRoles } from "@/lib/roles";
import { parseAndVerifyProfileQrPayload } from "@/lib/qr-token";

type CheckInAction = "entry" | "food";
const FOOD_COOLDOWN_MS = 2 * 60 * 60 * 1000;

function isValidAction(action: unknown): action is CheckInAction {
  return action === "entry" || action === "food";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const eventId = typeof body.eventId === "string" ? body.eventId : "";
    const qrPayload = typeof body.qrPayload === "string" ? body.qrPayload : "";
    const action = body.action;

    if (!eventId || !qrPayload || !isValidAction(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await connect();

    const volunteer = (await User.findById(session.user.id)
      .select("email roles")
      .lean()) as { email?: string; roles?: string[] } | null;

    if (!volunteer?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = normalizeRoles(volunteer.roles, volunteer.email);
    if (!roles.includes("volunteer") && !roles.includes("admin") && !roles.includes("super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attendeeUserId = parseAndVerifyProfileQrPayload(qrPayload);
    if (!attendeeUserId) {
      return NextResponse.json(
        {
          allowed: false,
          status: "denied",
          message: "Invalid QR. Entry denied.",
        },
        { status: 400 }
      );
    }

    const [event, attendee] = await Promise.all([
      Event.findById(eventId).select("eventName isFoodProvided maxFoodServingsPerParticipant").lean() as Promise<
        { eventName?: string; isFoodProvided?: boolean; maxFoodServingsPerParticipant?: number } | null
      >,
      User.findById(attendeeUserId).select("fullName username email").lean() as Promise<
        { fullName?: string; username?: string; email?: string } | null
      >,
    ]);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const registration = await Registration.findOne({
      eventId,
      $or: [{ owner: attendeeUserId }, { team: attendeeUserId }],
    });

    const attendeeName = attendee?.fullName || attendee?.username || "Participant";
    const attendeeEmail = attendee?.email || "";

    if (!registration || !registration.verified) {
      return NextResponse.json(
        {
          allowed: false,
          status: "denied",
          attendeeName,
          attendeeEmail,
          message: `Entry denied. ${attendeeName} is not registered for ${event.eventName ?? "this event"}.`,
        },
        { status: 403 }
      );
    }

    if (action === "entry") {
      if (registration.checkedIn) {
        return NextResponse.json({
          allowed: true,
          status: "warning",
          duplicate: true,
          attendeeName,
          attendeeEmail,
          message: `${attendeeName} is already checked in for ${event.eventName ?? "this event"}.`,
        });
      }

      registration.checkedIn = true;
      registration.checkedInAt = new Date();
      registration.checkedInBy = session.user.id;
      await registration.save();

      return NextResponse.json({
        allowed: true,
        status: "success",
        attendeeName,
        attendeeEmail,
        message: `${attendeeName} checked in successfully.`,
      });
    }

    if (!event.isFoodProvided) {
      return NextResponse.json(
        {
          allowed: false,
          status: "error",
          attendeeName,
          attendeeEmail,
          message: "Food distribution is disabled for this event.",
        },
        { status: 400 }
      );
    }

    if (!registration.checkedIn) {
      return NextResponse.json(
        {
          allowed: false,
          status: "denied",
          attendeeName,
          attendeeEmail,
          message: "Food denied. Participant must be checked in first.",
        },
        { status: 403 }
      );
    }

    const legacyRegistration = registration as unknown as {
      foodServed?: boolean;
      foodServedAt?: Date;
    };

    const maxFoodServings = Math.max(1, Number(event.maxFoodServingsPerParticipant ?? 1));
    const currentFoodServedCount =
      typeof registration.foodServedCount === "number"
        ? registration.foodServedCount
        : legacyRegistration.foodServed
          ? 1
          : 0;

    if (currentFoodServedCount >= maxFoodServings) {
      return NextResponse.json({
        allowed: false,
        status: "denied",
        duplicate: true,
        attendeeName,
        attendeeEmail,
        message: `Food already issued ${currentFoodServedCount}/${maxFoodServings} times. Duplicate packet denied.`,
      });
    }

    const lastFoodTime =
      registration.lastFoodServedAt ??
      legacyRegistration.foodServedAt ??
      null;

    if (lastFoodTime) {
      const elapsed = Date.now() - new Date(lastFoodTime).getTime();
      if (elapsed < FOOD_COOLDOWN_MS) {
        const waitMinutes = Math.ceil((FOOD_COOLDOWN_MS - elapsed) / (60 * 1000));
        return NextResponse.json(
          {
            allowed: false,
            status: "denied",
            duplicate: true,
            attendeeName,
            attendeeEmail,
            message: `Food denied. Minimum 2-hour gap required between scans. Try again in ${waitMinutes} minute(s).`,
          },
          { status: 429 }
        );
      }
    }

    registration.foodServedCount = currentFoodServedCount + 1;
    registration.lastFoodServedAt = new Date();
    await registration.save();

    return NextResponse.json({
      allowed: true,
      status: "success",
      attendeeName,
      attendeeEmail,
      message: `Food check completed. Packet issued (${registration.foodServedCount}/${maxFoodServings}).`,
      foodServedCount: registration.foodServedCount,
      maxFoodServings,
    });
  } catch (error) {
    console.error("Volunteer check-in failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
