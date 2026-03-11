import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { registerApiSchema } from "@/lib/validations/auth";
import { generateOtp, hashOtp, otpExpiryDate } from "@/lib/otp";
import { isValidDeviceId, setOtpSession } from "@/lib/otp-session-store";
import { normalizeRoles } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request. Please try again." },
        { status: 400 }
      );
    }

    if (body === null || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }
    const deviceId = (body as { deviceId?: unknown }).deviceId;

    const parsed = registerApiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed. Please check your inputs." },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;
    if (!isValidDeviceId(deviceId)) {
      return NextResponse.json(
        { error: "Invalid device session. Please refresh and try again." },
        { status: 400 }
      );
    }
    const normalizedEmail = email.toLowerCase().trim();

    await connect();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      if (existingEmail.provider === "google") {
        return NextResponse.json(
          {
            error:
              "This email is registered with Google. Please sign in using Google.",
          },
          { status: 409 }
        );
      }

      if (!existingEmail.verified && existingEmail.passwordHash) {
        const passwordMatches = await bcrypt.compare(
          password,
          existingEmail.passwordHash
        );

        if (passwordMatches) {
          const otp = generateOtp();
          setOtpSession({
            email: existingEmail.email,
            deviceId,
            otpHash: hashOtp(otp),
            expiresAt: otpExpiryDate(10),
          });
          console.log(`[CTF-OTP] OTP for ${existingEmail.email}: ${otp}`);

          return NextResponse.json(
            {
              success: true,
              requiresVerification: true,
              message:
                "Account already exists but is not verified. A new OTP has been sent.",
            },
            { status: 200 }
          );
        }
      }

      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const existingUsername = await User.findOne({
      username: new RegExp(`^${username}$`, "i"),
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    await User.create({
      username: username.trim(),
      email: normalizedEmail,
      provider: "credentials",
      passwordHash,
      avatar: Math.floor(Math.random() * 10) + 1,
      verified: false,
      roles: normalizeRoles([], normalizedEmail),
    });

    setOtpSession({
      email: normalizedEmail,
      deviceId,
      otpHash: hashOtp(otp),
      expiresAt: otpExpiryDate(10),
    });

    console.log(`[CTF-OTP] OTP for ${normalizedEmail}: ${otp}`);

    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        message:
          "OTP sent. Please verify your email to complete account setup.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
