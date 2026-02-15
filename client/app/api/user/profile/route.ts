import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { profileUpdateSchema } from "@/lib/validations/auth";
import { buildProfileQrPayload } from "@/lib/qr-token";

type ProfileUser = {
  username: string;
  email: string;
  avatar?: number;
  amongUsScore?: number;
  fullName?: string;
  phoneNumber?: string;
  college?: string;
  stream?: string;
  isProfileComplete?: boolean;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();

    const user = await User.findById(session.user.id)
      .select("username email avatar amongUsScore fullName phoneNumber college stream isProfileComplete")
      .lean() as ProfileUser | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      username: user.username,
      email: user.email,
      avatar: user.avatar ?? null,
      amongUsScore: user.amongUsScore ?? 0,
      fullName: user.fullName ?? "",
      phoneNumber: user.phoneNumber ?? "",
      college: user.college ?? "",
      stream: user.stream ?? "",
      isProfileComplete: user.isProfileComplete ?? false,
      qrPayload: buildProfileQrPayload(session.user.id),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors;
      const msg = Object.values(firstError).flat().filter(Boolean)[0] as string;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { avatar, username, amongUsScore, fullName, phoneNumber, college, stream } = parsed.data;

    await connect();

    const update: Record<string, unknown> = {};
    if (avatar !== undefined) update.avatar = avatar;
    if (username !== undefined) update.username = username.trim();
    if (amongUsScore !== undefined) update.amongUsScore = amongUsScore;
    if (fullName !== undefined) update.fullName = fullName.trim();
    if (phoneNumber !== undefined) update.phoneNumber = phoneNumber.trim();
    if (college !== undefined) update.college = college.trim();
    if (stream !== undefined) update.stream = stream.trim();

    // Check if profile is complete
    // We need current values if not all are being updated, but for simplicity/correctness,
    // let's fetch the user first if we need to merge.
    // However, since we are doing a findByIdAndUpdate later, we can do a two-step approach or just update blindly.
    // Better approach: fetches are cheap enough for a profile update.
    
    // Actually, let's just update the fields provided. Mongoose middleware or a pre-save hook would be better for isProfileComplete,
    // but here we can just do a second check or fetch-update pattern.
    
    // Let's fetch the current user to merge with updates for isProfileComplete check
    const currentUser = await User.findById(session.user.id)
      .select("username email avatar amongUsScore fullName phoneNumber college stream isProfileComplete")
      .lean() as ProfileUser | null;
    
    const mergedUser = { ...currentUser, ...update };
    
    const isProfileComplete = 
      !!mergedUser.username &&
      !!mergedUser.email &&
      !!mergedUser.fullName &&
      !!mergedUser.phoneNumber &&
      !!mergedUser.college &&
      !!mergedUser.stream;
      
    update.isProfileComplete = isProfileComplete;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({
        username: currentUser?.username,
        avatar: currentUser?.avatar ?? null,
        amongUsScore: currentUser?.amongUsScore ?? 0,
        fullName: currentUser?.fullName ?? "",
        phoneNumber: currentUser?.phoneNumber ?? "",
        college: currentUser?.college ?? "",
        stream: currentUser?.stream ?? "",
        isProfileComplete: currentUser?.isProfileComplete ?? false,
        qrPayload: buildProfileQrPayload(session.user.id),
      });
    }

    if (username !== undefined) {
      const existing = await User.findOne({
        username: new RegExp(`^${username}$`, "i"),
        _id: { $ne: new mongoose.Types.ObjectId(session.user.id) },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: update },
      { new: true }
    )
      .select("username email avatar amongUsScore fullName phoneNumber college stream isProfileComplete")
      .lean() as ProfileUser | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      username: user.username,
      email: user.email,
      avatar: user.avatar ?? null,
      amongUsScore: user.amongUsScore ?? 0,
      fullName: user.fullName ?? "",
      phoneNumber: user.phoneNumber ?? "",
      college: user.college ?? "",
      stream: user.stream ?? "",
      isProfileComplete: user.isProfileComplete ?? false,
      qrPayload: buildProfileQrPayload(session.user.id),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
