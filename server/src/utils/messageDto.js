/**
 * Single source of truth for the Message JSON shape exposed to API clients
 * and realtime socket consumers. Used by both HTTP responses
 * (server/src/routes/messages.routes.js) and org-message socket emits
 * (server/src/controllers/organizationMessages.controller.js) so the
 * wire shape never drifts between transport.
 */
export function mapMessageDto(messageDoc) {
  if (!messageDoc) return null;
  const row = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
  return {
    id: String(row._id || row.id || ""),
    startupId: row.startupId ? String(row.startupId) : "",
    organizationId: row.organizationId ? String(row.organizationId) : "",
    cohortId: row.cohortId ? String(row.cohortId) : "",
    fromUserId: row.fromUserId ? String(row.fromUserId) : "",
    toUserId: row.toUserId ? String(row.toUserId) : "",
    subject: typeof row.subject === "string" ? row.subject : "",
    body: String(row.body || ""),
    messageType: typeof row.messageType === "string" ? row.messageType : "dm",
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    readAt: row.readAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  };
}

export default mapMessageDto;
