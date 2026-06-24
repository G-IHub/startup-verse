export const PROJECT_COLORS = [
  "#1A56DB",
  "#0D9488",
  "#7C3AED",
  "#DC2626",
  "#D97706",
  "#059669",
];

export function resolveFounderId(user) {
  if (!user) return "";
  if (user.role === "founder") {
    return String(user._id || user.id || "");
  }
  if (user.role === "team-member" || user.role === "team") {
    return String(user.startupId || user.founderId || "");
  }
  return "";
}

export function resolveStartupName(user) {
  if (!user) return "Startup";
  return (
    user.startupName ||
    user.companyName ||
    user.profile?.startupName ||
    user.profile?.companyName ||
    "Startup"
  );
}

export function slugFromName(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STATUS_STYLES = {
  active: "bg-[#EFF6FF] text-[#1D4ED8]",
  paused: "bg-[#FFFBEB] text-[#B45309]",
  completed: "bg-[#F0FDF4] text-[#166534]",
  archived: "bg-[#F3F4F6] text-[#6B7280]",
  "in-progress": "bg-[#EEF2FF] text-[#4338CA]",
  pending: "bg-[#F3F4F6] text-[#6B7280]",
  blocked: "bg-[#FFF1F2] text-[#BE123C]",
};

export function statusBadgeClass(status) {
  return STATUS_STYLES[String(status || "").toLowerCase()] || STATUS_STYLES.pending;
}

export function formatShortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function memberInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
