import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connect from "@/lib/mongoose";
import CTFChallenge from "@/lib/models/CTFChallenge";

function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim()).digest("hex");
}

/**
 * POST /api/challenges/update-hash
 * Body: { challengeId, flag }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const challengeIdRaw = body?.challengeId;
    const flag = body?.flag;

    const challengeId =
      typeof challengeIdRaw === "number"
        ? challengeIdRaw
        : Number.parseInt(String(challengeIdRaw), 10);

    if (!Number.isFinite(challengeId) || challengeId <= 0 || !flag) {
      return NextResponse.json(
        { error: "challengeId (number) and flag (string) are required." },
        { status: 400 }
      );
    }

    await connect();

    const updatedHash = hashFlag(String(flag));

    const updatedChallenge = await CTFChallenge.findOneAndUpdate(
      { challengeId },
      { $set: { flagHash: updatedHash } },
      { new: true }
    ).select("challengeId title flagHash enabled updatedAt");

    if (!updatedChallenge) {
      return NextResponse.json(
        { error: "Challenge not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Flag hash updated successfully.",
      challenge: updatedChallenge,
    });
  } catch (err) {
    console.error("[update-hash] error:", err);
    return NextResponse.json(
      { error: "Failed to update flag hash." },
      { status: 500 }
    );
  }
}
