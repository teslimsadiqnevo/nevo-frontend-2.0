import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ClassConfirmationStep } from "./ClassConfirmationStep";
import {
  clearOnboardingDraft,
  getOnboardingDraft,
  mergeOnboardingDraft,
} from "@/lib/auth/onboarding";

/**
 * The defect this pins: a real school that lists no classes was shown fourteen
 * invented ones.
 *
 * `classes = classesProp ?? draftClasses ?? DEMO_CLASSES`, where `classesProp`
 * was never passed by the only page that renders this, and `draftClasses` was
 * set only when verification returned a NON-EMPTY roster. So an empty roster
 * fell through to the demo list. Tapping one wrote `classId: undefined` - the
 * old `pick()` looked the id up by NAME against a roster the name was not on -
 * and three screens later `connectClassCode({ classId: undefined })` threw,
 * dropping the child back to the PIN row with nothing said to them.
 *
 * The two tests that matter are therefore about a VERIFIED school: it must
 * never be offered a fictional class, and every class it IS offered must carry
 * the id that joins it.
 */

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
}));

const VERIFIED = { schoolCode: "NEVO-7X2P", schoolName: "St Mary's Primary" };

beforeEach(() => {
  push.mockReset();
  clearOnboardingDraft();
});

afterEach(() => {
  cleanup();
  clearOnboardingDraft();
});

describe("ClassConfirmationStep", () => {
  it("offers a verified school with no classes a way in, not invented ones", async () => {
    mergeOnboardingDraft({ ...VERIFIED, classes: [] });

    render(<ClassConfirmationStep />);

    await waitFor(() =>
      expect(screen.getByText(/can.t see any classes yet/i)).toBeTruthy(),
    );
    // The demo roster must be nowhere near a real child.
    expect(screen.queryByText("Year 5 Otters")).toBeNull();
    expect(screen.queryByText("Year 6 Ravens")).toBeNull();
    // And they are not simply stuck: a class code joins without the roster.
    expect(
      screen.getByRole("button", { name: /enter a class code/i }),
    ).toBeTruthy();
  });

  it("carries the id of the class the child actually tapped", async () => {
    mergeOnboardingDraft({
      ...VERIFIED,
      classes: [
        { id: "class-a", name: "Year 4 Falcons" },
        { id: "class-b", name: "Year 5 Otters" },
      ],
    });

    render(<ClassConfirmationStep />);

    const option = await screen.findByRole("button", { name: /Year 5 Otters/ });
    option.click();

    // `Year 5 Otters` is also a DEMO_CLASSES name, so a lookup that fell back to
    // the demo list would still match by name and write no id. This asserts the
    // id, which only the real roster can supply.
    await waitFor(() => expect(getOnboardingDraft().classId).toBe("class-b"));
    expect(getOnboardingDraft().className).toBe("Year 5 Otters");
  });

  it("renders no class list on the server, where the draft cannot be read", () => {
    mergeOnboardingDraft({ ...VERIFIED, classes: [] });

    // Deliberately renderToString, not render(): Testing Library flushes
    // effects, so `render` would assert the state AFTER the draft was read and
    // could not tell this apart from the test above. The server genuinely
    // cannot see sessionStorage, so anything it decided here would be decided
    // on missing information - and would then flash at the child on hydration.
    const html = renderToString(<ClassConfirmationStep />);
    expect(html).not.toContain("Year 5 Otters");
    expect(html).not.toContain("Which class are you in?");
  });

  it("still shows the designed walkthrough when no school was ever verified", async () => {
    render(<ClassConfirmationStep />);

    // No school code in the draft means a preview or a direct link, not a real
    // child mid-onboarding - the designed list is honest there.
    await waitFor(() => expect(screen.getByText("Year 5 Otters")).toBeTruthy());
    expect(screen.queryByText(/can.t see any classes yet/i)).toBeNull();
  });
});
