import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// In-memory CSRF token store (serverless safe via global cache)
const globalForCsrf = globalThis as unknown as {
  csrfTokens: Record<string, string>;
};

if (!globalForCsrf.csrfTokens) {
  globalForCsrf.csrfTokens = {};
}

export async function GET(req: NextRequest) {
  const teamName = req.nextUrl.searchParams.get("teamName");

  if (!teamName) {
    return NextResponse.json(
      { error: "teamName query parameter is required" },
      { status: 400 }
    );
  }

  const token = crypto.randomUUID();
  globalForCsrf.csrfTokens[teamName] = token;

  return NextResponse.json({ csrfToken: token });
}

// Export the store so other routes can access it
export { globalForCsrf };
