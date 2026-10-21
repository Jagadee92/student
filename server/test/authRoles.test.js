import test from "node:test";
import assert from "node:assert/strict";
import { requireAdmin, requireStaffOrAdmin } from "../src/middleware/auth.js";

function checkRole(middleware, role) {
  const req = { user: role ? { role } : null };
  const res = {
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
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  return { res, nextCalled };
}

test("staff-authorized routes allow Admin and Staff", () => {
  for (const role of ["admin", "staff"]) {
    const { res, nextCalled } = checkRole(requireStaffOrAdmin, role);
    assert.equal(res.statusCode, 200);
    assert.equal(nextCalled, true);
  }
});

test("staff-authorized routes deny Student, Viewer, and missing users", () => {
  for (const role of ["student", "viewer", null]) {
    const { res, nextCalled } = checkRole(requireStaffOrAdmin, role);
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
    assert.match(res.body.message, /permission/i);
  }
});

test("admin-only routes deny staff and student accounts", () => {
  for (const role of ["staff", "student", "viewer", null]) {
    const { res, nextCalled } = checkRole(requireAdmin, role);
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  }
  const { res, nextCalled } = checkRole(requireAdmin, "admin");
  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});
