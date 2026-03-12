import connect from "@/lib/mongoose";
import Event from "@/lib/models/Events";
import Registration from "@/lib/models/Registrations";
import User from "@/lib/models/User";
import { parseAndVerifyProfileQrPayload } from "@/lib/qr-token";

type CheckInAction = "entry" | "food";
const FOOD_COOLDOWN_MS = 2 * 60 * 60 * 1000;

function isValidAction(action: unknown): action is CheckInAction {
  return action === "entry" || action === "food";
}

export interface CheckInParams {
  eventId: string;
  qrPayload: string;
  action: CheckInAction;
  checkedInBy: string;
}

export interface CheckInResult {
  allowed: boolean;
  status: "success" | "warning" | "denied" | "error";
  message: string;
  attendeeName?: string;
  attendeeEmail?: string;
  duplicate?: boolean;
  foodServedCount?: number;
  maxFoodServings?: number;
}

export async function performCheckIn(
  params: CheckInParams
): Promise<CheckInResult> {
  const { eventId, qrPayload, action, checkedInBy } = params;

  if (!eventId || !qrPayload || !isValidAction(action)) {
    return {
      allowed: false,
      status: "error",
      message: "Invalid request",
    };
  }

  await connect();

  const attendeeUserId = parseAndVerifyProfileQrPayload(qrPayload);
  if (!attendeeUserId) {
    return {
      allowed: false,
      status: "denied",
      message: "Invalid QR. Entry denied.",
    };
  }

  const [event, attendee] = await Promise.all([
    Event.findById(eventId)
      .select("eventName isFoodProvided maxFoodServingsPerParticipant")
      .lean() as Promise<{
      eventName?: string;
      isFoodProvided?: boolean;
      maxFoodServingsPerParticipant?: number;
    } | null>,
    User.findById(attendeeUserId)
      .select("fullName username email")
      .lean() as Promise<{
      fullName?: string;
      username?: string;
      email?: string;
    } | null>,
  ]);

  if (!event) {
    return {
      allowed: false,
      status: "error",
      message: "Event not found",
    };
  }

  // Look up registration by the individual participant only.
  // Each team member has their own Registration document, so querying by
  // teamId would risk matching (and checking-in) a different team member.
  const registration = await Registration.findOne({
    eventId,
    participant: attendeeUserId,
  });

  const attendeeName = attendee?.fullName || attendee?.username || "Participant";
  const attendeeEmail = attendee?.email || "";

  if (!registration || !registration.verified) {
    return {
      allowed: false,
      status: "denied",
      attendeeName,
      attendeeEmail,
      message: `Entry denied. ${attendeeName} is not registered for ${event.eventName ?? "this event"}.`,
    };
  }

  if (action === "entry") {
    if (registration.checkedIn) {
      return {
        allowed: true,
        status: "warning",
        duplicate: true,
        attendeeName,
        attendeeEmail,
        message: `${attendeeName} is already checked in for ${event.eventName ?? "this event"}.`,
      };
    }

    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    registration.checkedInBy = checkedInBy as unknown as typeof registration.checkedInBy;
    await registration.save();

    return {
      allowed: true,
      status: "success",
      attendeeName,
      attendeeEmail,
      message: `${attendeeName} checked in successfully.`,
    };
  }

  if (!event.isFoodProvided) {
    return {
      allowed: false,
      status: "error",
      attendeeName,
      attendeeEmail,
      message: "Food distribution is disabled for this event.",
    };
  }

  if (!registration.checkedIn) {
    return {
      allowed: false,
      status: "denied",
      attendeeName,
      attendeeEmail,
      message: "Food denied. Participant must be checked in first.",
    };
  }

  const legacyRegistration = registration as unknown as {
    foodServed?: boolean;
    foodServedAt?: Date;
  };

  const maxFoodServings = Math.max(
    1,
    Number(event.maxFoodServingsPerParticipant ?? 1)
  );
  const currentFoodServedCount =
    typeof registration.foodServedCount === "number"
      ? registration.foodServedCount
      : legacyRegistration.foodServed
        ? 1
        : 0;

  if (currentFoodServedCount >= maxFoodServings) {
    return {
      allowed: false,
      status: "denied",
      duplicate: true,
      attendeeName,
      attendeeEmail,
      message: `Food already issued ${currentFoodServedCount}/${maxFoodServings} times. Duplicate packet denied.`,
    };
  }

  const lastFoodTime =
    registration.lastFoodServedAt ??
    legacyRegistration.foodServedAt ??
    null;

  if (lastFoodTime) {
    const elapsed = Date.now() - new Date(lastFoodTime).getTime();
    if (elapsed < FOOD_COOLDOWN_MS) {
      const waitMinutes = Math.ceil(
        (FOOD_COOLDOWN_MS - elapsed) / (60 * 1000)
      );
      return {
        allowed: false,
        status: "denied",
        duplicate: true,
        attendeeName,
        attendeeEmail,
        message: `Food denied. Minimum 2-hour gap required between scans. Try again in ${waitMinutes} minute(s).`,
      };
    }
  }

  registration.foodServedCount = currentFoodServedCount + 1;
  registration.lastFoodServedAt = new Date();
  await registration.save();

  return {
    allowed: true,
    status: "success",
    attendeeName,
    attendeeEmail,
    message: `Food check completed. Packet issued (${registration.foodServedCount}/${maxFoodServings}).`,
    foodServedCount: registration.foodServedCount,
    maxFoodServings,
  };
}
