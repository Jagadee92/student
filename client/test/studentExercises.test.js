import test from "node:test";
import assert from "node:assert/strict";
import {
  combineLists,
  filterByMarks,
  findStudent,
  formatStudent,
  getAverage,
  getDepartment,
  getNames,
  getStudents,
  groupByDepartment,
  hasPassed,
  readStudent,
  sampleStudents,
  sortByName,
} from "../src/exercises/studentExercises.js";

test("filters students by minimum marks", () => {
  assert.deepEqual(
    filterByMarks(sampleStudents, 80).map((student) => student.name),
    ["Asha Rao", "Meera Das"],
  );
});

test("finds a student by ID and returns null when missing", () => {
  assert.equal(findStudent(sampleStudents, 3).name, "Meera Das");
  assert.equal(findStudent(sampleStudents, 999), null);
});

test("calculates average marks and handles an empty list", () => {
  assert.equal(getAverage(sampleStudents), 76.25);
  assert.equal(getAverage([]), 0);
});

test("sorts names without changing the original array", () => {
  const sorted = sortByName(sampleStudents);
  assert.equal(sorted[0].name, "Asha Rao");
  assert.equal(sampleStudents[0].name, "Asha Rao");
});

test("transforms and combines student lists", () => {
  assert.deepEqual(getNames([sampleStudents[0]]), [
    { id: 1, displayName: "Asha Rao" },
  ]);
  assert.equal(combineLists([1, 2], [3]).length, 3);
});

test("groups students by department and uses a fallback department name", () => {
  const groups = groupByDepartment([
    { name: "A", department: "CSE" },
    { name: "B" },
  ]);
  assert.equal(groups.CSE.length, 1);
  assert.equal(groups["Department not selected"].length, 1);
});

test("serializes JSON and handles invalid JSON", () => {
  const jsonText = formatStudent({ id: 1, name: "Asha" });
  assert.deepEqual(readStudent(jsonText), { id: 1, name: "Asha" });
  assert.equal(readStudent("not JSON"), null);
});

test("reads nested department values safely", () => {
  assert.equal(getDepartment({ department: { name: "CSE" } }), "CSE");
  assert.equal(getDepartment({}), "No department selected");
});

test("detects whether at least one student passed", () => {
  assert.equal(hasPassed([{ marks: 20 }, { marks: 55 }]), true);
  assert.equal(hasPassed([{ marks: 20 }]), false);
});

test("fetches API data and returns useful error information", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => [{ id: 1, name: "Asha" }],
    });
    const success = await getStudents("/students");
    assert.equal(success.data[0].name, "Asha");
    assert.equal(success.error, null);

    globalThis.fetch = async () => ({ ok: false, status: 503 });
    const failure = await getStudents("/students");
    assert.deepEqual(failure.data, []);
    assert.match(failure.error, /503/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
