import { describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { isActive, isInvited, StatusPill } from "./status";

/**
 * D6's status vocabulary, against the real `UserStatus` enum.
 *
 * The bug this file exists to hold shut: `isInvited` used to be
 * `status !== "active"`, so a DEACTIVATED teacher - one whose access an admin
 * had just revoked through `POST /teachers/{id}/revoke` - was labelled
 * "Invited". The admin was told an invitation was outstanding for someone they
 * had just removed, on the screen whose whole job is to say who can get in.
 *
 * It is reachable, not theoretical: `GET /teachers` takes only `search`, with
 * no include-inactive filter, so a revoked teacher returns in the ordinary list.
 */

describe("isInvited", () => {
  it("is true only for an actual invitation", () => {
    expect(isInvited("invited")).toBe(true);
  });

  it("is false for a deactivated teacher - the bug", () => {
    // The whole point. `!== "active"` returns true here and lies to the admin.
    expect(isInvited("deactivated")).toBe(false);
  });

  it("is false for an active teacher", () => {
    expect(isInvited("active")).toBe(false);
  });
});

describe("isActive", () => {
  it("does not treat a revoked account as able to sign in", () => {
    expect(isActive("active")).toBe(true);
    expect(isActive("invited")).toBe(false);
    expect(isActive("deactivated")).toBe(false);
  });
});

describe("StatusPill", () => {
  it("labels each of the three states distinctly", () => {
    // Three renders, three cleanups - RTL keeps mounting into the same body.
    render(<StatusPill status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    cleanup();

    render(<StatusPill status="invited" />);
    expect(screen.getByText("Invited")).toBeInTheDocument();
    cleanup();

    render(<StatusPill status="deactivated" />);
    expect(screen.getByText("Deactivated")).toBeInTheDocument();
  });

  it("never says Invited for a deactivated teacher", () => {
    render(<StatusPill status="deactivated" />);
    expect(screen.queryByText("Invited")).not.toBeInTheDocument();
  });

  it("carries no alarm colour on any state - the admin set has no red or green", () => {
    for (const status of ["active", "invited", "deactivated"] as const) {
      render(<StatusPill status={status} />);
      const cls = screen.getByText(/Active|Invited|Deactivated/).className;
      expect(cls).not.toMatch(/red|green|danger|destructive/i);
      cleanup();
    }
  });
});
