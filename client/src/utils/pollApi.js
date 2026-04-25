import { request } from "./backendClient";

function toPoll(row) {
  if (!row) return null;
  const totalVotes = (row.options || []).reduce((s, o) => s + (o.votes?.length || 0), 0);
  return {
    id: String(row.id || row._id || ""),
    startupId: String(row.startupId || ""),
    question: String(row.question || ""),
    description: String(row.description || ""),
    options: (row.options || []).map((o) => ({
      id: String(o.id || ""),
      text: String(o.text || ""),
      votes: Array.isArray(o.votes) ? o.votes.map(String) : [],
      percentage: totalVotes > 0 ? Math.round((o.votes?.length || 0) / totalVotes * 100) : 0,
    })),
    allowMultiple: Boolean(row.allowMultiple),
    anonymous: Boolean(row.anonymous),
    endsAt: row.endsAt ? new Date(row.endsAt) : null,
    status: String(row.status || "active"),
    totalVotes,
    createdBy: String(row.createdBy || ""),
    createdByName: String(row.createdByName || ""),
    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
  };
}

export async function getStartupPolls(startupId) {
  try {
    const payload = await request(`/startups/${encodeURIComponent(startupId)}/polls`, { method: "GET" });
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    return { success: true, polls: rows.map(toPoll).filter(Boolean) };
  } catch (err) {
    return { success: false, error: err?.message || "Network error", polls: [] };
  }
}

export async function createPoll(startupId, data) {
  const payload = await request(`/startups/${encodeURIComponent(startupId)}/polls`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
  return { success: true, poll: toPoll(payload?.data || payload?.poll) };
}

export async function votePoll(startupId, pollId, optionId) {
  const payload = await request(
    `/startups/${encodeURIComponent(startupId)}/polls/${encodeURIComponent(pollId)}/vote`,
    { method: "POST", body: JSON.stringify({ optionId }) },
  );
  return { success: true, poll: toPoll(payload?.data || payload?.poll) };
}

export async function closePoll(startupId, pollId) {
  const payload = await request(
    `/startups/${encodeURIComponent(startupId)}/polls/${encodeURIComponent(pollId)}/close`,
    { method: "PATCH" },
  );
  return { success: true, poll: toPoll(payload?.data || payload?.poll) };
}
