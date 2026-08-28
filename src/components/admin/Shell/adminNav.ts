import type { PermissionScope } from "@/lib/constants/permissions";

/**
 * School Admin navigation model (`Nevo Admin Sidebar`).
 *
 * Eleven items in four groups, in the frame's own order. The group headings
 * show while the rail is expanded; collapsed, a hairline divider stands in for
 * each one.
 *
 * SCOPE FILTERING (Product Arch D.3, "dynamic navigation per scopes held").
 * D03 Admin Team names seven scopes and says what each one grants, and they map
 * 1:1 onto the backend's `PermissionScope` enum:
 *
 *   oversight   "The Overview dashboard and school-wide picture."
 *   roster      "Classes, teachers and students."
 *   curriculum  "The lesson library and uploads."
 *   senco       "Escalations, flags and the IEP Exporter."
 *   it_sso      "Sign-in provider and roster sync."
 *   billing     "Subscription and invoices."
 *   teacher     "A teacher's own console, in addition to admin."
 *
 * Five items map straight out of those sentences. Four are not covered by the
 * catalogue and are marked `inferred` below - a guess, made once, in one place,
 * and flagged to design rather than scattered through the screens.
 */

export interface AdminNavItem {
  label: string;
  href: string;
  /** "" for the ungrouped first item. */
  group: "" | "School" | "Support" | "Administration";
  /** Null means every admin sees it, whatever they hold. */
  scope: PermissionScope | null;
  /** True where D03's catalogue does not settle it - see the docblock. */
  inferred?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Overview", href: "/admin/dashboard", group: "", scope: "oversight" },
  { label: "Classes", href: "/admin/classes", group: "School", scope: "roster" },
  { label: "Teachers", href: "/admin/teachers", group: "School", scope: "roster" },
  { label: "Students", href: "/admin/students", group: "School", scope: "roster" },
  // Invitations create teachers and students, which is what `roster` grants.
  { label: "Invitations", href: "/admin/invitations", group: "School", scope: "roster", inferred: true },
  { label: "Learning Support", href: "/admin/senco", group: "Support", scope: "senco" },
  // Reports are the school-wide picture, which is `oversight`'s own wording.
  { label: "Reports", href: "/admin/reports", group: "Support", scope: "oversight", inferred: true },
  // Administering other admins is school-wide administration; no scope names it.
  { label: "Admin Team", href: "/admin/team", group: "Administration", scope: "oversight", inferred: true },
  { label: "Billing", href: "/admin/billing", group: "Administration", scope: "billing" },
  { label: "IT & SSO", href: "/admin/sso", group: "Administration", scope: "it_sso" },
  // D12c is "Settings - Your Account": everyone has an account to manage.
  { label: "Settings", href: "/admin/settings", group: "Administration", scope: null, inferred: true },
];

/** The nav an admin holding these scopes actually sees. */
export function navForScopes(scopes: PermissionScope[]): AdminNavItem[] {
  return ADMIN_NAV.filter((i) => i.scope === null || scopes.includes(i.scope));
}

/**
 * The longest matching href wins, so `/admin/settings` does not light up while
 * the reader is on a deeper route that merely starts the same way.
 */
/**
 * Routes that are not nav items but belong to one. D21 and D22 are drill-downs
 * from the Overview, and their frames set the rail's active item to Overview.
 */
const OWNED_BY: Record<string, string> = {
  "/admin/compliance": "Overview",
  "/admin/adaptations": "Overview",
};

export function activeNavLabel(pathname: string): string | null {
  const owner = Object.entries(OWNED_BY).find(
    ([p]) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (owner) return owner[1];
  const hit = [...ADMIN_NAV]
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return hit?.label ?? null;
}

/**
 * The role line under the admin's name. The session gives a `user_id` and a
 * role and no name, so the job title half of the frame's "Proprietor · General
 * oversight" is not ours to write - but the scope half is real, and comes
 * straight from `permissions/me`.
 */
const SCOPE_LABELS: Record<PermissionScope, string> = {
  oversight: "General oversight",
  roster: "Roster",
  curriculum: "Curriculum",
  senco: "Learning support",
  it_sso: "IT & SSO",
  billing: "Billing",
  teacher: "Teacher",
};

export function scopeSummary(scopes: PermissionScope[]): string {
  if (scopes.length === 0) return "No access yet";
  if (scopes.length === 1) return SCOPE_LABELS[scopes[0]];
  if (scopes.includes("oversight")) return "General oversight";
  return `${SCOPE_LABELS[scopes[0]]} +${scopes.length - 1}`;
}
