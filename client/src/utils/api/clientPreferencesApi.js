import { get, put } from "../backendClient.js";

export async function fetchClientPreferences(userId) {
  const payload = await get(`/users/${userId}/client-preferences`);
  return payload.data && typeof payload.data === "object" ? payload.data : {};
}

export async function mergeClientPreferencesPatch(userId, patch) {
  const payload = await put(`/users/${userId}/client-preferences`, patch);
  return payload.data && typeof payload.data === "object" ? payload.data : {};
}
