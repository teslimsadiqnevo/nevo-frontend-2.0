/**
 * Teacher console navigation model (flow index; `Nevo Teacher Sidebar`).
 * Five tabs, in the frame's order; hrefs map onto the scaffolded routes.
 */

export interface TeacherNavItem {
  /** Frame label - also the sidebar `active` key. */
  name: "Home" | "Classes" | "Library" | "Insights" | "Connect";
  href: string;
}

export const TEACHER_NAV: TeacherNavItem[] = [
  { name: "Home", href: "/teacher/dashboard" },
  { name: "Classes", href: "/teacher/classes" },
  { name: "Library", href: "/teacher/lessons" },
  { name: "Insights", href: "/teacher/insights" },
  { name: "Connect", href: "/teacher/connect" },
];

/** The C-screen docs' teacher persona. TODO(api): from the session once the
 *  backend exposes the teacher profile. */
export const MOCK_TEACHER = {
  name: "Ms. Adeyemi",
  role: "Teacher",
  initials: "MA",
};
