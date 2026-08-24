export function formatWorkLogTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getWorkLogAttachmentSummary(log) {
  const items = [];
  if (log?.image?.url) items.push("Photo");
  if (log?.linkUrl) items.push("Link");
  return items;
}
