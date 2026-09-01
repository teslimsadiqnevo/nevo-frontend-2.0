import { api } from "./client";

/**
 * Notification endpoints.
 *
 * The list carries its own `unreadCount`, so the badge needs no second call;
 * `/unread-count` exists for surfaces that want the number without the feed.
 *
 * `navigatesTo` is a destination for the row. The C13 frame draws rows as
 * inert, so it is typed here and not yet used - flagged to design.
 *
 * `type` was a bare string when this file was written; the backend has since
 * enumerated it as `NotificationType`. It is still typed loosely here on
 * purpose - `(string & {})` keeps the three known values as autocomplete
 * without making a fourth one a compile error, because a new server-side type
 * must never render as a blank square.
 */

/**
 * What a notification is about. Drives the icon and the navigation target.
 *
 * All three of these are TEACHER AND STUDENT console events. None of the admin
 * events SCRUM-100 promises - a roster sync finishing, an invoice arriving, a
 * parent confirming consent, a teacher accepting an invitation - exists as a
 * type yet, which is why the admin notification surfaces are built to render
 * whatever arrives rather than to switch on a set of admin types that is not
 * there. Raised with backend.
 */
export type NotificationType =
  | "attention_summary"
  | "modality_shift"
  | "pin_reset_requested";

export interface Notification {
  notificationId: string;
  recipientId: string;
  recipientRole: string;
  type: NotificationType | (string & {});
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  navigatesTo: string | null;
  /** Archived rows are excluded from the default view, never deleted. */
  archived: boolean;
  archivedAt: string | null;
}

export interface NotificationFeed {
  notifications: Notification[];
  unreadCount: number;
  /** Absent on older responses; treat undefined as "unknown", not zero. */
  total?: number;
  hasMore?: boolean;
}

export const notificationsApi = {
  /**
   * The feed, newest first, with the unread count attached.
   *
   * `archived: true` returns the archived view instead of the default one -
   * which makes D13b's Archived filter buildable. `limit`/`offset` back the
   * frame's "Show older" rather than numbered pages, so an admin never loses
   * their place.
   */
  list: (options: { archived?: boolean; limit?: number; offset?: number } = {}) =>
    api.get<NotificationFeed>("/api/notifications", {
      params: {
        archived: options.archived ? true : undefined,
        limit: options.limit,
        offset: options.offset,
      },
    }),

  /**
   * Whether anything is unread, as a boolean and deliberately not a number.
   *
   * SCRUM-100's first rule is "a dot, never a count": the indicator says
   * something is here, not how behind you are. Its "done when" goes further -
   * no count is rendered OR EVEN FETCHED - so the sidebar dot calls this and
   * never `unreadCount`.
   */
  unreadExists: () =>
    api.get<{ exists?: boolean } | boolean>("/api/v1/notifications/unread-exists"),

  /** Just the badge number. */
  unreadCount: () =>
    api.get<{ count: number }>("/api/notifications/unread-count"),

  /** 204. No per-row affordance in the frame yet; typed for when there is. */
  markRead: (id: string) => api.post<void>(`/api/notifications/${id}/read`),

  /** 204. Backs the panel's "Mark all read". */
  markAllRead: () => api.post<void>("/api/v1/notifications/read-all"),

  /**
   * 204. Takes the row out of the default feed without deleting it.
   *
   * This used to carry a note saying archived rows could never be listed
   * again, because the list route declared no parameters and the row carried
   * no archived flag. Backend has since added `archived` to both, so the
   * archived VIEW that D13b draws is now real and is built. The note is left
   * here in corrected form rather than deleted, so nobody re-derives the old
   * conclusion from an older memory of this file.
   */
  archive: (id: string) =>
    api.post<void>(`/api/v1/notifications/${id}/archive`),

  /** 204. Puts an archived row back; the only way to reverse an archive. */
  restore: (id: string) =>
    api.post<void>(`/api/v1/notifications/${id}/restore`),
};
