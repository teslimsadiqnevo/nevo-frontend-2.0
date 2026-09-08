import { describe, expect, it } from "vitest";
import type { Invitation } from "@/lib/api/invites";
import { inviteeName, joinLink, joinLinkBlock } from "./joinLink";

const invite = (over: Partial<Invitation> = {}): Invitation => ({
  id: "inv1",
  token: "tok1",
  role: "teacher",
  email: "adeyemi.f@school.edu.ng",
  name: "Folake Adeyemi",
  status: "pending",
  expiresAt: "2026-10-01T00:00:00Z",
  deliveryStatus: "email_not_configured",
  ...over,
});

describe("joinLink", () => {
  it("builds the address an invited person opens", () => {
    expect(joinLink("tok1")).toBe(`${window.location.origin}/join/tok1`);
  });

  it("returns null rather than a link to nothing", () => {
    // `token` is nullable in the contract and only promised on create. A
    // button yielding `/join/null` is worse than no button.
    expect(joinLink(null)).toBeNull();
    expect(joinLink(undefined)).toBeNull();
    expect(joinLink("")).toBeNull();
  });
});

describe("inviteeName", () => {
  it("falls back through name, email, then a plain noun", () => {
    expect(inviteeName(invite())).toBe("Folake Adeyemi");
    expect(inviteeName(invite({ name: null }))).toBe("adeyemi.f@school.edu.ng");
    expect(inviteeName(invite({ name: null, email: null }))).toBe(
      "Invited person",
    );
  });
});

describe("joinLinkBlock", () => {
  it("produces one pasteable line per person", () => {
    const block = joinLinkBlock([
      invite({ id: "a", name: "Folake Adeyemi", token: "t1" }),
      invite({ id: "b", name: "Ngozi Okonkwo", token: "t2" }),
    ]);
    expect(block.split("\n")).toHaveLength(2);
    expect(block).toContain(`Folake Adeyemi: ${window.location.origin}/join/t1`);
    expect(block).toContain(`Ngozi Okonkwo: ${window.location.origin}/join/t2`);
  });

  it("leaves out rows with no token instead of writing a broken line", () => {
    const block = joinLinkBlock([
      invite({ id: "a", token: "t1" }),
      invite({ id: "b", token: null }),
    ]);
    expect(block.split("\n")).toHaveLength(1);
    expect(block).not.toContain("null");
  });
});
