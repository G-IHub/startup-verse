import { create } from "zustand";
import { apiGet, apiPut } from "../utils/apiClient.js";

/**
 * Notifications store.
 *
 * Powers the bell indicator in the founder layout. Uses the canonical
 * `GET /notifications?userId=X` endpoint and `PUT /notifications/:id/read`.
 * `markAllRead` fans out individual PUTs since the backend does not expose a
 * batch-read endpoint today.
 */

function normalizeNotification(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ...raw,
    id: String(raw.id || raw._id || ""),
    read: Boolean(raw.readAt || raw.read),
    title: raw.title || "Notification",
    message: raw.message || "",
    type: raw.type || "general",
    createdAt: raw.createdAt || raw.updatedAt || null,
  };
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.notifications)) return payload.notifications;
    if (Array.isArray(payload.items)) return payload.items;
  }
  return [];
}

const initialState = {
  userId: null,
  notifications: [],
  loading: false,
  error: null,
  lastLoadedAt: null,
};

export const useNotificationsStore = create((set, get) => ({
  ...initialState,

  async load(userId) {
    const id = userId || get().userId;
    if (!id) return [];

    set({ loading: true, error: null, userId: id });

    try {
      const data = await apiGet(`/notifications`, {
        params: { userId: id },
      });
      const raw = normalizePayload(data);
      const notifications = raw.map(normalizeNotification).filter(Boolean);
      set({
        notifications,
        loading: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      });
      return notifications;
    } catch (error) {
      set({ loading: false, error });
      return [];
    }
  },

  async refresh() {
    return get().load(get().userId);
  },

  async markRead(notificationId) {
    if (!notificationId) return;
    try {
      await apiPut(`/notifications/${notificationId}/read`);
    } catch {
      // swallow — UI already optimistically updates below
    }
    set({
      notifications: get().notifications.map((n) =>
        n.id === String(notificationId) ? { ...n, read: true } : n,
      ),
    });
  },

  async markAllRead() {
    const unread = get().notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
    });

    await Promise.allSettled(
      unread.map((n) => apiPut(`/notifications/${n.id}/read`)),
    );
  },

  reset() {
    set({ ...initialState });
  },
}));

export const selectUnreadCount = (state) =>
  state.notifications.filter((n) => !n.read).length;
export const selectNotifications = (state) => state.notifications;
