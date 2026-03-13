import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { z } from "zod";
import { sendPasswordResetOtpEmail } from "@/lib/auth-mail";
import { generateOtp, hashOtp, otpExpiryDate } from "@/lib/otp";
import { isValidDeviceId, setOtpSession } from "@/lib/otp-session-store";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
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

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connect();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // For security, we don't reveal if a user exists or not
      // But in this specific app, registration already reveals this.
      // However, we'll return a generic success message or a specific one if preferred.
      // Based on registration logic, it reveals existence.
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    if (user.provider === "google") {
      return NextResponse.json(
        {
          error:
            "This account is linked with Google. Please sign in using Google.",
        },
        { status: 409 }
      );
    }

    const otp = generateOtp();
    setOtpSession({
      email: normalizedEmail,
      deviceId,
      otpHash: hashOtp(otp),
      expiresAt: otpExpiryDate(15), // 15 minutes for password reset
    });

    await sendPasswordResetOtpEmail(normalizedEmail, otp);

    return NextResponse.json(
      {
        success: true,
        message: "A password reset OTP has been sent to your email.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[forgot-password] error:", err);
    return NextResponse.json(
      { error: "Unable to process request. Please try again later." },
      { status: 500 }
    );
  }
}
