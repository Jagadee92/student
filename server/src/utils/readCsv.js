import { Readable } from "stream";
import csvParser from "csv-parser";

export function readCsv(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];

    Readable.from([buffer])
      .pipe(csvParser())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}
