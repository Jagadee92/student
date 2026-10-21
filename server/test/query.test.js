import test from "node:test";
import assert from "node:assert/strict";
import {
  escapeRegex,
  getStudentOptions,
  isValidRole,
  isValidPhone,
  cleanEmail,
} from "../src/utils/query.js";

test("uses safe defaults for the student list", () => {
  assert.deepEqual(getStudentOptions({}), {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    search: "",
    department: "",
    degree: "",
    gender: "",
  });
});

test("accepts supported page sizes, filters, and sort options", () => {
  const options = getStudentOptions({
    page: "2",
    limit: "25",
    search: " Asha ",
    department: "Computer Science",
    degree: "B.Tech",
    gender: "Female",
    sortBy: "name",
    sortOrder: "asc",
  });

  assert.equal(options.page, 2);
  assert.equal(options.limit, 25);
  assert.equal(options.search, "Asha");
  assert.equal(options.department, "Computer Science");
  assert.equal(options.degree, "B.Tech");
  assert.equal(options.gender, "Female");
  assert.equal(options.sortBy, "name");
  assert.equal(options.sortOrder, "asc");
});

test("rejects bad page sizes and unsafe sort fields", () => {
  assert.throws(() => getStudentOptions({ limit: "1000" }), {
    status: 400,
  });
  assert.throws(() => getStudentOptions({ sortBy: "password" }), {
    status: 400,
  });
  assert.throws(() => getStudentOptions({ page: "0" }), { status: 400 });
  assert.throws(() => getStudentOptions({ gender: "not-a-gender" }), {
    status: 400,
  });
  assert.throws(() => getStudentOptions({ degree: "not-a-degree" }), {
    status: 400,
  });
});

test("escapes regular-expression special characters", () => {
  const expression = new RegExp(escapeRegex("C++ (JS)"), "i");
  assert.equal(expression.test("I study C++ (JS)"), true);
  assert.equal(expression.test("I study Cxxxx JS"), false);
});

test("normalizes emails and validates mobile numbers", () => {
  assert.equal(cleanEmail("  USER@Example.COM "), "user@example.com");
  assert.equal(isValidPhone("98765 43210"), true);
  assert.equal(isValidPhone("+919876543210"), true);
  assert.equal(isValidPhone("123"), false);
});

test("only the documented application roles are accepted", () => {
  assert.equal(isValidRole("admin"), true);
  assert.equal(isValidRole("staff"), true);
  assert.equal(isValidRole("student"), true);
  assert.equal(isValidRole("viewer"), true);
  assert.equal(isValidRole("superuser"), false);
});
