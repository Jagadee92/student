import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { readExcel } from "../src/utils/readExcel.js";

test("parses XLSX headers and rows into records", async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");
  worksheet.addRow(["name", "email", "passingYear"]);
  worksheet.addRow(["Asha Rao", "asha@example.com", 2026]);

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  assert.deepEqual(await readExcel(buffer), [
    { name: "Asha Rao", email: "asha@example.com", passingYear: 2026 },
  ]);
});
