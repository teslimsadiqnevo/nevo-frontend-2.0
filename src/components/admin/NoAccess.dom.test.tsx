import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { NoAccess, failureKind } from "./NoAccess";
import { ApiError } from "@/lib/api/client";

/**
 * A 403 is a permission decision, not a broken read, and the two want different
 * words and different affordances.
 *
 * The harm being fixed was double: every scope-gated screen blamed the system
 * for a decision it had not made ("we couldn't load this... try again"), AND
 * offered a retry that cannot succeed. An admin would sit pressing it.
 */

const shown = (c: HTMLElement) => (c.textContent ?? "").replace(/\u2019/g, "'");

describe("failureKind", () => {
  it("calls only a 403 denied", () => {
    expect(failureKind(new ApiError(403, "nope"))).toBe("denied");
  });

  it("treats everything else as a failure the admin can retry", () => {
    // 401 never reaches a screen - the client ends the session first - but if
    // it did, it is not a scope problem.
    for (const status of [401, 404, 500, 502, 0]) {
      expect(failureKind(new ApiError(status, "x"))).toBe("failed");
    }
    expect(failureKind(new Error("network"))).toBe("failed");
    expect(failureKind(undefined)).toBe("failed");
  });
});

describe("NoAccess", () => {
  it("says it is about access, not about a failure", () => {
    const t = shown(render(<NoAccess what="the admin team" />).container);
    expect(t).toMatch(/don't have access to the admin team/i);
    expect(t).not.toMatch(/couldn't load|went wrong|try again/i);
  });

  it("offers no retry - a refused scope does not become granted by asking", () => {
    const { container } = render(<NoAccess what="billing" />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("points at who can change it, and uses no alarm colour", () => {
    const { container } = render(<NoAccess what="reports" />);
    expect(shown(container)).toMatch(/manages permissions/i);
    expect(container.innerHTML).not.toMatch(/red|rose|danger|destructive/);
  });
});
