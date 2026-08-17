import { request } from "../backendClient";

export async function listListedPrograms(page = 1) {
  const payload = await request(`/programs?page=${page}`, { method: "GET" });
  return payload?.data || payload || { programs: [] };
}

export async function requestProgramJoin(cohortId, message = "") {
  const payload = await request(`/programs/${cohortId}/join-requests`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return payload?.data || payload;
}

export async function listProgramJoinRequests(orgId, cohortId, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const payload = await request(
    `/organizations/${orgId}/cohorts/${cohortId}/join-requests${query}`,
    { method: "GET" },
  );
  return payload?.data || payload || { requests: [] };
}

export async function reviewProgramJoinRequest(orgId, cohortId, requestId, status) {
  const payload = await request(
    `/organizations/${orgId}/cohorts/${cohortId}/join-requests/${requestId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  return payload?.data || payload;
}

export async function listProgramNotes(cohortId, page = 1) {
  const payload = await request(
    `/programs/${cohortId}/notes?page=${page}`,
    { method: "GET" },
  );
  return payload?.data || payload || { notes: [] };
}

export async function createProgramNote(cohortId, body) {
  const payload = await request(`/programs/${cohortId}/notes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return payload?.data || payload;
}
