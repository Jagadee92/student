import test from "node:test";
import assert from "node:assert/strict";
import { getLoginPath } from "../src/utils/loginPath.js";

test("students and Viewers always land on their profile after login", () => {
  assert.equal(getLoginPath("student", "/students"), "/profile");
  assert.equal(getLoginPath("viewer", "/students"), "/profile");
});

test("staff always returns to an available page and admins retain requested pages", () => {
  assert.equal(getLoginPath("staff", "/dashboard"), "/profile");
  assert.equal(getLoginPath("admin", "/users"), "/users");
});

test("admins fall back to the dashboard while staff land on their profile", () => {
  assert.equal(getLoginPath("admin"), "/dashboard");
  assert.equal(getLoginPath("staff"), "/profile");
});
