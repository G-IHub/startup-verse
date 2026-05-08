import { request } from "./backendClient";

function toAnnouncement(row) {
  if (!row) return null;
  return {
    id: String(row.id || row._id || ""),
    startupId: String(row.startupId || row.founderId || ""),
    title: String(row.title || "Announcement"),
    message: String(row.message || row.body || ""),
    body: String(row.body || row.message || ""),
    priority: String(row.priority || "normal"),
    category: String(row.category || "general"),
    emoji: typeof row.emoji === "string" ? row.emoji : "",
    createdBy: String(row.createdBy || ""),
    createdByName: String(row.createdByName || ""),
    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
    readBy: Array.isArray(row.readBy) ? row.readBy.map(String) : [],
  };
}

export async function getStartupAnnouncements(startupId) {
  const payload = await request(`/startups/${startupId}/announcements`, {
    method: "GET",
  });
  const rows = payload?.data || payload?.announcements || [];
  return {
    success: true,
    announcements: rows.map(toAnnouncement).filter(Boolean),
  };
}

export async function postStartupAnnouncement(startupId, input) {
  const payload = await request(`/startups/${startupId}/announcements`, {
    method: "POST",
    body: JSON.stringify(input || {}),
  });
  const row = toAnnouncement(payload?.data || payload?.announcement);
  return { success: true, announcement: row };
}
