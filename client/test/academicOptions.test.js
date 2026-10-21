import test from "node:test";
import assert from "node:assert/strict";
import {
  commonBranches,
  getProgramLabel,
  studyPrograms,
} from "../src/utils/academicOptions.js";

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
