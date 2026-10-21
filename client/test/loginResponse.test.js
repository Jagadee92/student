import test from "node:test";
import assert from "node:assert/strict";
import { getLoginUser } from "../src/utils/loginResponse.js";

test("returns the user from a valid login response", () => {
  const user = { id: "123", role: "admin" };
  assert.equal(getLoginUser({ token: "token", user }), user);
});

test("rejects an unexpected login response with a useful API configuration error", () => {
  assert.throws(
    () => getLoginUser(new Blob(["The app HTML"])),
    /VITE_API_URL.*backend API/,
  );
});
