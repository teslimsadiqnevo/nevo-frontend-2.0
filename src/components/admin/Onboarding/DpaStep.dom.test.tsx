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
 * branch treats the pane as read on mount — which is the state these tests
 * need. It runs in a `setTimeout(0)`, though, so every test here waits for
 * Continue to be ENABLED rather than merely present. Waiting only for the
 * element passed in isolation and failed under a loaded suite, because the
 * click landed on a still-disabled button and did nothing.
 */

/** Continue, once the read gate has opened. */
async function enabledContinue(getByText: (t: string) => HTMLElement) {
  const btn = () => getByText("Continue") as HTMLButtonElement;
  await waitFor(() => expect(btn().disabled).toBe(false));
  return btn();
}

// Forwards EVERY argument. An earlier version of this mock forwarded only the
// first, which made the "sends only the version" assertion below structurally
// unable to fail - a second argument was swallowed before the spy saw it.
const acceptDpa = vi.fn(async (...args: unknown[]) => {
  void args;
  return {
    id: "a1",
    schoolId: "s1",
    version: "0.9-draft",
    acceptedByUserId: "u1",
    acceptedByName: "Mrs. Adebayo",
    acceptedAt: "2026-09-08T09:00:00Z",
  };
});
vi.mock("@/lib/api/school", () => ({
  schoolApi: { acceptDpa: (...args: unknown[]) => acceptDpa(...args) },
}));

const shown = (c: HTMLElement) => (c.textContent ?? "").replace(/\u2019/g, "'");

const renderStep = () =>
  render(
    <DpaStep schoolName="Corona Secondary School" onBack={() => {}} onDone={() => {}} />,
  );

describe("DpaStep acceptance gate", () => {
  it("says why, inline, when Continue is tapped unticked", async () => {
    const { container, getByText } = renderStep();
    const go = await enabledContinue(getByText);

    expect(shown(container)).not.toMatch(/Please accept the terms/);
    go.click();

    await waitFor(() =>
      expect(shown(container)).toMatch(
        /Please accept the agreement to continue/,
      ),
    );
    // Inline only - the ruling was explicit that this is not a modal.
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("clears the message once the box is ticked", async () => {
    const { container, getByText } = renderStep();
    const go = await enabledContinue(getByText);
    go.click();
    await waitFor(() => expect(shown(container)).toMatch(/Please accept/));

    (container.querySelector('[role="checkbox"]') as HTMLElement).click();

    await waitFor(() => expect(shown(container)).not.toMatch(/Please accept/));
  });

  it("records the acceptance as a typed record, sending only the version", async () => {
    // The admin and the timestamp are stamped server-side from the session, so
    // neither is sent - and neither can drift from what actually happened.
    const { container, getByText } = renderStep();
    const go = await enabledContinue(getByText);
    (container.querySelector('[role="checkbox"]') as HTMLElement).click();
    await waitFor(() =>
      expect(shown(container)).not.toMatch(/Please accept/),
    );
    go.click();
    await waitFor(() => expect(acceptDpa).toHaveBeenCalledTimes(1));
    expect(acceptDpa.mock.calls[0]).toHaveLength(1);
  });

  it("keeps Continue shut until the agreement has been read", () => {
    // The read gate is legal, not cosmetic - this screen exists so a school
    // CAN read the agreement before agreeing. Asserted synchronously, at first
    // paint, before the "nothing to scroll" effect opens the gate.
    const { getByText } = renderStep();
    expect((getByText("Continue") as HTMLButtonElement).disabled).toBe(true);
  });
});
