import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export function createOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(email, otp, secret) {
  if (!secret) throw new Error("A secret is required to hash an OTP.");
  return createHmac("sha256", secret)
    .update(`${email}:${otp}`)
    .digest("hex");
}

export function verifyOtp(email, otp, secret, savedHash) {
  if (!/^[0-9]{6}$/.test(String(otp)) || !savedHash) return false;

  const expected = Buffer.from(
    hashOtp(email, String(otp), secret),
    "hex",
  );
  const actual = Buffer.from(savedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}