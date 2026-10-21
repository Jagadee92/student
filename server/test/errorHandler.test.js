import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../src/middleware/errorHandler.js";

test("returns a retryable response for MongoDB network failures", () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  errorHandler(
    {
      name: "MongoServerSelectionError",
      message: "Atlas TLS connection failed",
    },
    {},
    response,
    () => {},
  );

  assert.equal(response.statusCode, 503);
  assert.match(response.body.message, /database is temporarily unavailable/i);
});
