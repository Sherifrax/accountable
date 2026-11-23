/** Rows whose visible text contains the query, ignoring case (R-TBL-1). */
export function searchRows<T>(
  rows: T[],
  query: string,
  visibleText: (row: T) => (string | number | null | undefined)[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    visibleText(row).some((value) => value != null && String(value).toLowerCase().includes(q)),
  );
}
