import {
  ALL_PERMISSION_SCOPES,
  type PermissionScope,
} from "@/lib/constants/permissions";

/**
 * The scope vocabulary as D03 writes it, keyed to the backend enum.
 *
 * The frame is explicit that these names are load-bearing: "the same scope
 * names appear everywhere, so a person recognises them whether they're being
 * invited here or applied elsewhere". So this is the one place they are
 * written, and every admin surface reads them from here.
 *
 * Order matters too - it is the order the invite panel lists them in.
 */

export interface ScopeDescriptor {
  scope: PermissionScope;
  name: string;
  desc: string;
  /** Ticked by default in the invite panel. */
  defaultOn: boolean;
}

export const SCOPE_CATALOGUE: ScopeDescriptor[] = [
  {
    scope: "oversight",
    name: "General Oversight",
    desc: "The Overview dashboard and school-wide picture.",
    defaultOn: true,
  },
  {
    scope: "roster",
    name: "Roster",
    desc: "Classes, teachers and students.",
    defaultOn: true,
  },
  {
    scope: "curriculum",
    name: "Curriculum",
    desc: "The lesson library and uploads.",
    defaultOn: false,
  },
  {
    scope: "senco",
    name: "SENCo / Learning Support",
    desc: "Escalations, flags and the IEP Exporter.",
    defaultOn: false,
  },
  {
    scope: "it_sso",
    name: "IT / SSO",
    desc: "Sign-in provider and roster sync.",
    defaultOn: false,
  },
  {
    scope: "billing",
    name: "Billing",
    desc: "Subscription and invoices.",
    defaultOn: false,
  },
  {
    scope: "teacher",
    name: "Teacher",
    desc: "A teacher's own console, in addition to admin.",
    defaultOn: false,
  },
];

const BY_SCOPE = new Map(SCOPE_CATALOGUE.map((s) => [s.scope, s]));

export function scopeName(scope: PermissionScope): string {
  return BY_SCOPE.get(scope)?.name ?? scope;
}

/** Catalogue order, so a person's pills always read in the same sequence. */
export function orderScopes(scopes: PermissionScope[]): PermissionScope[] {
  return ALL_PERMISSION_SCOPES.filter((s) => scopes.includes(s)).sort(
    (a, b) =>
      SCOPE_CATALOGUE.findIndex((c) => c.scope === a) -
      SCOPE_CATALOGUE.findIndex((c) => c.scope === b),
  );
}

/**
 * D03: "Brightgate Academy includes five admin accounts as standard." Read as
 * a product standard rather than a per-school figure, because nothing in the
 * team response carries an allowance.
 *
 * TODO(api): a seat allowance on the team response, so this stops being a
 * constant the client asserts.
 */
export const ADMIN_SEAT_ALLOWANCE = 5;

/** "Mrs. F. Adebayo" -> "FA"; falls back to the email's first letter. */
export function initialsFor(name: string, email: string | null): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  // "Mrs." and the like carry no identity - skip an honorific if one leads.
  const useful = words.filter((w) => !/^(mr|mrs|ms|miss|dr|prof)\.?$/i.test(w));
  const parts = useful.length ? useful : words;
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email?.[0] ?? "?").toUpperCase();
}
