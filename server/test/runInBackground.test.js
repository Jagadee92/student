import test from "node:test";
import assert from "node:assert/strict";
import { runInBackground } from "../src/utils/runInBackground.js";

test("runs background work after the current call returns", async () => {
  let completed = false;
  runInBackground(async () => {
    completed = true;
  }, "Test task");

  assert.equal(completed, false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(completed, true);
});

test("logs background task errors instead of creating unhandled rejections", async () => {
  const originalError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args);

  try {
    runInBackground(async () => {
      throw new Error("test failure");
    }, "Test task");
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(logged, [["Test task failed:", "test failure"]]);
  } finally {
    console.error = originalError;
  }
});
