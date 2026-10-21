import test from "node:test";
import assert from "node:assert/strict";
import { readCsv } from "../src/utils/readCsv.js";

test("parses a CSV buffer into student records", async () => {
  const csv = Buffer.from(
    "name,email,department,degree,rollNumber,passingYear\nAsha,asha@example.com,CSE,B.Tech,CSE001,2024\n",
  );

  const rows = await readCsv(csv);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Asha");
  assert.equal(rows[0].email, "asha@example.com");
  assert.equal(rows[0].department, "CSE");
  assert.equal(rows[0].passingYear, "2024");
});

test("returns an empty array when the CSV has no data rows", async () => {
  const csv = Buffer.from("name,email,department,degree,rollNumber,passingYear\n");

  const rows = await readCsv(csv);

  assert.deepEqual(rows, []);
});
