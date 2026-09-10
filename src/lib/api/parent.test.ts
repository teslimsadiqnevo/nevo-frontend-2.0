import { describe, expect, it } from "vitest";
import { apiErrorCode } from "./parent";

/**
 * `apiErrorCode` exists because two different 409s come back from parent
 * account creation and they mean opposite things:
 *
 *   parent_contact_not_email -> "we cannot do this for a phone number"
 *   (anything else)          -> "you already have an account"
 *
 * Collapsing them into a single "conflict" would send an SMS-only parent off
 * to find a password they never set. So the narrowing is a named function with
 * its own tests rather than an inline cast at the call site.
 */

describe("apiErrorCode", () => {
  it("reads the code out of the body the API actually sends", () => {
    expect(
      apiErrorCode({ detail: { code: "parent_contact_not_email", message: "..." } }),
    ).toBe("parent_contact_not_email");
  });

  it("returns null when the body is some other shape", () => {
    // A bare-string detail is what several endpoints send; it must not throw
    // and must not be mistaken for a code.
    expect(apiErrorCode({ detail: "This consent link is invalid" })).toBeNull();
    expect(apiErrorCode({ code: "top_level" })).toBeNull();
    expect(apiErrorCode({ detail: {} })).toBeNull();
  });

  it("survives the values an unknown can actually hold", () => {
    expect(apiErrorCode(undefined)).toBeNull();
    expect(apiErrorCode(null)).toBeNull();
    expect(apiErrorCode("string")).toBeNull();
    expect(apiErrorCode(42)).toBeNull();
    expect(apiErrorCode({ detail: { code: 7 } })).toBeNull();
    expect(apiErrorCode({ detail: { code: "" } })).toBeNull();
  });
});
