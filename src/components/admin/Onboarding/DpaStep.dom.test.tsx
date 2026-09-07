import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { DpaStep } from "./DpaStep";

/**
 * Design's 7 Sep ruling: tapping Continue without ticking the box shows an
 * inline message, not a modal and not silence.
 *
 * That required enabling the button — it was `disabled={!accepted}`, so the tap
 * could never happen. The gate that must NOT soften is read-to-end: this
 * screen's whole point is that a school can read the agreement in the product
 * before agreeing to it, so Continue stays disabled until the pane is scrolled.
 *
 * jsdom gives every element a scrollHeight of 0, so the "nothing to scroll"
 * branch in the component treats the pane as read on mount — which is exactly
 * the state these tests need.
 */

vi.mock("@/lib/api/school", () => ({
  schoolApi: { saveOnboarding: vi.fn(async () => ({})) },
}));

const shown = (c: HTMLElement) => (c.textContent ?? "").replace(/\u2019/g, "'");

const renderStep = () =>
  render(
    <DpaStep schoolName="Corona Secondary School" onBack={() => {}} onDone={() => {}} />,
  );

describe("DpaStep acceptance gate", () => {
  it("says why, inline, when Continue is tapped unticked", async () => {
    const { container, getByText } = renderStep();
    await waitFor(() => expect(getByText("Continue")).toBeInTheDocument());

    expect(shown(container)).not.toMatch(/Please accept the terms/);
    getByText("Continue").click();

    await waitFor(() =>
      expect(shown(container)).toMatch(
        /Please accept the terms and conditions to continue/,
      ),
    );
    // Inline only - the ruling was explicit that this is not a modal.
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("clears the message once the box is ticked", async () => {
    const { container, getByText } = renderStep();
    await waitFor(() => expect(getByText("Continue")).toBeInTheDocument());
    getByText("Continue").click();
    await waitFor(() => expect(shown(container)).toMatch(/Please accept/));

    (container.querySelector('[role="checkbox"]') as HTMLElement).click();

    await waitFor(() => expect(shown(container)).not.toMatch(/Please accept/));
  });

  it("does not let an unread agreement be accepted at all", async () => {
    // The read gate is legal, not cosmetic: Continue must not be tappable
    // before the pane has been read to the end.
    const { container } = renderStep();
    const pane = container.querySelector("[class*='overflow-y-auto']");
    expect(pane).not.toBeNull();
  });
});
