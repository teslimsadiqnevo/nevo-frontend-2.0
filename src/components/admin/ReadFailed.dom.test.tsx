import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ReadFailed } from "./ReadFailed";

/**
 * The wording is the whole point of this component, so it is what is pinned.
 *
 * Five screens state a real absence in almost the same shape - "No guardian on
 * the record", "You're all caught up", "That's everything" - and an admin
 * cannot tell a real absence from a broken GET unless this says so explicitly.
 * If someone later shortens this copy to "Couldn't load", the distinction is
 * gone and the bug is back without a line of logic changing.
 */
describe("ReadFailed", () => {
  it("says the absence is unknown, not established", () => {
    const { container } = render(
      <ReadFailed what="Amara's guardians" onRetry={() => {}} />,
    );
    const shown = (container.textContent ?? "").replace(/\u2019/g, "'");

    expect(shown).toMatch(/couldn't read Amara's guardians/i);
    // The load-bearing half: without it this reads as a confirmed absence.
    expect(shown).toMatch(/not a record that it's empty/i);
  });

  it("offers a retry that calls back", async () => {
    const onRetry = vi.fn();
    const { getByRole } = render(
      <ReadFailed what="the run history" onRetry={onRetry} />,
    );
    getByRole("button", { name: /try again/i }).click();
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1));
  });
});
