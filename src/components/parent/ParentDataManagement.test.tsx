import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import type { ParentInvitation } from "@/lib/api/parent";

const { exerciseRight, getInvitation } = vi.hoisted(() => ({
  exerciseRight: vi.fn(),
  getInvitation: vi.fn(),
}));

// Replaced wholesale rather than spread over `importOriginal`. Pulling the
// real module in here hangs the jsdom worker for 60s - `parent.ts` imports
// `client.ts`, which this file also imports for `ApiError`, and resolving both
// at once deadlocks. The module exports one object and types, so there is
// nothing to preserve.
vi.mock("@/lib/api/parent", () => ({
  parentApi: { exerciseRight, getInvitation },
}));

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

const TOKEN = "parent-token-abc";

const INVITATION: ParentInvitation = {
  invitationId: "inv-1",
  studentFirstName: "Amara",
  schoolName: "Corona Secondary School",
  schoolPhone: null,
  schoolEmail: null,
  parentName: "Ngozi Okafor",
  status: "confirmed",
  consentTypes: ["data_processing"],
  expiresAt: "2026-12-01T00:00:00Z",
  decidedAt: null,
};

const receipt = (over: Partial<{ reasonRecorded: boolean }> = {}) => ({
  requestId: "req-1",
  requestType: "object" as const,
  status: "received",
  reasonRecorded: false,
  ...over,
});

beforeEach(() => {
  exerciseRight.mockReset();
  getInvitation.mockReset();
  exerciseRight.mockResolvedValue(receipt());
  getInvitation.mockResolvedValue(INVITATION);
});

describe("resolving the token", () => {
  it("names the child and the school, which it could not do before", async () => {
    // The whole reason `GET /consents/parent/{token}` was asked for. D01c is
    // written in the child's name throughout; it used to say "your child".
    render(<ParentDataManagement token={TOKEN} />);

    expect(await screen.findByText(/Amara[’']s data on Nevo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Corona Secondary School enrolled Amara/i),
    ).toBeInTheDocument();
  });

  it("shows a loading state rather than a nameless page", () => {
    getInvitation.mockReturnValue(new Promise(() => {}));
    render(<ParentDataManagement token={TOKEN} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Object/i })).not.toBeInTheDocument();
  });

  it("treats an unknown, revoked or expired link as the end of the road", async () => {
    // All three are 404, and all three are resolved the same way: the school
    // issues a new link. Inviting a retry would send a parent round a loop that
    // cannot succeed.
    getInvitation.mockRejectedValue(new ApiError(404, "not found"));
    render(<ParentDataManagement token="stale" />);

    expect(await screen.findByText(/no longer active/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Object/i })).not.toBeInTheDocument();
  });
});

