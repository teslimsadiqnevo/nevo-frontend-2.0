import { api } from "./client";

/**
 * Notification endpoints (FE Architecture §1). Backs the `useNotifications` hook
 * and `NotificationContext`.
 *
 * TODO: type the notification shape per role (Student B.13 / Teacher C.13 /
 * Admin D.13).
 */
export const notificationsApi = {
  list: () => api.get("/api/notifications"),
  unreadCount: () => api.get<{ count: number }>("/api/notifications/unread-count"),
  markRead: (id: string) => api.post(`/api/notifications/${id}/read`),
};
