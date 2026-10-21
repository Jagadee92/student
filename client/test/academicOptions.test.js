import test from "node:test";
import assert from "node:assert/strict";
import {
  commonBranches,
  getEstimatedPassingOutYear,
  getProgramLabel,
  studyPrograms,
} from "../src/utils/academicOptions.js";
import {
  getPasswordChecks,
  isStrongPassword,
} from "../src/utils/passwordValidation.js";

test("program labels display the name managed by the college", () => {
  assert.equal(getProgramLabel("Bachelor of Computer Applications"), "Bachelor of Computer Applications");
  assert.equal(getProgramLabel("B.Pharm"), "B.Pharm");
});

test("common engineering branches are suggestions, not programs", () => {
  for (const branch of ["CSE", "ECE", "Civil", "EEE", "AIML", "AIDS", "Mechanical"]) {
    assert.ok(commonBranches.includes(branch));
  }
  assert.ok(!commonBranches.includes("Pharmacy"));
  assert.ok(commonBranches.includes("Others"));
});

test("registration offers the requested courses with matching year limits", () => {
  assert.deepEqual(studyPrograms, [
    { name: "B-Tech", durationYears: 4 },
    { name: "Degree", durationYears: 3 },
    { name: "Pharmacy", durationYears: 4 },
    { name: "MTech", durationYears: 2 },
  ]);
});

test("passing-out year is estimated from course duration and current study year", () => {
  assert.equal(getEstimatedPassingOutYear("1", 4, 2026), 2029);
  assert.equal(getEstimatedPassingOutYear("4", 4, 2026), 2026);
  assert.equal(getEstimatedPassingOutYear("2", 2, 2026), 2026);
  assert.equal(getEstimatedPassingOutYear("", 4, 2026), "");
  assert.equal(getEstimatedPassingOutYear("5", 4, 2026), "");
});

test("password strength requires length, mixed case, a number, and a symbol", () => {
  assert.equal(isStrongPassword("StrongPass123!"), true);
  assert.equal(isStrongPassword("weakpass123!"), false);
  assert.equal(isStrongPassword("StrongPass!"), false);
  assert.equal(getPasswordChecks("StrongPass123!").special, true);
});
