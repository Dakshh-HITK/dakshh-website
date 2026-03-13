import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import CTFTeamScore from "@/lib/models/Team";
import CTFAttempt from "@/lib/models/Attempt";
import CTFChallenge from "@/lib/models/CTFChallenge";

/**
 * GET /api/leaderboard
 * Returns top 10 teams with scores and solved counts.
 */
export async function GET() {
  try {
    await connect();

    const totalChallenges = await CTFChallenge.countDocuments({ enabled: true });

    // Get all team scores sorted
    const teams = await CTFTeamScore.find({})
      .sort({ score: -1 })
      .limit(10)
      .lean();

    // For each team, get solved count
    const leaderboard = await Promise.all(
      teams.map(async (team) => {
        const solvedCount = await CTFAttempt.countDocuments({
          teamId: team.teamId,
          solved: true,
        });

        return {
          teamId: team.teamId.toString(),
          teamName: team.teamName,
          score: team.score,
          solved_count: solvedCount,
        };
      })
    );

    return NextResponse.json({ leaderboard, totalChallenges });
  } catch (err) {
    console.error("[leaderboard] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
