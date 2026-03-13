import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connect from "@/lib/mongoose";
import CTFChallenge from "@/lib/models/CTFChallenge";
import CTFAttempt from "@/lib/models/Attempt";
import CTFTeamScore from "@/lib/models/Team";

function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim()).digest("hex");
}

const MAX_ATTEMPTS_BEFORE_LOCK = 5;
const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes

/**
 * POST /api/submit
 * Body: { teamId, teamName, challengeId, flag, userId }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, teamName, challengeId, flag, userId } = body;

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

    // Check lockout
    if (attempt.locked_until && new Date() < attempt.locked_until) {
      const remaining = Math.ceil(
        (attempt.locked_until.getTime() - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: `Too many attempts. Try again in ${remaining} seconds.`,
        },
        { status: 429 }
      );
    }

    // Increment attempts
    attempt.attempts += 1;

    // Hash the submitted flag and compare against the stored hash
    const submittedHash = hashFlag(flag);
    if (submittedHash === challenge.flagHash) {
      // Correct!
      attempt.solved = true;
      attempt.solvedBy = userId || null;
      attempt.solvedAt = new Date();
      attempt.locked_until = null;
      await attempt.save();

      // Update team score
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
        message: `Correct! +${challenge.points} points for your team!`,
        points: challenge.points,
      });
    }

    // Wrong flag
    if (attempt.attempts >= MAX_ATTEMPTS_BEFORE_LOCK) {
      attempt.locked_until = new Date(Date.now() + LOCK_DURATION_MS);
      attempt.attempts = 0; // Reset counter after lock
    }
    await attempt.save();

    const attemptsLeft = MAX_ATTEMPTS_BEFORE_LOCK - attempt.attempts;
    return NextResponse.json(
      {
        success: false,
        message: `Wrong flag. ${attemptsLeft > 0 ? `${attemptsLeft} attempts left before lockout.` : ""}`,
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
