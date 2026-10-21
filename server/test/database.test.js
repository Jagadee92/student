import test from "node:test";
import assert from "node:assert/strict";
import { getDbError } from "../src/config/database.js";

test("reports the underlying MongoDB host connection error", () => {
  const error = {
    reason: {
      servers: new Map([
        [
          "db.example.mongodb.net:27017",
          { error: new Error("TLS handshake failed\nprivate detail") },
        ],
      ]),
    },
  };

  assert.equal(
    getDbError(error),
    "db.example.mongodb.net:27017: TLS handshake failed",
  );
});

test("returns no server details when MongoDB has no per-host errors", () => {
  assert.equal(getDbError({}), "");
});
