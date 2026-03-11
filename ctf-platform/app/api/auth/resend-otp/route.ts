import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { generateOtp, hashOtp, otpExpiryDate } from "@/lib/otp";
import { isValidDeviceId, setOtpSession } from "@/lib/otp-session-store";

interface ResendOtpBody {
  email?: string;
  deviceId?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResendOtpBody;
    const email = body.email?.toLowerCase().trim();
    const deviceId = body.deviceId;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    if (user.verified) {
      return NextResponse.json(
        { error: "Account is already verified. Please sign in." },
        { status: 409 }
      );
    }

    const otp = generateOtp();
    setOtpSession({
      email,
      deviceId,
      otpHash: hashOtp(otp),
      expiresAt: otpExpiryDate(10),
    });

    console.log(`[CTF-OTP] OTP for ${email}: ${otp}`);

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch {
    return NextResponse.json(
      { error: "Failed to resend OTP. Please try again." },
      { status: 500 }
    );
  }
}
