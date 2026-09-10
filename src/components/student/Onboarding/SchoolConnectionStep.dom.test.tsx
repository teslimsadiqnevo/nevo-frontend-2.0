import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SchoolConnectionStep } from "./SchoolConnectionStep";
import { SCHOOL_CODE_MAX, normaliseCode } from "./CodeInput";
import {
  clearOnboardingDraft,
  getOnboardingDraft,
} from "@/lib/auth/onboarding";

/**
 * This screen was the wall.
 *
 * It rendered four single-character boxes behind a fixed `NEVO–` prefix and
 * posted `NEVO-${entered}`, so the only codes it could express were four
 * characters behind a prefix nobody uses. Real ones are neither: `751A1136`
 * from our own E2E tenant, `BGA-4827` in another shape again. `SchoolCodeRequest`
 * is an exact 2-50 character lookup, so no server-side normalisation could
 * rescue a code we had reshaped on the way out - and Continue was gated on a
 * success that could therefore never arrive.
 *
 * Every entrance to the product funnels through here, which made this the
 * difference between "no child can use Nevo" and "a child can". The tests are
 * written against real measured codes rather than a shape we invented, and the
 * first one is the one that matters.
 */

const { verifySchoolCode, push } = vi.hoisted(() => ({
  verifySchoolCode: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
}));
vi.mock("@/lib/api/auth", () => ({ authApi: { verifySchoolCode } }));
vi.mock("@/hooks", () => ({ useSignals: () => ({ trackEvent: vi.fn() }) }));

const school = {
  schoolId: "school-1",
  schoolName: "St Mary's Primary",
  authMethod: "pin",
  classes: [{ id: "class-a", name: "Year 4 Falcons", yearGroup: "4" }],
};

const type = (code: string) =>
  fireEvent.change(screen.getByLabelText("School code"), {
    target: { value: code },
  });

beforeEach(() => {
  vi.clearAllMocks();
  clearOnboardingDraft();
});

afterEach(() => {
  cleanup();
  clearOnboardingDraft();
});

describe("SchoolConnectionStep", () => {
  it("sends a real eight-character code exactly as typed", async () => {
    // `751A1136` is our E2E tenant's actual code. Under the old screen it could
    // not be entered at all, and would have gone out as `NEVO-751A` if it had.
    verifySchoolCode.mockResolvedValue(school);
    render(<SchoolConnectionStep />);

    type("751A1136");
    fireEvent.click(screen.getByRole("button", { name: /check my code/i }));

    await waitFor(() => expect(verifySchoolCode).toHaveBeenCalled());
    expect(verifySchoolCode).toHaveBeenCalledWith("751A1136");
  });

  it("keeps the hyphen in a code that has one", async () => {
    verifySchoolCode.mockResolvedValue(school);
    render(<SchoolConnectionStep />);

    type("BGA-4827");
    fireEvent.click(screen.getByRole("button", { name: /check my code/i }));

    await waitFor(() => expect(verifySchoolCode).toHaveBeenCalled());
    expect(verifySchoolCode).toHaveBeenCalledWith("BGA-4827");
  });

  it("never invents a prefix", async () => {
    verifySchoolCode.mockResolvedValue(school);
    render(<SchoolConnectionStep />);

    type("ABCD");
    fireEvent.click(screen.getByRole("button", { name: /check my code/i }));

    await waitFor(() => expect(verifySchoolCode).toHaveBeenCalled());
    expect(verifySchoolCode).toHaveBeenCalledWith("ABCD");
    expect(verifySchoolCode).not.toHaveBeenCalledWith("NEVO-ABCD");
  });

  it("remembers what the school answered, so the next step has a roster", async () => {
    verifySchoolCode.mockResolvedValue(school);
    render(<SchoolConnectionStep />);

    type("751A1136");
    fireEvent.click(screen.getByRole("button", { name: /check my code/i }));

    await waitFor(() =>
      expect(getOnboardingDraft().schoolCode).toBe("751A1136"),
    );
    expect(getOnboardingDraft().schoolName).toBe("St Mary's Primary");
    expect(getOnboardingDraft().classes).toEqual([
      { id: "class-a", name: "Year 4 Falcons" },
    ]);
  });

  it("will not check a code too short for the contract to accept", () => {
    // minLength is 2. One character is not a code, and asking the server about
    // it would only teach a child that their half-typed code is wrong.
    render(<SchoolConnectionStep />);

    type("7");

    expect(
      screen.getByRole("button", { name: /check my code/i }),
    ).toBeDisabled();
    expect(verifySchoolCode).not.toHaveBeenCalled();
  });

  it("tells a child their code did not match, without blaming them for our failure", async () => {
    verifySchoolCode.mockRejectedValue(
      Object.assign(new Error("not found"), { status: 404 }),
    );
    render(<SchoolConnectionStep />);

    type("751A1136");
    fireEvent.click(screen.getByRole("button", { name: /check my code/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/couldn.t check that just now|doesn.t match/i),
      ).toBeTruthy(),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("only offers Continue once a school has actually answered", async () => {
    verifySchoolCode.mockResolvedValue(school);
    render(<SchoolConnectionStep />);

    type("751A1136");
    expect(screen.queryByRole("button", { name: /^continue$/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /check my code/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^continue$/i })).toBeTruthy(),
    );
  });
});

describe("normaliseCode", () => {
  it("uppercases, and keeps only what a code can contain", () => {
    expect(normaliseCode("751a1136", SCHOOL_CODE_MAX)).toBe("751A1136");
    expect(normaliseCode("bga-4827", SCHOOL_CODE_MAX)).toBe("BGA-4827");
    expect(normaliseCode("75 1a/11.36", SCHOOL_CODE_MAX)).toBe("751A1136");
  });

  it("stops at the contract's ceiling", () => {
    expect(normaliseCode("A".repeat(80), SCHOOL_CODE_MAX)).toHaveLength(50);
  });
});
