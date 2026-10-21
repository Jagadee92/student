import test from "node:test";
import assert from "node:assert/strict";
import { escapeCsvRows } from "../src/utils/csvExport.js";

test("protects spreadsheet formula prefixes in exported CSV text", () => {
  const rows = [
    {
      name: "=HYPERLINK(\"https://example.com\")",
      email: "  @SUM(A1:A2)",
      mobile: "+15551234567",
      status: "enrolled",
      passingYear: 2026,
    },
  ];

  assert.deepEqual(escapeCsvRows(rows), [
    {
      name: "'=HYPERLINK(\"https://example.com\")",
      email: "'  @SUM(A1:A2)",
      mobile: "'+15551234567",
      status: "enrolled",
      passingYear: 2026,
    },
  ]);
  assert.equal(rows[0].name, '=HYPERLINK("https://example.com")');
});
