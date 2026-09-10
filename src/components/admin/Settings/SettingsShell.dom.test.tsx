import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { SettingsView } from "./SettingsView";

/**
 * SCRUM-99's shell rules, which are done-when criteria rather than taste:
 *
 *   - "'Your school' and 'You' are separate stacks under separate headings,
 *     NOT TABS. An admin should never wonder whether a change affects the
 *     school or only themselves." (rule 1, repeated at D12.1)
 *   - "The school half is oversight-scoped; the personal half is visible to
 *     every admin, including one with billing alone."
 *   - D12.1 done-when: "A billing-only admin sees a coherent page with no
 *     empty school section."
 *
 * It shipped as a tablist that rendered the school half for everybody.
 */

const permissions = vi.fn();

vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return { ...actual, usePermissions: () => permissions() };
});

// The two halves do their own fetching; this suite is about the shell, so they
// are stubbed down to something identifiable.
vi.mock("./SchoolSettings", () => ({
  SchoolSettings: () => <div>SCHOOL HALF</div>,
}));
vi.mock("./AccountSettings", () => ({
  AccountSettings: () => <div>ACCOUNT HALF</div>,
}));

const scopes = (list: string[], over: Record<string, unknown> = {}) => ({
  scopes: list,
  resolved: true,
  status: "ready" as const,
  refresh: vi.fn(),
  hasScope: (s: string) => list.includes(s),
  ...over,
});

describe("SettingsView shell", () => {
  it("is two stacks under headings, not a tablist", () => {
    permissions.mockReturnValue(scopes(["oversight"]));
    const { container } = render(<SettingsView />);

    // The spec says "not tabs" twice. Nothing here may be one.
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    // Both halves are on the page at once - that is the point of the division.
    expect(visibleText(container)).toMatch(/Your school/);
    expect(visibleText(container)).toMatch(/SCHOOL HALF/);
    expect(visibleText(container)).toMatch(/ACCOUNT HALF/);
  });

  it("hides the school half entirely from an admin without oversight", () => {
    permissions.mockReturnValue(scopes(["billing"]));
    const { container } = render(<SettingsView />);

    // "absent entirely, not greyed"
    expect(visibleText(container)).not.toMatch(/SCHOOL HALF/);
    expect(visibleText(container)).not.toMatch(/Your school/);
    // ...and the page is still coherent, with no empty scaffolding above it.
    expect(visibleText(container)).toMatch(/ACCOUNT HALF/);
    expect(visibleText(container)).toMatch(/You/);
  });

  it("does not treat an unanswered scope read as a permission decision", () => {
    // `hasScope` is false before the read lands too. Gating on it alone would
    // hide a proprietor's own school settings for the length of a request.
    permissions.mockReturnValue(
      scopes(["oversight"], { resolved: false, status: "loading" }),
    );
    const { container } = render(<SettingsView />);
    expect(visibleText(container)).not.toMatch(/SCHOOL HALF/);
    // The personal half never depended on a scope, so it is always there.
    expect(visibleText(container)).toMatch(/ACCOUNT HALF/);
  });

  it("offers a retry when the scope read failed, and claims nothing", async () => {
    const refresh = vi.fn();
    permissions.mockReturnValue(
      scopes([], { resolved: false, status: "failed", refresh }),
    );
    const { container } = render(<SettingsView />);

    expect(visibleText(container)).toMatch(/couldn't check which parts/i);
    // Never "you don't have access" - that is a claim about them from a
    // broken GET, which is the defect this console has fixed fifteen times.
    expect(visibleText(container)).not.toMatch(/don't have access/i);
    screen.getByRole("button", { name: "Try again" }).click();
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("keeps the section index off the school half when it is not shown", () => {
    permissions.mockReturnValue(scopes(["billing"]));
    render(<SettingsView />);
    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    expect(nav.textContent).not.toMatch(/Your school/);
    expect(nav.textContent).toMatch(/You/);
  });
});
