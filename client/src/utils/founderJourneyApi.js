import { apiPut } from "./apiClient.js";
import { configureJourneyUser, getJourneyProgress } from "./journeyProgress.js";

export async function syncJourneyProgressToServer(userId) {
  if (!userId) return;
  configureJourneyUser(userId);
  await apiPut(`/founders/${userId}/journey`, { journey: getJourneyProgress() });
}

export async function syncFounderHomeUiPatch(userId, homeUiPatch) {
  if (!userId || !homeUiPatch || typeof homeUiPatch !== "object") return;
  await apiPut(`/founders/${userId}/journey`, { homeUi: homeUiPatch });
}
