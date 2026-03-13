#!/usr/bin/env node

import mongoose from "mongoose";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Missing MONGODB_URI. Run with env loaded, e.g. `node --env-file=.env scripts/reset-ctf-attempts.mjs --yes`.'
    );
  }
  return uri;
}

async function main() {
  const force = process.argv.includes("--yes");
  const uri = getMongoUri();

  await mongoose.connect(uri);

  // Recreate model names used by the app so we target the same collections.
  const Attempt =
    mongoose.models.CTFAttempt ||
    mongoose.model("CTFAttempt", new mongoose.Schema({}, { strict: false }));
  const TeamScore =
    mongoose.models.CTFTeamScore ||
    mongoose.model("CTFTeamScore", new mongoose.Schema({}, { strict: false }));

  const [attemptCount, scoreCount] = await Promise.all([
    Attempt.countDocuments({}),
    TeamScore.countDocuments({}),
  ]);

  if (!force) {
    console.log("Dry run only. No data deleted.");
    console.log(
      `Would delete: ${attemptCount} attempt records, ${scoreCount} leaderboard score records.`
    );
    console.log("Re-run with --yes to perform deletion.");
    await mongoose.disconnect();
    return;
  }

  const [attemptResult, scoreResult] = await Promise.all([
    Attempt.deleteMany({}),
    TeamScore.deleteMany({}),
  ]);

  console.log("CTF reset complete.");
  console.log(
    `Deleted attempts: ${attemptResult.deletedCount ?? 0}, deleted team scores: ${scoreResult.deletedCount ?? 0}`
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("[reset-ctf-attempts] failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors on failure path
  }
  process.exit(1);
});
