import test from "node:test";
import assert from "node:assert/strict";
import { getApiBaseUrl } from "../src/utils/apiBaseUrl.js";

test("uses the same-origin API path when no URL is configured", () => {
  assert.equal(getApiBaseUrl(""), "/api");
  assert.equal(getApiBaseUrl(undefined), "/api");
});

test("adds the API path to a backend origin", () => {
  assert.equal(
    getApiBaseUrl("https://student-33hi.onrender.com"),
    "https://student-33hi.onrender.com/api",
  );
});

test("does not duplicate an existing API path", () => {
  assert.equal(getApiBaseUrl("/api/"), "/api");
  assert.equal(
    getApiBaseUrl("https://student-33hi.onrender.com/api/"),
    "https://student-33hi.onrender.com/api",
  );
});
