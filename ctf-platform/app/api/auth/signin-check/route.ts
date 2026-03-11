import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { signInSchema } from "@/lib/validations/auth";
import { generateOtp, hashOtp, otpExpiryDate } from "@/lib/otp";
import { isValidDeviceId, setOtpSession } from "@/lib/otp-session-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);
    const deviceId = (body as { deviceId?: unknown })?.deviceId;

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    if (!isValidDeviceId(deviceId)) {
      return NextResponse.json(
        { error: "Invalid device session. Please refresh and try again." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connect();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.provider === "google") {
      return NextResponse.json(
        {
          error:
            "This email is registered with Google. Please sign in using Google.",
          provider: "google",
        },
        { status: 409 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash ?? "");
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.verified) {
      const otp = generateOtp();
      setOtpSession({
        email: normalizedEmail,
        deviceId,
        otpHash: hashOtp(otp),
        expiresAt: otpExpiryDate(10),
      });
      // Note: No email sending in CTF platform — user should verify on main site
      console.log(`[CTF-OTP] OTP for ${normalizedEmail}: ${otp}`);

      return NextResponse.json(
        {
          requiresVerification: true,
          message: "Your email is not verified. A new OTP has been sent.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ canSignIn: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Unable to process sign-in. Please try again." },
      { status: 500 }
    );
  }
}