describe("a parent who already withdrew", () => {
  it("arrives at the suspended state, not the actions", async () => {
    // The failure this fixes: with no way to read the token, a parent who
    // withdrew last week was shown the withdrawal buttons again.
    getInvitation.mockResolvedValue({ ...INVITATION, status: "withdrawn" });
    render(<ParentDataManagement token={TOKEN} />);

    expect(await screen.findByText(/Amara[’']s account is suspended/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Withdraw consent$/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the right to a data copy after withdrawal", async () => {
    // Correct in law: the right of access survives withdrawal of consent, and
    // the frame says so in as many words.
    getInvitation.mockResolvedValue({ ...INVITATION, status: "withdrawn" });
    render(<ParentDataManagement token={TOKEN} />);

    expect(
      await screen.findByText(/keep this right even after withdrawing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Request Amara[’']s data/i }),
    ).toBeInTheDocument();
  });

  it("does not treat pending or not_sent as withdrawn", async () => {
    // Three of the four ConsentStatus values report granted:false. Only an
    // explicit withdrawal suspends; the others must see the ordinary page.
    for (const status of ["not_sent", "pending"] as const) {
      getInvitation.mockResolvedValue({ ...INVITATION, status });
      const { unmount } = render(<ParentDataManagement token={TOKEN} />);
      expect(
        await screen.findByRole("button", { name: /^Withdraw consent$/i }),
      ).toBeInTheDocument();
      unmount();
    }
  });
});

describe("a student the school never named", () => {
  // NOT hypothetical. The backend sends the LITERAL string "your child" when a
  // school entered no first name, and confirmed there is such a student in the
  // data. A `?? "your child"` fallback does not help - the field is always
  // present, so the literal flows into whatever sentence it lands in.
  const NAMELESS = { ...INVITATION, studentFirstName: "your child" };

  it("capitalises the name where it opens a heading", async () => {
    getInvitation.mockResolvedValue(NAMELESS);
    render(<ParentDataManagement token={TOKEN} />);

    // "Your child’s data on Nevo", never "your child’s data on Nevo".
    expect(
      await screen.findByRole("heading", { name: /^Your child[’']s data on Nevo$/ }),
    ).toBeInTheDocument();
  });

  it("capitalises it on the suspended heading too", async () => {
    getInvitation.mockResolvedValue({ ...NAMELESS, status: "withdrawn" });
    render(<ParentDataManagement token={TOKEN} />);

    expect(
      await screen.findByRole("heading", { name: /^Your child[’']s account is suspended$/ }),
    ).toBeInTheDocument();
  });

  it("leaves it lowercase mid-sentence, where capitals would be wrong", async () => {
    getInvitation.mockResolvedValue(NAMELESS);
    render(<ParentDataManagement token={TOKEN} />);

    expect(
      await screen.findByText(/enrolled your child on Nevo/),
    ).toBeInTheDocument();
  });

  it("does not mangle a real name", async () => {
    render(<ParentDataManagement token={TOKEN} />);
    expect(await screen.findByText(/Amara[’']s data on Nevo/)).toBeInTheDocument();
  });
});

describe("when the withdrawal happened", () => {
  it("says the date, rather than only that it happened", async () => {
    getInvitation.mockResolvedValue({
      ...INVITATION,
      status: "withdrawn",
      decidedAt: "2026-09-03T10:15:00Z",
    });
    render(<ParentDataManagement token={TOKEN} />);

    expect(
      await screen.findByText(/You withdrew consent on 3 September 2026, so they can no longer access Nevo\./),
    ).toBeInTheDocument();
  });

  it("keeps the comma attached when there is no date", async () => {
    // Guards the sentence as a whole. Note this one does NOT fail if the
    // interpolated form comes back - JSX strips newline-adjacent whitespace,
    // so that form spaces correctly. The case that actually breaks is the
    // unparseable date below.
    getInvitation.mockResolvedValue({
      ...INVITATION,
      status: "withdrawn",
      decidedAt: null,
    });
    render(<ParentDataManagement token={TOKEN} />);

    expect(
      await screen.findByText(/^You withdrew consent, so they can no longer access Nevo\.$/),
    ).toBeInTheDocument();
  });

  it("renders no date rather than 'Invalid Date' on a bad value", async () => {
    getInvitation.mockResolvedValue({
      ...INVITATION,
      status: "withdrawn",
      decidedAt: "not-a-date",
    });
    render(<ParentDataManagement token={TOKEN} />);

    expect(await screen.findByText(/^You withdrew consent, so/)).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
  });
});

describe("who the link is for", () => {
  it("names the parent the school recorded, because a link can be forwarded", async () => {
    render(<ParentDataManagement token={TOKEN} />);
    expect(
      await screen.findByText(/This link was sent to Ngozi Okafor\./),
    ).toBeInTheDocument();
  });
});

describe("objecting", () => {
  it("offers a box for the concern, now that something receives it", async () => {
    // The inverse of the old assertion. The textarea was deliberately withheld
    // while `reason` was accepted and dropped; it returns now that the contract
    // persists it and confirms with `reasonRecorded`.
    render(<ParentDataManagement token={TOKEN} />);

    expect(await screen.findByRole("textbox")).toBeInTheDocument();
  });

  it("sends the parent's words with the objection", async () => {
    exerciseRight.mockResolvedValue(receipt({ reasonRecorded: true }));
    render(<ParentDataManagement token={TOKEN} />);

    fireEvent.change(await screen.findByRole("textbox"), {
      target: { value: "  I did not agree to profiling.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Object to processing/i }));

    // Trimmed - leading whitespace is not part of what they meant.
    expect(exerciseRight).toHaveBeenCalledWith(
      TOKEN,
      "object",
      "  I did not agree to profiling.  ",
    );
    expect(await screen.findByText(/within 48 hours/i)).toBeInTheDocument();
  });

  it("admits it when the reason was NOT recorded", async () => {
    // The contract answers "did my words go anywhere". If it says no, say so -
    // promising a recorded concern that was dropped is the exact failure the
    // textarea was withheld for in the first place.
    exerciseRight.mockResolvedValue(receipt({ reasonRecorded: false }));
    render(<ParentDataManagement token={TOKEN} />);

    fireEvent.change(await screen.findByRole("textbox"), {
      target: { value: "a concern" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Object to processing/i }));

    expect(
      await screen.findByText(/could not attach your note/i),
    ).toBeInTheDocument();
  });

  it("does not claim a note failed when none was written", async () => {
    exerciseRight.mockResolvedValue(receipt({ reasonRecorded: false }));
    render(<ParentDataManagement token={TOKEN} />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Object to processing/i }),
    );

    expect(await screen.findByText(/within 48 hours/i)).toBeInTheDocument();
    expect(screen.queryByText(/could not attach your note/i)).not.toBeInTheDocument();
  });
});

describe("withdrawing consent", () => {
  it("cannot be done in one tap", async () => {
    // The one irreversible action on the page, and restoring access needs the
    // school. It must not be reachable by a mis-tap.
    render(<ParentDataManagement token={TOKEN} />);
    fireEvent.click(
      await screen.findByRole("button", { name: /^Withdraw consent$/i }),
    );

    expect(exerciseRight).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Keep active/i })).toBeInTheDocument();
  });

  it("sends withdraw_consent only after confirming", async () => {
    render(<ParentDataManagement token={TOKEN} />);
    fireEvent.click(
      await screen.findByRole("button", { name: /^Withdraw consent$/i }),
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: /Withdraw consent/i }).at(-1)!,
    );

    expect(exerciseRight).toHaveBeenCalledWith(TOKEN, "withdraw_consent", undefined);
    expect(await screen.findByText(/account is suspended/i)).toBeInTheDocument();
  });
});

describe("when the request does not land", () => {
  it("never reports success on a failure", async () => {
    // The assertion this file exists for. A parent must not be told their
    // objection was received when nothing left the browser.
    exerciseRight.mockRejectedValueOnce(new Error("network"));
    render(<ParentDataManagement token={TOKEN} />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Object to processing/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t send/i);
    expect(screen.queryByText(/Objection submitted/i)).not.toBeInTheDocument();
  });

  it("says nothing has changed, because nothing has", async () => {
    exerciseRight.mockRejectedValueOnce(new Error("network"));
    render(<ParentDataManagement token={TOKEN} />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Object to processing/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/Nothing has changed/i);
  });
});

describe("the school's own contact details", () => {
  it("are omitted entirely when the school has none", async () => {
    // They come from the billing contact and are null for MOST schools today.
    // A "call your school" line with nothing after it is worse than no line.
    render(<ParentDataManagement token={TOKEN} />);
    await screen.findByText(/Amara[’']s data on Nevo/i);

    expect(screen.queryByRole("link", { name: /Corona/i })).not.toBeInTheDocument();
    // The universal routes still stand.
    expect(screen.getByRole("link", { name: /support@nevolearning/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ndpc\.gov\.ng/i })).toBeInTheDocument();
  });

  it("are shown when the school has them", async () => {
    getInvitation.mockResolvedValue({
      ...INVITATION,
      schoolPhone: "+234 801 234 5678",
      schoolEmail: "office@corona.edu.ng",
    });
    render(<ParentDataManagement token={TOKEN} />);

    const phone = await screen.findByRole("link", { name: /\+234 801 234 5678/ });
    expect(phone).toHaveAttribute("href", "tel:+2348012345678");
    expect(
      screen.getByRole("link", { name: /office@corona\.edu\.ng/ }),
    ).toHaveAttribute("href", "mailto:office@corona.edu.ng");
  });
});

describe("what the page tells a parent", () => {
  it("discloses cross-border processing without being asked", async () => {
    render(<ParentDataManagement token={TOKEN} />);
    fireEvent.click(
      await screen.findByRole("button", { name: /Where data is processed/i }),
    );

    expect(screen.getByText(/no adequacy decision from the NDPC/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Contractual Clauses/i)).toBeInTheDocument();
  });

  it("states plainly that Nevo stores no label or diagnosis, in the child's name", async () => {
    render(<ParentDataManagement token={TOKEN} />);
    fireEvent.click(
      await screen.findByRole("button", { name: /How profiling works/i }),
    );

    expect(
      screen.getByText(/never stores a label or a diagnosis/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/how Amara is learning/i)).toBeInTheDocument();
  });
});
