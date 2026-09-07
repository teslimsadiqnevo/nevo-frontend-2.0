import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";

const { exerciseRight } = vi.hoisted(() => ({
  exerciseRight: vi.fn(async () => ({ requestId: "req-1", status: "received" })),
}));

// Replaced wholesale rather than spread over `importOriginal`. Pulling the
// real module in here hangs the jsdom worker for 60s - `parent.ts` imports
// `client.ts`, which this file also imports for `ApiError`, and resolving both
// at once deadlocks. The module exports one object and a type, so there is
// nothing to preserve.
vi.mock("@/lib/api/parent", () => ({ parentApi: { exerciseRight } }));

import { ParentDataManagement } from "./ParentDataManagement";

/**
 * The parent data-rights page (SCRUM-80, D01c).
 *
 * Tested more carefully than a screen of its size would normally warrant,
 * because the thing it does is statutory. NDPA 2023 s.31 requires a parent to
 * have a direct route to review, object and withdraw; if a button here says a
 * right was exercised and no request left the browser, Nevo has told a parent
 * something untrue about their child on a page whose entire purpose is to be
 * trustworthy.
 *
 * So the assertions are mostly about the WIRE: that the right value goes out,
 * that a failure is never dressed as a success, and that withdrawal - the one
 * irreversible action - cannot happen on a single tap.
 */

const RIGHTS = "parent-token-abc";

beforeEach(() => {
  exerciseRight.mockClear();
  exerciseRight.mockResolvedValue({ requestId: "req-1", status: "received" });
});

describe("exercising a right", () => {
  it("sends request_data, the value the API actually accepts", async () => {
    // The enum is not in the spec - `requestType` is declared a bare string,
    // and these three values came from the deployed API's own error. Pinning
    // them here means a rename shows up as a failing test rather than as a
    // parent's request silently 422ing.
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /Request my child/i }));

    expect(exerciseRight).toHaveBeenCalledWith(RIGHTS, "request_data");
    expect(await screen.findByText(/within 5 working days/i)).toBeInTheDocument();
  });

  it("sends object", async () => {
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /Object to processing/i }));

    expect(exerciseRight).toHaveBeenCalledWith(RIGHTS, "object");
    expect(await screen.findByText(/within 48 hours/i)).toBeInTheDocument();
  });

  it("offers no box for an objection reason, because nothing would receive it", () => {
    // D01c draws a "Describe your concern" textarea. It is deliberately not
    // built: `ParentRightRequest` carries only `requestType`, and the API
    // accepts and IGNORES extra fields. A parent typing their concern into a
    // box that discards it - and being told it was received - is a worse
    // failure than not offering the box.
    render(<ParentDataManagement token={RIGHTS} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe("withdrawing consent", () => {
  it("cannot be done in one tap", async () => {
    // The one irreversible action on the page, and restoring access needs the
    // school. It must not be reachable by a mis-tap.
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /^Withdraw consent$/i }));

    expect(exerciseRight).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Keep active/i })).toBeInTheDocument();
  });

  it("can be backed out of, leaving nothing sent", () => {
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /^Withdraw consent$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Keep active/i }));

    expect(exerciseRight).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Keep active/i })).not.toBeInTheDocument();
  });

  it("sends withdraw_consent only after confirming", async () => {
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /^Withdraw consent$/i }));
    const confirm = screen.getAllByRole("button", { name: /Withdraw consent/i }).at(-1)!;
    fireEvent.click(confirm);

    expect(exerciseRight).toHaveBeenCalledWith(RIGHTS, "withdraw_consent");
    expect(await screen.findByText(/account is suspended/i)).toBeInTheDocument();
  });

  it("keeps the right to a data copy after withdrawal", async () => {
    // The frame says so in as many words, and it is correct in law: the right
    // of access survives withdrawal of consent.
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /^Withdraw consent$/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /Withdraw consent/i }).at(-1)!);

    expect(await screen.findByText(/account is suspended/i)).toBeInTheDocument();
    expect(
      screen.getByText(/keep this right even after withdrawing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Request my child/i }),
    ).toBeInTheDocument();
  });

  it("does not offer to withdraw twice", async () => {
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /^Withdraw consent$/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /Withdraw consent/i }).at(-1)!);
    await screen.findByText(/account is suspended/i);

    expect(
      screen.queryByRole("button", { name: /Withdraw consent/i }),
    ).not.toBeInTheDocument();
  });
});

describe("when the request does not land", () => {
  it("never reports success on a failure", async () => {
    // The assertion this file exists for. A parent must not be told their
    // objection was received when nothing left the browser.
    exerciseRight.mockRejectedValueOnce(new Error("network"));
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /Object to processing/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t send/i);
    expect(screen.queryByText(/Objection submitted/i)).not.toBeInTheDocument();
  });

  it("says nothing has changed, because nothing has", async () => {
    exerciseRight.mockRejectedValueOnce(new Error("network"));
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /Object to processing/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Nothing has changed/i);
  });

  it("treats an unknown token as the end of the road, not a retry", async () => {
    // 404 "Parent link not found" means the link was revoked, replaced or
    // mistyped. Inviting a retry would send a parent round a loop that cannot
    // succeed; the school is the only way back.
    exerciseRight.mockRejectedValueOnce(new ApiError(404, "not found"));
    render(<ParentDataManagement token="stale" />);
    fireEvent.click(screen.getByRole("button", { name: /Request my child/i }));

    expect(await screen.findByText(/no longer active/i)).toBeInTheDocument();
    expect(screen.getByText(/contact your child’s school/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Object/i })).not.toBeInTheDocument();
  });
});

describe("what the page tells a parent", () => {
  it("names the NDPC as an escalation route", () => {
    // Required by SCRUM-80: a parent may complain to the regulator, and the
    // page has to say so rather than positioning Nevo as the only recourse.
    render(<ParentDataManagement token={RIGHTS} />);
    expect(screen.getByRole("link", { name: /ndpc\.gov\.ng/i })).toBeInTheDocument();
  });

  it("discloses cross-border processing without being asked", () => {
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /Where data is processed/i }));
    expect(screen.getByText(/no adequacy decision from the NDPC/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Contractual Clauses/i)).toBeInTheDocument();
  });

  it("states plainly that Nevo stores no label or diagnosis", () => {
    render(<ParentDataManagement token={RIGHTS} />);
    fireEvent.click(screen.getByRole("button", { name: /How profiling works/i }));
    expect(
      screen.getByText(/never stores a label or a diagnosis/i),
    ).toBeInTheDocument();
  });
});
