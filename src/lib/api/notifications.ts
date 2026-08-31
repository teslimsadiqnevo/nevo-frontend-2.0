import { api } from "./client";

/**
 * Notification endpoints.
 *
 * The list carries its own `unreadCount`, so the badge needs no second call;
 * `/unread-count` exists for surfaces that want the number without the feed.
 *
 * `type` is a bare string in the spec with no enum, so the panel maps the
 * values it recognises and falls back to a neutral mark for anything else -
 * a new server-side type must never render as a blank square.
 *
 * `navigatesTo` is a destination for the row. The C13 frame draws rows as
 * inert, so it is typed here and not yet used - flagged to design.
 */

export interface Notification {
  notificationId: string;
  recipientId: string;
  recipientRole: string;
  type: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  navigatesTo: string | null;
}

export interface NotificationFeed {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationsApi = {
  /** The feed, newest first, with the unread count attached. */
  list: () => api.get<NotificationFeed>("/api/notifications"),

  /** Just the badge number. */
  unreadCount: () =>
    api.get<{ count: number }>("/api/notifications/unread-count"),

  /** 204. No per-row affordance in the frame yet; typed for when there is. */
  markRead: (id: string) => api.post<void>(`/api/notifications/${id}/read`),

  /** 204. Backs the panel's "Mark all read". */
  markAllRead: () => api.post<void>("/api/v1/notifications/read-all"),

  /**
   * 204. Takes the row out of the feed.
   *
   * NOTE: archived rows can never be listed again. `GET /api/notifications`
   * declares no query parameters and `NotificationResponse` carries no
   * archived flag, so there is no archived VIEW to build - which is why the
   * undo below is offered inline, at the moment of archiving, rather than as
   * a place to go and find things. Raised with backend.
   */
  archive: (id: string) =>
    api.post<void>(`/api/v1/notifications/${id}/archive`),

  /** 204. Puts an archived row back; the only way to reverse an archive. */
  restore: (id: string) =>
    api.post<void>(`/api/v1/notifications/${id}/restore`),
};
