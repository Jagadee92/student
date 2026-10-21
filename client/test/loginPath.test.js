import test from "node:test";
import assert from "node:assert/strict";
import { getLoginPath } from "../src/utils/loginPath.js";

test("all users land on Home after signing in", () => {
  for (const role of ["admin", "staff", "student", "viewer"]) {
    assert.equal(getLoginPath(role, "/dashboard"), "/");
  }
});
