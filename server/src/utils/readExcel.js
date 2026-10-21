import ExcelJS from "exceljs";

export async function readExcel(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return null;

  const headers = worksheet
    .getRow(1)
    .values.slice(1)
    .map((value) => String(value ?? "").trim());
  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const value = row.getCell(index + 1).value;
      record[header] =
        value && typeof value === "object"
          ? (value.text ??
            value.result ??
            value.richText?.map((part) => part.text).join("") ??
            "")
          : (value ?? "");
    });
    rows.push(record);
  });
  return rows;
}
