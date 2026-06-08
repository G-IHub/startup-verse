/**
 * Normalize attachment records from API/socket/Inbox shapes into a consistent list.
 */
export function normalizeMessageAttachments(message) {
  if (!message || typeof message !== "object") return [];
  const fromArray = Array.isArray(message.attachments) ? message.attachments : [];
  const mapped = fromArray
    .filter((a) => a && typeof a === "object" && (a.url || a.fileUrl))
    .map((a) => ({
      url: String(a.url || a.fileUrl || ""),
      fileName: String(a.fileName || a.name || "file"),
      fileSize: Number(a.fileSize ?? a.size ?? 0) || 0,
      fileType: String(a.fileType || a.mimeType || a.type || ""),
    }));

  if (mapped.length > 0) return mapped;

  if (message.fileUrl) {
    return [
      {
        url: String(message.fileUrl),
        fileName: String(message.fileName || "file"),
        fileSize: Number(message.fileSize ?? 0) || 0,
        fileType: String(message.fileType || ""),
      },
    ];
  }
  return [];
}

export function inferAttachmentKind(fileType, fileName = "") {
  const mt = String(fileType || "").toLowerCase();
  const name = String(fileName || "").toLowerCase();
  if (mt.startsWith("image/")) return "image";
  if (mt.startsWith("video/")) return "video";
  if (mt === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  return "file";
}

/** Short label for conversation list previews. */
export function formatAttachmentPreviewLabel(attachments) {
  const list = Array.isArray(attachments) ? attachments : [];
  if (list.length === 0) return "";
  const first = list[0];
  const kind = inferAttachmentKind(first.fileType, first.fileName);
  if (list.length > 1) {
    if (kind === "image") return "Photos";
    if (kind === "video") return "Videos";
    if (kind === "pdf") return "PDFs";
    return "Files";
  }
  if (kind === "image") return "Photo";
  if (kind === "video") return "Video";
  if (kind === "pdf") return "PDF";
  return first.fileName || "File";
}

export function formatConversationPreview(message) {
  if (!message) return "";
  const attachments = normalizeMessageAttachments(message);
  const text = String(message.content || message.text || message.body || "").trim();
  if (text) return text;
  if (attachments.length > 0) return formatAttachmentPreviewLabel(attachments);
  return "";
}
