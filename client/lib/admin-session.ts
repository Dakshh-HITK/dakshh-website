import crypto from "crypto";
import { cookies } from "next/headers";
import type { ImposterPermission } from "@/lib/admin-types";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SEC = 24 * 60 * 60;

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-admin-secret"
  );
}

export interface AdminSessionPayload {
  id: string;
  email: string;
  role: "admin" | "crewmate" | "imposter" | "camsguy" | "master";
  permissions: ImposterPermission[];
  exp: number;
  isMaster?: boolean;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
}

export function createSessionToken(payload: AdminSessionPayload): string {
  const data = JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  });
  const encoded = Buffer.from(data, "utf8").toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function parseSessionToken(token: string): AdminSessionPayload | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expectedSig = sign(encoded);
  if (sig !== expectedSig) return null;
  try {
    const data = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSessionPayload & { exp?: number };
    if (!data.id || !data.email || !data.role) return null;
    if (data.exp && data.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      exp: data.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export function setSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SEC}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
