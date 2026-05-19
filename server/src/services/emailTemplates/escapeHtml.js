/**
 * Minimal HTML escaper for email templates. Keep dependency-free: we only
 * interpolate short, user-supplied identifiers (names, links) into otherwise
 * fully-trusted markup, so a small replace table is enough.
 */
const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] || ch);
}
