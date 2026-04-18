import { useCallback, useEffect, useMemo, useState } from "react";
import { request } from "../../../utils/backendClient";
import { mapTalentHomeViewModel } from "../mappers/talentViewModel";

function readJson(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function cacheJson(key, rows) {
  try {
    localStorage.setItem(key, JSON.stringify(rows || []));
  } catch {
    // Ignore cache failures in private mode / restricted storage.
  }
}

function getSavedCacheKey(talentId) {
  return `startupverse_talent_saved_${talentId}`;
}

function readFallbackOpportunities() {
  return readJson("startupverse_startup_posts", []);
}

function readFallbackSaved(talentId) {
  return readJson(getSavedCacheKey(talentId), []);
}

function readFallbackSentInterests(talentId) {
  return readJson("startupverse_sent_interests", []).filter((row) => {
    const rowTalentId = String(row?.talentId || row?.sentById || "");
    return rowTalentId && rowTalentId === String(talentId || "");
  });
}

function readFallbackInvitations(talentId) {
  return readJson("startupverse_sent_invitations", []).filter((row) => {
    const rowTalentId = String(row?.talentId || "");
    return rowTalentId && rowTalentId === String(talentId || "");
  });
}

function normalizePostsResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.posts)) return payload.posts;
  return [];
}

function normalizeSavedResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

function normalizeInterestResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.interests)) return payload.interests;
  return [];
}

function normalizeInvitationResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.invitations)) return payload.invitations;
  return [];
}

function getOpportunityId(opportunity) {
  return String(opportunity?.id || opportunity?._id || "").trim();
}

function getStartupId(opportunity) {
  return String(opportunity?.startupId || getOpportunityId(opportunity)).trim();
}

function resolveFounderId(opportunity) {
  return String(
    opportunity?.founderId ||
      opportunity?.ownerId ||
      opportunity?.createdBy ||
      "",
  ).trim();
}

function appendLocalInterest(talentId, newInterest) {
  const key = "startupverse_sent_interests";
  const existing = readJson(key, []);
  const next = [newInterest, ...existing];
  cacheJson(key, next);
  return next.filter((row) => String(row?.talentId || row?.sentById || "") === String(talentId));
}

