export function buildDefaultInviteMessage(startupName, cohortName) {
  return `We'd like to invite ${startupName || "your startup"} to join ${cohortName}. This will give us read-only access to your execution progress to better support your journey.`;
}

export function parseApiError(error) {
  const match = /^API Error \((\d+)\):\s*(.*)$/s.exec(error?.message || "");
  if (!match) return { status: 0, message: error?.message || "" };
  const status = Number(match[1]);
  let message = match[2];
  try {
    const parsed = JSON.parse(match[2]);
    if (parsed && typeof parsed.message === "string") {
      message = parsed.message;
    }
  } catch (_) {
    // Keep the raw server text if it is not JSON.
  }
  return { status, message };
}
