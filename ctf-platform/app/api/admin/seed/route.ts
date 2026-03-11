import { NextResponse } from "next/server";
import crypto from "crypto";
import connect from "@/lib/mongoose";
import CTFChallenge from "@/lib/models/CTFChallenge";
import CTFSection from "@/lib/models/CTFSection";
import { SEED_CHALLENGES, SEED_SECTIONS } from "@/lib/challenges";

function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim()).digest("hex");
}

/**
 * POST /api/admin/seed
 * Seeds the DB with challenge and section data.
 * Flags are SHA-256 hashed before storage — plaintext never hits the DB.
 * Upserts so it can be called multiple times safely.
 */
export async function POST() {
  try {
    await connect();

    // Upsert sections
    const sectionOps = SEED_SECTIONS.map((sec) => ({
      updateOne: {
        filter: { key: sec.key },
        update: { $set: sec },
        upsert: true,
      },
    }));
    await CTFSection.bulkWrite(sectionOps);

    // Upsert challenges with hashed flags
    const challengeOps = SEED_CHALLENGES.map((ch) => ({
      updateOne: {
        filter: { challengeId: ch.id },
        update: {
          $set: {
            challengeId: ch.id,
            title: ch.title,
            category: ch.category,
            difficulty: ch.difficulty,
            points: ch.points,
            description: ch.description,
            placeholder: ch.placeholder,
            section: ch.section,
            sectionColor: ch.sectionColor,
            flagHash: hashFlag(ch.flag),
          },
        },
        upsert: true,
      },
    }));
    await CTFChallenge.bulkWrite(challengeOps);

    return NextResponse.json({
      success: true,
      message: `Seeded ${SEED_SECTIONS.length} sections and ${SEED_CHALLENGES.length} challenges (flags hashed).`,
    });
  } catch (err) {
    console.error("[seed] error:", err);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}

