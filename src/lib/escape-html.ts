// Small helper to safely inject user-controlled strings into HTML we
// build via string concatenation (e.g. print windows opened with
// window.open + document.write). Prevents stored XSS from customer /
// order / moodboard data captured through webhooks.
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Encode a value so it is safe to place inside an HTML attribute value
// that is wrapped in double quotes (e.g. <img src="..."> or href="...").
export function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}