export function useTalentHomeData({ user }) {
  const talentId = String(user?.id || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingIds, setSavingIds] = useState(new Set());
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [rawData, setRawData] = useState({
    opportunities: [],
    savedItems: [],
    sentInterests: [],
    invitations: [],
    applications: [],
    fallbackUsed: false,
  });

  const loadData = useCallback(async () => {
    if (!talentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [
      opportunitiesResult,
      savedResult,
      sentResult,
      invitationResult,
      applicationsResult,
    ] = await Promise.allSettled([
      request("/talent/startup-posts"),
      request(`/talent/${talentId}/saved`),
      request(`/interests/sent/${talentId}`),
      request(`/invitations/received/${talentId}`),
      request(`/talent/${talentId}/applications`),
    ]);

    const fallbackUsed =
      opportunitiesResult.status === "rejected" ||
      savedResult.status === "rejected" ||
      sentResult.status === "rejected" ||
      invitationResult.status === "rejected" ||
      applicationsResult.status === "rejected";

    const opportunities =
      opportunitiesResult.status === "fulfilled"
        ? normalizePostsResponse(opportunitiesResult.value.data)
        : readFallbackOpportunities();
    const savedItems =
      savedResult.status === "fulfilled"
        ? normalizeSavedResponse(savedResult.value.data)
        : readFallbackSaved(talentId);
    const sentInterests =
      sentResult.status === "fulfilled"
        ? normalizeInterestResponse(sentResult.value.data)
        : readFallbackSentInterests(talentId);
    const invitations =
      invitationResult.status === "fulfilled"
        ? normalizeInvitationResponse(invitationResult.value.data)
        : readFallbackInvitations(talentId);
    const applications =
      applicationsResult.status === "fulfilled"
        ? Array.isArray(applicationsResult.value.data)
          ? applicationsResult.value.data
          : []
        : [];

    if (opportunitiesResult.status === "fulfilled") {
      cacheJson("startupverse_startup_posts", opportunities);
    }
    if (savedResult.status === "fulfilled") {
      cacheJson(getSavedCacheKey(talentId), savedItems);
    }
    if (sentResult.status === "fulfilled") {
      cacheJson(
        "startupverse_sent_interests",
        normalizeInterestResponse(sentResult.value.data),
      );
    }

    if (opportunitiesResult.status === "rejected") {
      setError(
        "Could not load opportunities from backend. Showing fallback data until sync recovers.",
      );
    } else if (fallbackUsed) {
      setError("Some sections are in fallback mode while backend sync recovers.");
    }

    setRawData({
      opportunities,
      savedItems,
      sentInterests,
      invitations,
      applications,
      fallbackUsed,
    });
    setLoading(false);
  }, [talentId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const viewModel = useMemo(
    () =>
      mapTalentHomeViewModel({
        user,
        opportunityRows: rawData.opportunities,
        savedRows: rawData.savedItems,
        sentInterestRows: rawData.sentInterests,
        invitationRows: rawData.invitations,
        applicationRows: rawData.applications,
        fallbackUsed: rawData.fallbackUsed,
      }),
    [rawData, user],
  );

  const toggleSaved = useCallback(
    async (opportunity) => {
      const opportunityId = getOpportunityId(opportunity);
      if (!opportunityId || !talentId) {
        return { success: false, error: "Missing opportunity id." };
      }

      const startupId = getStartupId(opportunity);
      const isSaved =
        viewModel.savedIdSet.has(opportunityId) || viewModel.savedIdSet.has(startupId);
      if (savingIds.has(opportunityId)) return { success: false };

      setSavingIds((prev) => {
        const next = new Set(prev);
        next.add(opportunityId);
        return next;
      });

      try {
        if (isSaved) {
          await request(
            `/talent/${talentId}/saved/startup/${encodeURIComponent(startupId)}`,
            {
              method: "DELETE",
            },
          );
          setRawData((prev) => {
            const nextRows = prev.savedItems.filter((row) => {
              const rowId = String(
                row?.itemId || row?.startupId || row?.id || "",
              ).trim();
              return rowId !== startupId && rowId !== opportunityId;
            });
            cacheJson(getSavedCacheKey(talentId), nextRows);
            return { ...prev, savedItems: nextRows };
          });
          return { success: true, saved: false };
        }

        const response = await request(`/talent/${talentId}/saved`, {
          method: "POST",
          body: JSON.stringify({
            itemType: "startup",
            itemId: startupId,
            metadata: {
              title: opportunity?.title || "",
              founderId: resolveFounderId(opportunity),
            },
          }),
        });
        const createdRow =
          response?.data && typeof response.data === "object"
            ? response.data
            : {
                id: `${startupId}-saved`,
                itemType: "startup",
                itemId: startupId,
                metadata: {},
              };
        setRawData((prev) => {
          const nextRows = [createdRow, ...prev.savedItems];
          cacheJson(getSavedCacheKey(talentId), nextRows);
          return { ...prev, savedItems: nextRows };
        });
        return { success: true, saved: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Could not update saved state.",
        };
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(opportunityId);
          return next;
        });
      }
    },
    [savingIds, talentId, viewModel.savedIdSet],
  );

  const sendInterest = useCallback(
    async ({ opportunity, message }) => {
      const startupId = getStartupId(opportunity);
      const founderId = resolveFounderId(opportunity);
      if (!startupId || !founderId || !talentId) {
        return {
          success: false,
          error: "Missing startup/founder mapping for this opportunity.",
        };
      }

      setSubmittingInterest(true);
      try {
        const response = await request("/interests/send", {
          method: "POST",
          body: JSON.stringify({
            talentId,
            founderId,
            startupId,
            message: String(message || "").trim(),
          }),
        });

        const interestRow =
          response?.data && typeof response.data === "object"
            ? response.data
            : {
                id: `${startupId}-${Date.now()}`,
                talentId,
                founderId,
                startupId,
                message: String(message || ""),
                status: "pending",
                createdAt: new Date().toISOString(),
              };

        setRawData((prev) => ({
          ...prev,
          sentInterests: [interestRow, ...prev.sentInterests],
        }));

        appendLocalInterest(talentId, {
          ...interestRow,
          sentById: talentId,
          sentAt: new Date().toISOString(),
        });

        return { success: true, interest: interestRow };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Could not send interest.",
        };
      } finally {
        setSubmittingInterest(false);
      }
    },
    [talentId],
  );

  return {
    loading,
    error,
    savingIds,
    submittingInterest,
    viewModel,
    refresh: loadData,
    toggleSaved,
    sendInterest,
  };
}
