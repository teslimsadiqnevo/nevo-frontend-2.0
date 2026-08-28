/**
 * Role & permission-scope definitions.
 *
 * Authoritative source: Product Architecture A.2 ("Role-based permission
 * system"). Every account holds one or more roles; one person can hold multiple.
 * These are the seven defined scopes surfaced by the admin ScopeSelector
 * (FE Architecture Section 1). The string values mirror the deployed
 * backend's PermissionScope enum verbatim (openapi 2.0.0) so
 * /api/v1/permissions/me responses need no mapping.
 *
 * Route-guard mapping (FE Architecture Section 2):
 *   /admin/senco/*          → SENCO
 *   /admin/settings/sso     → IT
 *   /admin/settings/billing → BILLING
 *   /admin/*                → any admin scope, then per-page scope checks
 *
 * Parent/Guardian is a distinct minimal account tier (D.7b), NOT one of these
 * scopes — modeled separately when parent accounts are built.
 */
export const PERMISSION_SCOPES = {
  /** Subscription, invoices, scope adjustment (D.11). */
  BILLING: "billing",
  /** Roster / enrollment management (D.6, D.7). */
  ROSTER: "roster",
  /** Curriculum / lesson content. */
  CURRICULUM: "curriculum",
  /** SENCo / Learning Support — includes the IEP exporter (D.8). */
  SENCO: "senco",
  /** IT / SSO configuration (D.10). */
  IT: "it_sso",
  /** General oversight — school-wide dashboards & reports. */
  GENERAL_OVERSIGHT: "oversight",
  /** Teacher access (Teacher Console). */
  TEACHER: "teacher",
} as const;

export type PermissionScope =
  (typeof PERMISSION_SCOPES)[keyof typeof PERMISSION_SCOPES];

export const ALL_PERMISSION_SCOPES = Object.values(
  PERMISSION_SCOPES,
) as PermissionScope[];

/**
 * Top-level user roles / application contexts (Product Architecture A.1–A.2).
 * Drives root-page redirect and route-group guards (FE Architecture Section 2).
 */
export const USER_ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  /**
   * There is no plain "admin". The backend splits it, and a signed-in
   * proprietor really does come back as `senco_admin` - confirmed against a
   * live account on 28 Aug 2026, not inferred from the schema.
   */
  SENCO_ADMIN: "senco_admin",
  OTHER_ADMIN: "other_admin",
  PARENT_GUARDIAN: "parent_guardian",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Both admin roles, and the only safe way to ask "is this an admin?" - a
 * `role === "admin"` check would never match anything the API returns.
 */
export function isAdminRole(role: string | undefined | null): boolean {
  return role === USER_ROLES.SENCO_ADMIN || role === USER_ROLES.OTHER_ADMIN;
}
