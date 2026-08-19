/** Client-side CSV export — mock of the real export API. Builds a Blob and
 * triggers a download. Keeping it a lib function makes report / list pages
 * a one-liner and lets us swap in a server export later without touching UI. */

const CSV_SEP = ",";

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(CSV_SEP)).join("\n");
}

export function downloadCsv(fileName: string, headers: string[], rows: (string | number)[][]): void {
  const blob = new Blob(["\uFEFF" + toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}