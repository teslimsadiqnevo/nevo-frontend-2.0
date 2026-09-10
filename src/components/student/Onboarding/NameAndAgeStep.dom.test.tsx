import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NameAndAgeStep } from "./NameAndAgeStep";
import {
  clearOnboardingDraft,
  mergeOnboardingDraft,
} from "@/lib/auth/onboarding";

/**
 * A child can reach this screen having already answered it.
 *
 * The class step's empty-roster dead end routes back to Teacher Join, which
 * resumes at this screen - so a child who gave their name two screens ago was
 * asked for it again with the box blank, as though nothing they had done had
 * counted. For a child who finds typing effortful that is not a small thing.
 */

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  clearOnboardingDraft();
});

afterEach(() => {
  cleanup();
  clearOnboardingDraft();
});

describe("NameAndAgeStep", () => {
  it("remembers what a child already told us", () => {
    mergeOnboardingDraft({ name: "Amara", age: 9 });

    render(<NameAndAgeStep />);

    expect(screen.getByLabelText("Your name")).toHaveValue("Amara");
  });

  it("starts empty for a child arriving for the first time", () => {
    render(<NameAndAgeStep />);

    expect(screen.getByLabelText("Your name")).toHaveValue("");
  });

  it("does not blank a name that is already there", () => {
    // An effect-based prefill would clear the field for a frame, and fight
    // anything typed before it ran.
    mergeOnboardingDraft({ name: "Amara", age: 9 });
    render(<NameAndAgeStep />);

    const field = screen.getByLabelText("Your name");
    fireEvent.change(field, { target: { value: "Amara Kalu" } });

    expect(field).toHaveValue("Amara Kalu");
  });
});
