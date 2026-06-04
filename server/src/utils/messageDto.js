/**
 * Single source of truth for the Message JSON shape exposed to API clients
 * and realtime socket consumers.
 */
function mapReplyPreview(row) {
  if (!row || typeof row !== "object") return null;
  return {
    messageId: row.messageId ? String(row.messageId) : "",
    senderId: row.senderId ? String(row.senderId) : "",
    senderName: String(row.senderName || ""),
    bodySnippet: String(row.bodySnippet || ""),
    hasAttachment: Boolean(row.hasAttachment),
    deletedForEveryone: Boolean(row.deletedForEveryone),
  };
}

function mapForwardedFrom(row) {
  if (!row || typeof row !== "object") return null;
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];
  return {
    messageId: row.messageId ? String(row.messageId) : "",
    fromUserId: row.fromUserId ? String(row.fromUserId) : "",
    fromUserName: String(row.fromUserName || ""),
    bodySnippet: String(row.bodySnippet || ""),
    attachments,
  };
}

export function mapMessageDto(messageDoc, options = {}) {
  if (!messageDoc) return null;
  const row = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
  const viewerUserId = options.viewerUserId
    ? String(options.viewerUserId)
    : null;

  if (
    viewerUserId &&
    Array.isArray(row.hiddenForUserIds) &&
    row.hiddenForUserIds.some((id) => String(id) === viewerUserId)
  ) {
    return null;
  }

  const deletedForEveryone = Boolean(row.deletedForEveryoneAt);
  const attachments = deletedForEveryone
    ? []
    : Array.isArray(row.attachments)
      ? row.attachments
      : [];
  const firstAtt =
    attachments[0] && typeof attachments[0] === "object" ? attachments[0] : null;

  return {
    id: String(row._id || row.id || ""),
    startupId: row.startupId ? String(row.startupId) : "",
    organizationId: row.organizationId ? String(row.organizationId) : "",
    cohortId: row.cohortId ? String(row.cohortId) : "",
    fromUserId: row.fromUserId ? String(row.fromUserId) : "",
    toUserId: row.toUserId ? String(row.toUserId) : "",
    subject: typeof row.subject === "string" ? row.subject : "",
    body: deletedForEveryone ? "" : String(row.body || ""),
    messageType: typeof row.messageType === "string" ? row.messageType : "dm",
    attachments,
    fileUrl: firstAtt?.url ? String(firstAtt.url) : "",
    fileName: firstAtt?.fileName ? String(firstAtt.fileName) : "",
    fileSize: firstAtt?.fileSize ?? 0,
    fileType: firstAtt?.fileType ? String(firstAtt.fileType) : "",
    readAt: row.readAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    replyToMessageId: row.replyToMessageId ? String(row.replyToMessageId) : "",
    replyTo: mapReplyPreview(row.replyPreview),
    forwardedFrom: mapForwardedFrom(row.forwardedFrom),
    deletedForEveryone,
    deletedForEveryoneAt: row.deletedForEveryoneAt || null,
    hiddenForUserIds: Array.isArray(row.hiddenForUserIds)
      ? row.hiddenForUserIds.map((id) => String(id))
      : [],
    canDeleteForEveryone: options.includeActionFlags
      ? !deletedForEveryone &&
        String(row.fromUserId) === viewerUserId &&
        row.messageType === "dm"
      : undefined,
  };
}

export default mapMessageDto;
