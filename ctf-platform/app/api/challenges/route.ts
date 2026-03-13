import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import CTFChallenge from "@/lib/models/CTFChallenge";
import CTFSection from "@/lib/models/CTFSection";
import CTFAttempt from "@/lib/models/Attempt";

/**
 * GET /api/challenges?teamId=...
 * Returns all challenges (without flags), sections, and solved challenge IDs for the team.
 */
export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get("teamId");

    await connect();

    // Fetch sections ordered
    const sections = await CTFSection.find({})
      .sort({ order: 1 })
      .select("-__v")
      .lean();

    // Fetch only safe challenge fields (never expose flagHash)
    const challenges = await CTFChallenge.find({ enabled: true })
      .select(
        "challengeId title category difficulty points description placeholder section sectionColor enabled createdAt updatedAt"
      )
      .sort({ section: 1, challengeId: 1 })
      .lean();

    // Fetch solved challenge IDs for this team
    let solvedChallengeIds: number[] = [];
    if (teamId) {
      const solvedAttempts = await CTFAttempt.find({
        teamId,
        solved: true,
      })
        .select("challengeId")
        .lean();
      solvedChallengeIds = solvedAttempts.map((a) => a.challengeId);
    }

    // Get total challenge count and max possible score
    const totalChallenges = challenges.length;
    const maxScore = challenges.reduce(
      (sum, c) => sum + ((c as unknown as { points: number }).points || 0),
      0
    );

    return NextResponse.json({
      sections,
      challenges,
      solvedChallengeIds,
      totalChallenges,
      maxScore,
    });
  } catch (err) {
    console.error("[challenges] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}
