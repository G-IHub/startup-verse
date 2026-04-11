/** Unwrap `{ success, data }` API responses (or pass through legacy shapes). */
export function unwrapData(json) {
  if (!json || typeof json !== "object") return json;
  return json.data !== undefined ? json.data : json;
}
