import test from "node:test";
import assert from "node:assert/strict";
import { isStrongPassword } from "../src/utils/passwordValidation.js";

test("strong registration passwords meet every complexity requirement", () => {
  assert.equal(isStrongPassword("StrongPass123!"), true);
  assert.equal(isStrongPassword("lowercase123!"), false);
  assert.equal(isStrongPassword("StrongPass!"), false);
  assert.equal(isStrongPassword("StrongPass123"), false);
});

test("strong password validation enforces length limits", () => {
  assert.equal(isStrongPassword("S1!a"), false);
  assert.equal(isStrongPassword(`S1!a${"b".repeat(96)}`), true);
  assert.equal(isStrongPassword(`S1!a${"b".repeat(97)}`), false);
});
