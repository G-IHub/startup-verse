/** Cohort export row mapping and CSV generation (Step 4.1 / O3). */

const CSV_HEADER =
  "Startup Name,Founder,Stage,Team Size,Status,Last Activity,Weekly Streak";

export function escapeCsvField(value) {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function mapMemberToExportRow(member) {
  const progress = member?.progress || {};
  const lastActive = progress.lastActive
    ? new Date(progress.lastActive).toISOString()
    : "Never";

  return {
    name: member?.startupName || "Unnamed Startup",
    founder: member?.founderName || "",
    stage: member?.currentStage || member?.startup?.stage || "",
    teamSize: progress.teamSize ?? 1,
    status: progress.activityStatus || "unknown",
    lastActivity: lastActive,
    weeklyStreak: progress.weeklyOutcomeStreak ?? 0,
  };
}

export function buildCohortExportDocument({ cohort, organizationName, members }) {
  const startups = (members || []).map(mapMemberToExportRow);
  return {
    cohort: {
      name: cohort?.name || "",
      organization: organizationName || "",
      startDate: cohort?.startDate ?? null,
      endDate: cohort?.endDate ?? null,
      exportedAt: new Date().toISOString(),
    },
    startups,
  };
}

export function exportRowsToCsv(startups) {
  const rows = (startups || []).map((s) =>
    [
      escapeCsvField(s.name),
      escapeCsvField(s.founder),
      escapeCsvField(s.stage),
      escapeCsvField(s.teamSize),
      escapeCsvField(s.status),
      escapeCsvField(s.lastActivity),
      escapeCsvField(s.weeklyStreak),
    ].join(","),
  );
  return `${CSV_HEADER}\n${rows.join("\n")}\n`;
}

export function sanitizeExportFilename(name) {
  const base = String(name || "cohort")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 80);
  return base || "cohort";
}
