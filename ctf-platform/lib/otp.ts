import crypto from "crypto";

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function otpExpiryDate(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
