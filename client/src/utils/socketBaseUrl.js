/**
 * Socket.IO connects to the HTTP origin of the API, not the /api/v1 path.
 */
export function getSocketBaseUrl() {
  const api =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  try {
    const u = new URL(api);
    return u.origin;
  } catch {
    return "http://localhost:5000";
  }
}
