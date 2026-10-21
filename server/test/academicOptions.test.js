import test from "node:test";
import assert from "node:assert/strict";
import {
  getRegistrationProgram,
  registrationPrograms,
} from "../src/utils/academicOptions.js";

test("registration accepts only the four supported courses of study", () => {
  assert.deepEqual(
    registrationPrograms.map((program) => program.name),
    ["B-Tech", "Degree", "Pharmacy", "MTech"],
  );
  assert.equal(getRegistrationProgram("B-Tech").durationYears, 4);
  assert.equal(getRegistrationProgram("Degree").durationYears, 3);
  assert.equal(getRegistrationProgram("Pharmacy").durationYears, 4);
  assert.equal(getRegistrationProgram("MTech").durationYears, 2);
  assert.equal(getRegistrationProgram("Unknown"), undefined);
});
