import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { z } from "zod";
import { getOtpSession, clearOtpSession, isValidDeviceId } from "@/lib/otp-session-store";
import { hashOtp } from "@/lib/otp";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    const deviceId = (body as { deviceId?: unknown })?.deviceId;

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 }
      );
    }

    if (!isValidDeviceId(deviceId)) {
      return NextResponse.json(
        { error: "Invalid device session. Please refresh and try again." },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const session = getOtpSession(normalizedEmail, deviceId);
    if (!session || session.otpHash !== hashOtp(otp)) {
      return NextResponse.json(
        { error: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    await connect();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    clearOtpSession(normalizedEmail, deviceId);

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been reset successfully. Please sign in with your new password.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[reset-password] error:", err);
    return NextResponse.json(
      { error: "Unable to process request. Please try again later." },
      { status: 500 }
    );
  }
}
