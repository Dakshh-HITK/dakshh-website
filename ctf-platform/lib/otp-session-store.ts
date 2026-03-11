interface OtpSessionRecord {
  email: string;
  otpHash: string;
  expiresAtMs: number;
}

const OTP_SESSION_PREFIX = "otp:";

declare global {
  // eslint-disable-next-line no-var
  var __otpSessions: Map<string, OtpSessionRecord> | undefined;
}

function getStore() {
  if (!globalThis.__otpSessions) {
    globalThis.__otpSessions = new Map<string, OtpSessionRecord>();
  }
  return globalThis.__otpSessions;
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function keyFor(email: string, deviceId: string) {
  return `${OTP_SESSION_PREFIX}${normalizeEmail(email)}:${deviceId}`;
}

function pruneExpired(store: Map<string, OtpSessionRecord>) {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.expiresAtMs <= now) {
      store.delete(key);
    }
  }
}

export function isValidDeviceId(deviceId: unknown): deviceId is string {
  return (
    typeof deviceId === "string" &&
    deviceId.length >= 16 &&
    deviceId.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(deviceId)
  );
}

export function setOtpSession(params: {
  email: string;
  deviceId: string;
  otpHash: string;
  expiresAt: Date;
}) {
  const store = getStore();
  pruneExpired(store);
  store.set(keyFor(params.email, params.deviceId), {
    email: normalizeEmail(params.email),
    otpHash: params.otpHash,
    expiresAtMs: params.expiresAt.getTime(),
  });
}

export function getOtpSession(email: string, deviceId: string) {
  const store = getStore();
  const key = keyFor(email, deviceId);
  const session = store.get(key);
  if (!session) return null;
  if (session.expiresAtMs <= Date.now()) {
    store.delete(key);
    return null;
  }
  return session;
}

export function clearOtpSession(email: string, deviceId: string) {
  const store = getStore();
  store.delete(keyFor(email, deviceId));
}
