/**
 * Deterministic presentational helpers shared by the AI Staff orchestration
 * pages (Approval Queue, Autonomy Settings, Audit Trail). Real Agent/ActionType
 * docs (server/src/models/Agent.js, ActionType.js) carry no color/initials
 * field — these derive a stable look from the agent's real id/name instead of
 * hardcoding a per-agent palette. See docs/ai-agent-roadmap.md Phase 0.
 */

const PALETTE = [
  { bg: "#E6F1FB", color: "#0C447C" },
  { bg: "#FAEEDA", color: "#633806" },
  { bg: "#FCEBEB", color: "#791F1F" },
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#EAF3DE", color: "#27500A" },
  { bg: "#f3f4f6", color: "#6b7280" },
];

export function paletteForAgent(key) {
  const s = String(key || "");
  if (!s) return PALETTE[PALETTE.length - 1];
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function initialsForAgent(name) {
  if (!name) return "AI";
  const cleaned = name.replace(/^AI\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AI";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function formatEventTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
  if (d.toDateString() === now.toDateString()) return `${time} today`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `${time} yesterday`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

// Real Task-level agent assignment (2026-09-18, see Task.js's assignedAgentKey)
// — a small, shared label so every place a human assignee's avatar/name
// renders can show "🤖 AI Sales"/"🤖 AI Marketing" instead, without each
// screen inventing its own copy of this mapping.
const AGENT_ASSIGNMENT_LABELS = { sales: "AI Sales", mkt: "AI Marketing" };

export function agentAssignmentLabel(agentKey) {
  const label = AGENT_ASSIGNMENT_LABELS[agentKey];
  return label ? `🤖 ${label}` : null;
}

export function riskDisplay(riskCategory) {
  if (riskCategory === "sensitive_locked") return { label: "Sensitive", bg: "#FCEBEB", color: "#791F1F" };
  if (riskCategory === "read_only") return { label: "Read-only", bg: "#f3f4f6", color: "#6b7280" };
  return { label: "Low risk", bg: "#f3f4f6", color: "#6b7280" };
}
