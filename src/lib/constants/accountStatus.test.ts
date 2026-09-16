import { describe, expect, it } from "vitest";
import {
  ROSTER_MARKER,
  accountStatus,
  canWork,
  rosterMarker,
} from "./accountStatus";

/**
 * The account-state vocabulary a teacher sees on their class roster.
 *
 * These are assertions about a claim made about a real child, so they guard the
 * two ways this goes wrong: saying a child is switched off when we do not
 * actually know, and saying more than design ruled a teacher may be told.
 *
 * The ruling is eight words: "No consent, no reason, just whether the child is
 * active." The copy tests below are that sentence, enforced.
 */

describe("narrowing an unvalidated wire value", () => {
  it("reads the three values the spec declares", () => {
    expect(accountStatus("active")).toBe("active");
    expect(accountStatus("invited")).toBe("invited");
    expect(accountStatus("deactivated")).toBe("deactivated");
  });

  it("never calls an unrecognised value deactivated", () => {
    // The direction that matters. Telling a teacher a child has been switched
    // off, on the strength of a value we did not recognise, is a claim about a
    // real child that nothing supports. Admin's copy of this rule guards a
    // permanent erase path; the stake here is smaller, the direction is the
    // same.
    for (const raw of ["", "  ", "pending", "suspended", "ACTIVE_PENDING", "unknown"]) {
      expect(accountStatus(raw)).not.toBe("deactivated");
      expect(accountStatus(raw)).toBe("invited");
    }
  });

  it("survives null and undefined, which the row may hold before a read lands", () => {
    expect(accountStatus(null)).toBe("invited");
    expect(accountStatus(undefined)).toBe("invited");
  });

  it("is case-insensitive, because the wire is not ours to trust", () => {
    expect(accountStatus("Active")).toBe("active");
    expect(accountStatus("DEACTIVATED")).toBe("deactivated");
  });

  it("keeps invited and deactivated apart", () => {
    // Folding them together describes a child who has simply not started as one
    // who has been switched off. Admin shipped that bug once already.
    expect(accountStatus("invited")).not.toBe(accountStatus("deactivated"));
    expect(ROSTER_MARKER.invited).not.toBe(ROSTER_MARKER.deactivated);
  });
});

describe("what the roster marks", () => {
  it("says nothing at all for an active child", () => {
    // A marker on every row is decoration, not an indicator. The teacher is
    // looking for the exception.
    expect(ROSTER_MARKER.active).toBeNull();
    expect(rosterMarker("active")).toBeNull();
  });

  it("marks the two states that are not active", () => {
    expect(rosterMarker("invited")).toBe("Invited");
    expect(rosterMarker("deactivated")).toBe("Deactivated");
  });

  it("uses the words the admin console already uses", () => {
    // One fact about one child should not have two vocabularies depending on
    // who is looking.
    expect(rosterMarker("deactivated")).toBe("Deactivated");
    expect(rosterMarker("invited")).toBe("Invited");
  });
});

describe("what the copy may not say", () => {
  const strings = Object.values(ROSTER_MARKER).filter(Boolean) as string[];

  it("never mentions consent", () => {
    // The ruling withheld this from teachers deliberately. The consent payload
    // IS on this response, so the omission has to be enforced, not assumed.
    for (const s of strings) {
      expect(s).not.toMatch(/consent|permission|parent|guardian/i);
    }
  });

  it("gives no reason", () => {
    // "No reason" is half the ruling. No cause, no blame, no instruction.
    for (const s of strings) {
      expect(s).not.toMatch(/because|due to|unpaid|expired|removed by|suspend/i);
    }
  });

  it("does not tell a teacher to fix something only an admin can", () => {
    // `deactivate` and `restore` are both tagged "school administration". A
    // marker that reads like a call to action points the teacher at a door
    // they cannot open.
    for (const s of strings) {
      expect(s).not.toMatch(/restore|reactivate|contact|ask your|email|click|tap/i);
    }
  });

  it("carries no em dash, per the design system", () => {
    for (const s of strings) expect(s).not.toMatch(/—/);
  });

  it("stays short enough to sit in a roster row", () => {
    for (const s of strings) expect(s.length).toBeLessThanOrEqual(14);
  });
});

describe("canWork", () => {
  it("is true only for an active account", () => {
    expect(canWork("active")).toBe(true);
    expect(canWork("invited")).toBe(false);
    expect(canWork("deactivated")).toBe(false);
  });

  it("is false for anything unrecognised", () => {
    expect(canWork("who knows")).toBe(false);
    expect(canWork(null)).toBe(false);
  });
});
