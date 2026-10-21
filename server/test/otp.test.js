import test from "node:test";
import assert from "node:assert/strict";
import {
  createOtp,
  hashOtp,
  verifyOtp,
} from "../src/utils/otp.js";

test("creates a six-digit registration code", () => {
  assert.match(createOtp(), /^[0-9]{6}$/);
});

test("verifies codes only for their email and server secret", () => {
  const secret = "a sufficiently long test secret";
  const hash = hashOtp("student@example.com", "012345", secret);

  assert.notEqual(hash, "012345");
  assert.equal(
    verifyOtp("student@example.com", "012345", secret, hash),
    true,
  );
  assert.equal(
    verifyOtp("other@example.com", "012345", secret, hash),
    false,
  );
  assert.equal(
    verifyOtp("student@example.com", "012345", "other", hash),
    false,
  );
  assert.equal(
    verifyOtp("student@example.com", "12345", secret, hash),
    false,
  );
});