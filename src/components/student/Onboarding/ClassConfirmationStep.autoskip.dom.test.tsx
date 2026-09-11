import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { ClassConfirmationStep } from "./ClassConfirmationStep";
import {
  clearOnboardingDraft,
  getOnboardingDraft,
  mergeOnboardingDraft,
} from "@/lib/auth/onboarding";

/**
 * A school with exactly one class lost the class on the way past.
 *
 * When the verified roster holds a single class there is nothing to choose, so
 * this screen confirms it — "You're in Year 3 Robins" — and advances after a
 * beat. But that branch only NAVIGATED. `pick()` was the sole writer of
 * `classId`, and auto-skip never calls it, so the draft reached the end of
 * onboarding with no class in it.
 *
 * Onboarding finishes at `connectClassCode`, which needs `classCode`, or
 * `classId` together with `schoolCode`. With neither the server answers 422
 * "classCode or classId with schoolCode is required" — and the child is told
 * their PIN did not save, on the very last screen, having done nothing wrong.
 *
 * A single-class school is not an edge case. It is most small schools, and it
 * is the shape of every test tenant, which is how this reached the deployed
 * site.
 *
 * These assert on the DRAFT rather than the screen, because the screen was
 * always right — it said the correct class name the whole time.
 */

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
}));

const VERIFIED = { schoolCode: "751A1136", schoolName: "St Mary's Primary" };
const ONE_CLASS = [{ id: "class-robins", name: "Year 3 Robins" }];

beforeEach(() => {
  push.mockReset();
  clearOnboardingDraft();
});

afterEach(() => {
  cleanup();
  clearOnboardingDraft();
});

describe("ClassConfirmationStep — a school with one class", () => {
  it("records the class it just told the child they are in", async () => {
    mergeOnboardingDraft({ ...VERIFIED, classes: ONE_CLASS });
    render(<ClassConfirmationStep />);

    await waitFor(() =>
      expect(getOnboardingDraft().classId).toBe("class-robins"),
    );
  });

  it("records the name alongside it", async () => {
    mergeOnboardingDraft({ ...VERIFIED, classes: ONE_CLASS });
    render(<ClassConfirmationStep />);

    await waitFor(() =>
      expect(getOnboardingDraft().className).toBe("Year 3 Robins"),
    );
  });

  it("leaves the draft able to join a class", async () => {
    // The exact precondition `connectClassCode` checks: `classCode`, or
    // `classId` with `schoolCode`. This is the assertion that would have
    // caught the 422 before it reached a real school.
    mergeOnboardingDraft({ ...VERIFIED, classes: ONE_CLASS });
    render(<ClassConfirmationStep />);

    await waitFor(() => {
      const d = getOnboardingDraft();
      expect(Boolean(d.classCode || (d.classId && d.schoolCode))).toBe(true);
    });
  });

  it("still shows the child which class they are in", async () => {
    mergeOnboardingDraft({ ...VERIFIED, classes: ONE_CLASS });
    render(<ClassConfirmationStep />);

    expect(await screen.findByText(/Year 3 Robins/)).toBeVisible();
  });

  it("does not invent a class for a verified school with an empty roster", async () => {
    // The neighbouring defect: auto-skip must not fire on the demo list. An
    // empty verified roster means the school really has no classes, and
    // recording a fictional one would be worse than recording none.
    mergeOnboardingDraft({ ...VERIFIED, classes: [] });
    render(<ClassConfirmationStep />);

    await new Promise((r) => setTimeout(r, 50));
    expect(getOnboardingDraft().classId).toBeUndefined();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not record a class when the school was never verified", async () => {
    // No school code means the list on screen is the demo one. It must never
    // reach the draft.
    render(<ClassConfirmationStep />);

    await new Promise((r) => setTimeout(r, 50));
    expect(getOnboardingDraft().classId).toBeUndefined();
  });
});
