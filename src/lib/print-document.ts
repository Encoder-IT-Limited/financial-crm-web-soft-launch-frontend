/** Opens a new window with printable HTML and triggers the browser print dialog. */
export function openPrintWindow(title: string, bodyHtml: string): void {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #111; margin: 24px; font-size: 12px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .muted { color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px 10px; text-align: left; }
    th { font-size: 10px; text-transform: uppercase; color: #666; background: #f5f5f5; }
    .totals { margin-left: auto; width: 240px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .total-row { font-weight: 700; border-top: 2px solid #111; padding-top: 8px; margin-top: 4px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { escapeHtml };
