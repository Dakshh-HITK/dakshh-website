import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connect from "@/lib/mongoose";
import CTFChallenge from "@/lib/models/CTFChallenge";
import CTFAttempt from "@/lib/models/Attempt";
import CTFTeamScore from "@/lib/models/Team";

function normalizeFlag(value: string): string {
  const normalized = value
    .trim()
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[‐‑‒–—−]/g, "-");

  const match = normalized.match(/^([A-Za-z0-9_]+)\{([\s\S]*)\}$/);
  if (!match) return normalized;

  const [, prefix, payload] = match;
  if (prefix.toLowerCase() !== "dakshh") return normalized;

  // Header is case-insensitive for DAKSHH{...}
  return `dakshh{${payload}}`;
}

function getHeaderVariants(flag: string): string[] {
  const trimmed = flag.trim();
  const match = trimmed.match(/^([A-Za-z0-9_]+)\{([\s\S]*)\}$/);
  if (!match) return [trimmed];

  const [, prefix, payload] = match;
  if (prefix.toLowerCase() !== "dakshh") return [trimmed];

  return Array.from(new Set([trimmed, `dakshh{${payload}}`, `DAKSHH{${payload}}`]));
}

function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim()).digest("hex");
}

const MAX_FREE_ATTEMPTS = 10;

/**
 * POST /api/submit
 * Body: { teamId, teamName, challengeId, flag, userId, payPenalty }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, teamName, challengeId, flag, userId, payPenalty } = body;

    if (!teamId || !challengeId || !flag) {
      return NextResponse.json(
        { error: "teamId, challengeId, and flag are required." },
        { status: 400 }
      );
    }

    await connect();

    // Fetch the challenge from DB (including flag) and ensure it is enabled
    const challenge = await CTFChallenge.findOne({ challengeId, enabled: true });
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found or is currently disabled." },
        { status: 404 }
      );
    }

    // Find or create attempt record for this team + challenge
    let attempt = await CTFAttempt.findOne({ teamId, challengeId });

    if (!attempt) {
      attempt = await CTFAttempt.create({
        teamId,
        challengeId,
        attempts: 0,
        solved: false,
      });
    }

    // Already solved
    if (attempt.solved) {
      return NextResponse.json(
        { message: "Already solved by your team!", success: false },
        { status: 200 }
      );
    }

    // Penalty logic
    let penaltyCost = 0;
    if (attempt.attempts >= MAX_FREE_ATTEMPTS) {
      penaltyCost = challenge.difficulty === "hard" ? 100 : 50;

      if (!payPenalty) {
        return NextResponse.json(
          {
            success: false,
            requiresPenalty: true,
            penaltyCost,
            message: `You have exceeded ${MAX_FREE_ATTEMPTS} attempts! This submission will cost ${penaltyCost} points.`,
          },
          { status: 200 } // Using 200 to let frontend handle it gracefully
        );
      }

      // Check if team has sufficient points
      const teamScore = await CTFTeamScore.findOne({ teamId });
      if (!teamScore || teamScore.score < penaltyCost) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient points for submission.",
            message: "Insufficient points for submission.",
          },
          { status: 200 } // Keep it 200 so frontend can display the message easily
        );
      }

      // Deduct penalty immediately
      await CTFTeamScore.findOneAndUpdate(
        { teamId },
        {
          $inc: { score: -penaltyCost },
          $setOnInsert: { teamName: teamName || "Unknown Team" },
        },
        { upsert: true, new: true }
      );
    }

    // Increment attempts
    attempt.attempts += 1;

    // Support both legacy plain flag storage and hashed flag storage.
    const normalizedSubmittedFlag = normalizeFlag(String(flag));
    const normalizedStoredFlag = normalizeFlag(String(challenge.flagHash || ""));
    const isRawMatch = normalizedSubmittedFlag === normalizedStoredFlag;
    const storedHash = String(challenge.flagHash || "").trim();
    const headerVariants = getHeaderVariants(String(flag));
    const hashCandidates = headerVariants.map((variant) => hashFlag(variant));
    const isHashMatch = hashCandidates.includes(storedHash);

    if (isRawMatch || isHashMatch) {
      // Correct!
      attempt.solved = true;
      attempt.solvedBy = userId || null;
      attempt.solvedAt = new Date();
      attempt.locked_until = null;
      await attempt.save();

      // Update team score (award points)
      await CTFTeamScore.findOneAndUpdate(
        { teamId },
        {
          $inc: { score: challenge.points },
          $setOnInsert: { teamName: teamName || "Unknown Team" },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: `Correct! +${challenge.points} points for your team!${penaltyCost > 0 ? ` (Penalty of ${penaltyCost} deducted)` : ""}`,
        points: challenge.points,
      });
    }

    // Wrong flag
    await attempt.save();

    const attemptsLeft = MAX_FREE_ATTEMPTS - attempt.attempts;
    return NextResponse.json(
      {
        success: false,
        message: `Wrong flag. ${penaltyCost > 0 ? `Cost: ${penaltyCost} pts.` : (attemptsLeft > 0 ? `${attemptsLeft} free attempts left.` : "Next attempt will cost points.")}`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[submit] error:", err);
    return NextResponse.json(
      { error: "Submission failed." },
      { status: 500 }
    );
  }
}
