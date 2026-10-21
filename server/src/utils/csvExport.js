export function escapeCsvRows(rows) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "string" && /^[\t\r ]*[=+\-@]/.test(value)
          ? `'${value}`
          : value,
      ]),
    ),
  );
}
