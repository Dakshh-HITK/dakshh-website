#!/usr/bin/env node

import mongoose from "mongoose";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Missing MONGODB_URI. Run with env loaded, e.g. `node --env-file=.env scripts/reset-ctf-team.mjs --teamId=<TEAM_ID> --yes`.'
    );
  }
  return uri;
}

function getArgValue(name) {
  const withEquals = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (withEquals) return withEquals.split("=").slice(1).join("=");

  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];

  return null;
}

async function main() {
  const teamIdArg = getArgValue("--teamId");
  const force = process.argv.includes("--yes");

  if (!teamIdArg) {
    throw new Error("Missing --teamId argument.");
  }

  if (!mongoose.isValidObjectId(teamIdArg)) {
    throw new Error("Invalid teamId. Expected a Mongo ObjectId.");
  }

  const teamId = new mongoose.Types.ObjectId(teamIdArg);
  await mongoose.connect(getMongoUri());

  const Attempt =
    mongoose.models.CTFAttempt ||
    mongoose.model("CTFAttempt", new mongoose.Schema({}, { strict: false }));
  const TeamScore =
    mongoose.models.CTFTeamScore ||
    mongoose.model("CTFTeamScore", new mongoose.Schema({}, { strict: false }));

  const [attemptCount, scoreCount] = await Promise.all([
    Attempt.countDocuments({ teamId }),
    TeamScore.countDocuments({ teamId }),
  ]);

  if (!force) {
    console.log("Dry run only. No data deleted.");
    console.log(`Team: ${teamIdArg}`);
    console.log(
      `Would delete: ${attemptCount} attempt records, ${scoreCount} leaderboard score record(s).`
    );
    console.log("Re-run with --yes to perform deletion.");
    await mongoose.disconnect();
    return;
  }

  const [attemptResult, scoreResult] = await Promise.all([
    Attempt.deleteMany({ teamId }),
    TeamScore.deleteMany({ teamId }),
  ]);

  console.log("Team CTF reset complete.");
  console.log(`Team: ${teamIdArg}`);
  console.log(
    `Deleted attempts: ${attemptResult.deletedCount ?? 0}, deleted team scores: ${scoreResult.deletedCount ?? 0}`
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("[reset-ctf-team] failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors on failure path
  }
  process.exit(1);
});
