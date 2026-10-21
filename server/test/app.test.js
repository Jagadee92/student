import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
});

test("health endpoint reports when MongoDB is disconnected", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const data = await response.json();

  assert.equal(response.status, 503);
  assert.equal(data.status, "unavailable");
  assert.equal(data.database, "disconnected");
});

test("API root explains that the server is running", async () => {
  const response = await fetch(`${baseUrl}/`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.service, "mern-practice-api");
  assert.equal(data.health, "/api/health");
});

test("CORS preflight responses are cacheable to avoid repeated browser round trips", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5174",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-max-age"), "86400");
});

test("student endpoints require authentication", async () => {
  const response = await fetch(`${baseUrl}/api/students`);
  const data = await response.json();

  assert.equal(response.status, 401);
  assert.match(data.message, /sign in/i);
});

test("academic catalog routes require authentication", async () => {
  for (const route of ["/api/courses", "/api/instructors", "/api/programs"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 401);
  }
});

test("unknown routes return a JSON 404 response", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.match(data.message, /route not found/i);
});

test("JSON null bodies are rejected with a readable validation response", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "null",
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.message, "Request body contains invalid JSON.");
});

test("malformed JSON is rejected with a readable error", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.message, "Request body contains invalid JSON.");
});

test("student registration requires the staged email-verification flow", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Student", email: "student@example.com" }),
  });
  const data = await response.json();

  assert.equal(response.status, 410);
  assert.match(data.message, /email verification/i);
});

test("registration details reject incomplete requests before database access", async () => {
  const response = await fetch(`${baseUrl}/api/auth/registration/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName: "Student" }),
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.message, "Please correct the highlighted information.");
});

test("student registration requires a supported gender before database access", async () => {
  const registration = {
    firstName: "College",
    lastName: "Student",
    email: "gender-check@example.com",
    rollNumber: "CS2026001",
    phone: "+15551234567",
    address: "42 College Road",
    program: "B.Tech",
    branch: "Computer Science",
    yearOfStudy: 1,
    passingOutYear: 2030,
  };

  for (const gender of [undefined, "invalid"]) {
    const response = await fetch(`${baseUrl}/api/auth/registration/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...registration,
        ...(gender === undefined ? {} : { gender }),
      }),
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.message, "Please correct the highlighted information.");
    assert.ok(data.errors.some((error) => error.field === "gender"));
  }
});
