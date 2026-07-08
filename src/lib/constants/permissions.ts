/**
 * Role & permission-scope definitions.
 *
 * Authoritative source: Product Architecture A.2 ("Role-based permission
 * system"). Every account holds one or more roles; one person can hold multiple.
 * These are the seven defined scopes surfaced by the admin ScopeSelector
 * (FE Architecture Section 1).
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
  IT: "it",
  /** General oversight — school-wide dashboards & reports. */
  GENERAL_OVERSIGHT: "general_oversight",
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
  ADMIN: "admin",
  PARENT: "parent",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
