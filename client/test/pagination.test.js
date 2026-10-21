import test from "node:test";
import assert from "node:assert/strict";
import { paginateItems } from "../src/utils/pagination.js";

test("paginateItems returns the requested page", () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1);

  assert.deepEqual(paginateItems(items, 2, 10), {
    items: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    page: 2,
    totalPages: 3,
    firstItem: 11,
    lastItem: 20,
    totalItems: 23,
  });
});

test("paginateItems clamps pages after the item count shrinks", () => {
  assert.deepEqual(paginateItems([1, 2, 3], 4, 2), {
    items: [3],
    page: 2,
    totalPages: 2,
    firstItem: 3,
    lastItem: 3,
    totalItems: 3,
  });
});

test("paginateItems handles an empty list", () => {
  assert.deepEqual(paginateItems([], 1, 10), {
    items: [],
    page: 1,
    totalPages: 1,
    firstItem: 0,
    lastItem: 0,
    totalItems: 0,
  });
});
