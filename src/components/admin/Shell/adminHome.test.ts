import { describe, expect, it } from "vitest";
import type { PermissionScope } from "@/lib/constants/permissions";
import { adminHomeForScopes } from "./adminNav";

/**
 * Where an admin lands after signing in.
 *
 * Everyone used to land on the Overview, which is gated on `oversight` — so an
 * IT contractor or a finance administrator met a refusal as their first sight
 * of Nevo. These pin that each persona now lands somewhere they can actually
 * open.
 */
const scopes = (...s: string[]) => s as PermissionScope[];

describe("adminHomeForScopes", () => {
  it("sends an oversight admin to the Overview", () => {
    expect(adminHomeForScopes(scopes("oversight", "roster"))).toBe("/admin/dashboard");
  });

  it("prefers the Overview when someone holds oversight AND another scope", () => {
    // A proprietor who also holds billing wants the school, not the invoices.
    expect(adminHomeForScopes(scopes("billing", "oversight"))).toBe("/admin/dashboard");
  });

  it("sends an IT-only admin to their own home, not to a refusal", () => {
    expect(adminHomeForScopes(scopes("it_sso"))).toBe("/admin/sso/home");
  });

  it("sends a billing-only admin to their own home", () => {
    expect(adminHomeForScopes(scopes("billing"))).toBe("/admin/billing/home");
  });

  it("falls back to whatever their rail offers first", () => {
    // Never a screen they cannot open.
    const home = adminHomeForScopes(scopes("roster"));
    expect(home).not.toBe("/admin/dashboard");
    expect(home.startsWith("/admin/")).toBe(true);
  });

  it("has somewhere to send an admin holding no scopes at all", () => {
    expect(adminHomeForScopes(scopes())).toMatch(/^\/admin\//);
  });
});
