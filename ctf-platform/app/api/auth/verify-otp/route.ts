import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { hashOtp } from "@/lib/otp";
import {
  clearOtpSession,
  getOtpSession,
  isValidDeviceId,
} from "@/lib/otp-session-store";

interface VerifyOtpBody {
  email?: string;
  otp?: string;
  deviceId?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyOtpBody;
    const email = body.email?.toLowerCase().trim();
    const otp = body.otp?.trim();
    const deviceId = body.deviceId;

    if (!email || !otp || !deviceId) {
      return NextResponse.json(
        { error: "Missing required fields: email, otp, deviceId" },
        { status: 400 }
      );
    }
    if (!isValidDeviceId(deviceId)) {
      return NextResponse.json(
        { error: "Invalid device session. Please refresh and try again." },
        { status: 400 }
      );
    }

    await connect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    if (user.provider === "google") {
      return NextResponse.json(
        {
          error:
            "This email is registered with Google. Please sign in with Google.",
        },
        { status: 409 }
      );
    }

    const otpSession = getOtpSession(email, deviceId);
    if (!otpSession) {
      return NextResponse.json(
        { error: "No active OTP found. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (otpSession.otpHash !== hashOtp(otp)) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    user.emailVerified = new Date();
    user.verified = true;
    await user.save();
    clearOtpSession(email, deviceId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
