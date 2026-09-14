import { describe, expect, it } from "vitest";
import type { ConsentStatus } from "@/lib/api/consents";
import { consentNote, parentConsentLine } from "./deliveryCopy";

/**
 * Reporting where a parent's consent has got to, without inventing anything.
 *
 * Both invite flows once told an admin a consent request had been sent, on the
 * strength of the contact they had just typed. The state is genuinely readable
 * now — `InvitationResponse.consentStatus` — so these pin the three ways the
 * new copy could still be wrong:
 *
 * 1. An absent record is NOT `not_sent`. Older invitations predate the field,
 *    and "we weren't told" must never render as "nobody has been asked".
 * 2. No sentence may offer to SEND a request. Nothing can: consent needs a
 *    student uuid that does not exist until the invite is accepted, and a
 *    `ParentLink` that an invite's bare contact cannot produce.
 * 3. No sentence may claim a consequence for the child. SCRUM-80: the school
 *    warrants consent through the DSA and the learner proceeds.
 */

const ALL: ConsentStatus[] = ["not_sent", "pending", "confirmed", "withdrawn"];

describe("consentNote", () => {
  it("names each of the four states", () => {
    expect(ALL.map((s) => consentNote(s))).toEqual([
      "No consent request sent",
      "Parent asked · no reply yet",
      "Parent consent recorded",
      "Parent withdrew consent",
    ]);
  });

  it("says nothing at all when the invite carried no consent record", () => {
    // Not "No consent request sent" - that is a claim we were never given.
    expect(consentNote(null)).toBeNull();
  });
});

describe("parentConsentLine", () => {
  const line = (s: ConsentStatus | null) =>
    parentConsentLine("mrs.eze@example.com", "Amara", s);

  it("reports each state without promising an action", () => {
    expect(line("not_sent")).toMatch(/No consent request has been sent/);
    expect(line("pending")).toMatch(/gone to them, and they haven/);
    expect(line("confirmed")).toMatch(/consent is already recorded/);
    expect(line("withdrawn")).toMatch(/withdrawn consent/);
  });

  it("never offers to send one, in any state", () => {
    // THE LOAD-BEARING TEST. D07's row action would answer "there's nobody to
    // send this to" for exactly the students these flows create, so an offer
    // here is a promise the next screen refuses.
    for (const s of [...ALL, null]) {
      const text = line(s);
      expect(text, String(s)).not.toMatch(/send (a |the )?(request|one)/i);
      expect(text, String(s)).not.toMatch(/you can (send|request|ask)/i);
      expect(text, String(s)).not.toMatch(/from .*record/i);
    }
  });

  it("never claims the child is held up, in any state", () => {
    for (const s of [...ALL, null]) {
      const text = line(s);
      expect(text, String(s)).not.toMatch(/can'?t begin|cannot begin|blocked|until consent/i);
    }
  });

  it("no longer claims that confirming creates the parent account", () => {
    // It did once. `POST /consents/parent/{token}/account` was removed on
    // 11 Sep; a parent signs in with a code now.
    for (const s of [...ALL, null]) {
      expect(line(s), String(s)).not.toMatch(/creates the parent account/i);
      expect(line(s), String(s)).not.toMatch(/password/i);
    }
  });

  it("falls back to a no-claim sentence when the state is unknown", () => {
    const text = line(null);
    expect(text).toMatch(/still needs to record consent for Amara/);
    // And says nothing about whether anyone has been contacted.
    // Split into WORDS rather than matching a substring: "consent"
    // contains "sent". A word-boundary escape here was silently written
    // as a literal backspace byte once, which made this pass vacuously.
    const words = text.toLowerCase().split(/[^a-z]+/);
    expect(words).not.toContain("sent");
    expect(words).not.toContain("asked");
    expect(words).not.toContain("replied");
  });

  it("names the contact in every state, because that is the one certain fact", () => {
    for (const s of [...ALL, null]) {
      expect(line(s), String(s)).toMatch(/mrs\.eze@example\.com is recorded as the parent contact\./);
    }
  });

  it("stands in for a missing student name rather than printing null", () => {
    expect(parentConsentLine("07700 900000", null, "not_sent")).toMatch(
      /07700 900000 is recorded/,
    );
    expect(parentConsentLine("07700 900000", null, null)).toMatch(
      /record consent for this student/,
    );
  });
});
