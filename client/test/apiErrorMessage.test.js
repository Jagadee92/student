import test from "node:test";
import assert from "node:assert/strict";
import { getApiErrorMessage } from "../src/utils/apiErrorMessage.js";

test("API errors display validation details instead of the generic message", () => {
  assert.equal(
    getApiErrorMessage(
      {
        message: "Please correct the highlighted information.",
        errors: [
          {
            field: "password",
            message: "Password must include a special character.",
          },
        ],
      },
      400,
    ),
    "password: Password must include a special character.",
  );
});

test("API errors preserve their server message when details are absent", () => {
  assert.equal(
    getApiErrorMessage({ message: "SMTP settings are invalid." }, 503),
    "SMTP settings are invalid.",
  );
  assert.equal(getApiErrorMessage(null, 503), "Request failed with status 503.");
});
