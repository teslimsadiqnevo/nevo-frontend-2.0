import { api } from "./client";

/**
 * User settings - a free-form JSON bag the backend merges on write.
 *
 * The contract names no keys at all (`settings` is an open object), so the
 * shape is ours to define and ours to keep stable. Everything the teacher
 * console persists lives under one top-level key, so that a shallow merge
 * cannot have the student app's preferences overwrite the teacher's.
 *
 * Accessibility preferences are deliberately NOT here: reduced motion and
 * larger text are properties of the device someone is sitting at, not of
 * their account, and they already apply instantly through the accessibility
 * context.
 */

export interface TeacherNotificationSettings {
  /** A student's pattern shifts noticeably. */
  sudden: boolean;
  /** New replies in the teacher's threads. */
  messages: boolean;
  /** The calm Monday overview. */
  weekly: boolean;
}

export interface SettingsBag {
  teacherNotifications?: TeacherNotificationSettings;
  [key: string]: unknown;
}

export const settingsApi = {
  get: () => api.get<{ settings: SettingsBag }>("/api/settings/me"),

  /** Merged server-side, so only the keys sent are touched. */
  update: (patch: SettingsBag) =>
    api.put<{ settings: SettingsBag }>("/api/settings/me", patch),
};
