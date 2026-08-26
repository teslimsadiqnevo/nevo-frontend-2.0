/**
 * Teacher profile and settings (C11). The email is school-managed and read
 * only; everything else the teacher owns.
 *
 * TODO(api): profile comes from the session payload and settings persist
 * server-side once those endpoints exist. Today they hold for the session,
 * which is exactly what the frame documents.
 */

export interface TeacherProfile {
  initials: string;
  name: string;
  subjects: string;
  school: string;
  email: string;
}

export const TEACHER_PROFILE: TeacherProfile = {
  initials: "MA",
  name: "Adunni Adeyemi",
  subjects: "Mathematics & English",
  school: "Corona Secondary School",
  email: "a.adeyemi@coronaschools.edu.ng",
};

export interface SettingRow {
  id: string;
  label: string;
  sub: string;
}

export const NOTIFICATION_SETTINGS: SettingRow[] = [
  {
    id: "sudden",
    label: "Something changed suddenly",
    sub: "A student's pattern shifts noticeably",
  },
  {
    id: "messages",
    label: "Messages from students",
    sub: "New replies in your threads",
  },
  {
    id: "weekly",
    label: "Weekly summary",
    sub: "A calm Monday overview of each class",
  },
];

export const ACCESSIBILITY_SETTINGS: SettingRow[] = [
  {
    id: "reduceMotion",
    label: "Reduce motion",
    sub: "Calm the small animations across Nevo",
  },
  {
    id: "largerText",
    label: "Larger text",
    sub: "Increase text size across the console",
  },
];

/** Frame defaults, verbatim. */
export const DEFAULT_SETTINGS: Record<string, boolean> = {
  sudden: true,
  messages: true,
  weekly: false,
  reduceMotion: true,
  largerText: false,
};
