import crypto from "crypto";

const QR_PREFIX = "dakshh-profile";

function getSigningSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-qr-secret";
}

function createSignature(userId: string): string {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(userId)
    .digest("hex");
}

export function buildProfileQrPayload(userId: string): string {
  const signature = createSignature(userId);
  return `${QR_PREFIX}:${userId}:${signature}`;
}

export function parseAndVerifyProfileQrPayload(payload: string): string | null {
  if (!payload || typeof payload !== "string") return null;

  const [prefix, userId, providedSignature] = payload.split(":");
  if (prefix !== QR_PREFIX || !userId || !providedSignature) return null;

  const expectedSignature = createSignature(userId);
  if (providedSignature !== expectedSignature) return null;

  return userId;
}
