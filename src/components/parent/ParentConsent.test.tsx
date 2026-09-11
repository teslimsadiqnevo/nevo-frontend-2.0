import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import type { ParentInvitation } from "@/lib/api/parent";

const { completeConsent, createAccount, setSession } = vi.hoisted(() => ({
  completeConsent: vi.fn(),
  createAccount: vi.fn(),
  setSession: vi.fn(),
}));

// Replaced wholesale - pulling the real module in alongside `client.ts` hangs
// the jsdom worker for 60s. See ParentDataManagement.test.tsx. `apiErrorCode`
// is re-implemented rather than imported for the same reason; it is six lines
// and pinned by its own tests in the node project.
vi.mock("@/lib/api/parent", () => ({
  parentApi: { completeConsent, createAccount },
  apiErrorCode: (detail: unknown) => {
    if (!detail || typeof detail !== "object") return null;
    const inner = (detail as { detail?: unknown }).detail;
    if (!inner || typeof inner !== "object") return null;
    const code = (inner as { code?: unknown }).code;
    return typeof code === "string" && code ? code : null;
  },
}));
vi.mock("@/lib/auth/session", () => ({ setSession }));

import { ParentConsent } from "./ParentConsent";

/**
 * D01b Parent Consent (SCRUM-80).
 *
 * The screen that actually collects consent, so the assertions are about two
 * things: that a tap really reaches the API, and that the page never claims
 * something Nevo has not done. The second matters more than it sounds - this
 * is the page a school points a parent at to satisfy a legal obligation, and
 * a single unfounded sentence on it undermines the rest.
 */

const TOKEN = "consent-token-xyz";

const INVITATION: ParentInvitation = {
  invitationId: "inv-1",
  studentFirstName: "Amara",
  schoolName: "Corona Secondary School",
  schoolPhone: null,
  schoolEmail: null,
  parentName: "Ngozi Okafor",
  status: "pending",
  consentTypes: ["data_processing"],
  expiresAt: "2026-12-01T00:00:00Z",
  decidedAt: null,
};

const inv = (over: Partial<ParentInvitation> = {}): ParentInvitation => ({
  ...INVITATION,
  ...over,
});

beforeEach(() => {
  completeConsent.mockReset();
  createAccount.mockReset();
  setSession.mockReset();
  createAccount.mockResolvedValue({
    userId: "p-1",
    contact: "parent@example.com",
    contactMethod: "email",
    studentId: "s-1",
    session: {
      access_token: "parent-tok",
      token_type: "bearer",
      expires_at: "2026-12-01T00:00:00Z",
      user_id: "p-1",
      role: "parent_guardian",
      replaced_session: false,
    },
  });
  completeConsent.mockResolvedValue({
    invitation_id: "inv-1",
    parent_link_id: "pl-1",
    parent_id: "p-1",
    student_id: "s-1",
    confirmed_types: ["data_processing"],
    completed_at: "2026-09-08T10:00:00Z",
    receipt_sent_to: null,
  });
});

describe("the request", () => {
  it("names the school and the child, in the school's words", () => {
    render(<ParentConsent token={TOKEN} invitation={inv()} />);

    expect(
      screen.getByRole("heading", {
        name: /Amara[’']s school would like your okay to get Amara started on Nevo\./,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Corona Secondary School/).length).toBeGreaterThan(0);
  });

  it("states all three promises, including the right to withdraw", () => {
    // "You can withdraw any time" is the one that makes the consent informed.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);

    expect(screen.getByText(/What Amara does/)).toBeInTheDocument();
    expect(screen.getByText(/What we keep/)).toBeInTheDocument();
    expect(screen.getByText(/You stay in control/)).toBeInTheDocument();
    expect(screen.getByText(/You can withdraw any time/)).toBeInTheDocument();
  });

  it("offers one blanket consent and no per-type toggles", () => {
    // Design ruled one consent, one tap: the DSA defines the scope, so there is
    // nothing here to tick. A checkbox would invent a choice the school already
    // made.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Yes, I give my consent/ }),
    ).toBeInTheDocument();
  });

  it("gives the question route equal footing, not a buried link", () => {
    // "No dark patterns" is a literal requirement of this frame.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    expect(
      screen.getByRole("button", { name: /I have a question first/ }),
    ).toBeInTheDocument();
  });

  it("uses no gendered pronoun anywhere, for any child", () => {
    // This screen was written from the Amara frame and carried "she"/"her"
    // seven times - on the first page a parent ever sees, about their own
    // child. The payload carries a NAME and no pronoun, so the copy uses the
    // name where it reads naturally and "they" everywhere else.
    const { container } = render(<ParentConsent token={TOKEN} invitation={inv()} />);
    // Word boundaries are load-bearing here. Without them this matches the
    // "he" inside "the" and "they" and could never pass; written through a
    // shell they were mangled into literal backspace characters, which made
    // it match nothing and never FAIL. Verified by putting a "she" back.
    expect(container.textContent ?? "").not.toMatch(/\b(she|her|hers|him|his)\b/i);
  });

  it("stays pronoun-free on the three promises when opened out", () => {
    const { container } = render(<ParentConsent token={TOKEN} invitation={inv()} />);
    // The three promises are the densest copy on the page and where the
    // pronouns were thickest.
    expect(container.textContent).toMatch(/at their own pace/);
    expect(container.textContent).toMatch(/how they[’']re getting on/);
    expect(container.textContent).toMatch(/Amara[’']s progress is always saved/);
  });

  it("capitalises a nameless student's stand-in at the head of the heading", () => {
    // The API sends the literal string "your child" when no first name exists.
    render(
      <ParentConsent token={TOKEN} invitation={inv({ studentFirstName: "your child" })} />,
    );

    expect(
      screen.getByRole("heading", { name: /^Your child[’']s school would like/ }),
    ).toBeInTheDocument();
  });
});

describe("giving consent", () => {
  it("sends the token, which is the whole request", async () => {
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));

    expect(completeConsent).toHaveBeenCalledWith(TOKEN);
    expect(await screen.findByText(/that[’']s all we needed/i)).toBeInTheDocument();
  });

  it("never reports success on a failure", async () => {
    // The assertion this file exists for. A parent must not be told consent was
    // recorded when nothing left the browser - the school would then believe it
    // has a consent it does not have.
    completeConsent.mockRejectedValueOnce(new Error("network"));
    render(<ParentConsent token={TOKEN} invitation={inv()} />);

    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t record/i);
    expect(screen.queryByText(/that’s all we needed/i)).not.toBeInTheDocument();
  });

  it("treats a dead link as the end of the road, not a retry", async () => {
    completeConsent.mockRejectedValueOnce(new ApiError(404, "gone"));
    render(<ParentConsent token={TOKEN} invitation={inv()} />);

    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));

    expect(await screen.findByText(/no longer active/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Yes, I give my consent/ }),
    ).not.toBeInTheDocument();
  });
});

describe("the receipt line", () => {
  // This line was WITHHELD until 10 Sep, because nothing sent a copy and the
  // frame's "a copy has been sent to your phone" would have been a lie. It is
  // rendered now, but only from `receipt_sent_to` - never assumed.

  async function consentWith(receipt: "email" | "sms" | null) {
    completeConsent.mockResolvedValue({
      invitation_id: "inv-1",
      parent_link_id: "pl-1",
      parent_id: "p-1",
      student_id: "s-1",
      confirmed_types: ["data_processing"],
      completed_at: "2026-09-10T10:00:00Z",
      receipt_sent_to: receipt,
    });
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);
  }

  it("says phone when the copy went by SMS", async () => {
    await consentWith("sms");
    expect(screen.getByText(/copy of your consent has been sent to your phone/i)).toBeInTheDocument();
  });

  it("says email when the copy went by email", async () => {
    await consentWith("email");
    expect(screen.getByText(/copy of your consent has been sent to your email/i)).toBeInTheDocument();
  });

  it("says NOTHING when no copy was sent", async () => {
    // The whole reason the field exists. Claiming a receipt a parent does not
    // have is the small untruth this page cannot afford.
    await consentWith(null);
    expect(screen.queryByText(/copy of your consent/i)).not.toBeInTheDocument();
  });
});

describe("setting up a parent account", () => {
  it("offers the account, now that an endpoint can create one", async () => {
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    expect(
      screen.getByRole("button", { name: /Set up my parent account/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Maybe later/i })).toBeInTheDocument();
  });

  it("will not submit a password shorter than the server accepts", async () => {
    // 8 characters is the server's rule. Checking here too means a parent is
    // told before the round trip rather than after a 422.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    fireEvent.change(screen.getByLabelText(/Choose a password/i), {
      target: { value: "short" },
    });
    expect(
      screen.getByRole("button", { name: /Set up my parent account/i }),
    ).toBeDisabled();
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("sends the token and password, and stores the session it gets back", async () => {
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    fireEvent.change(screen.getByLabelText(/Choose a password/i), {
      target: { value: "a-good-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Set up my parent account/i }));

    expect(createAccount).toHaveBeenCalledWith(TOKEN, "a-good-password");
    // The response carries a session precisely so the parent is signed in
    // rather than handed a password and a door to find.
    await vi.waitFor(() =>
      expect(setSession).toHaveBeenCalledWith({
        token: "parent-tok",
        expiresAt: "2026-12-01T00:00:00Z",
        userId: "p-1",
        role: "parent_guardian",
      }),
    );
  });

  it("tells an SMS-only parent plainly, without calling it an error", async () => {
    // Password sign-in is email-only and Nigeria is SMS-first, so this is a
    // real slice of parents. It is not their fault and must not read as a
    // failure - their consent is recorded either way.
    createAccount.mockRejectedValueOnce(
      new ApiError(409, "conflict", { detail: { code: "parent_contact_not_email" } }),
    );
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    fireEvent.change(screen.getByLabelText(/Choose a password/i), {
      target: { value: "a-good-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Set up my parent account/i }));

    expect(await screen.findByText(/can’t set up an account with a phone number/i)).toBeInTheDocument();
    expect(screen.getByText(/consent is recorded either way/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not tell an existing-account parent to find a password they never set", async () => {
    // Both cases are 409 and they mean opposite things. Collapsing them would
    // send an SMS-only parent hunting for a password that does not exist.
    createAccount.mockRejectedValueOnce(new ApiError(409, "conflict", {}));
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    fireEvent.change(screen.getByLabelText(/Choose a password/i), {
      target: { value: "a-good-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Set up my parent account/i }));

    expect(await screen.findByText(/already set up an account/i)).toBeInTheDocument();
    expect(screen.queryByText(/phone number/i)).not.toBeInTheDocument();
  });

  it("never stores a session when account creation fails", async () => {
    createAccount.mockRejectedValueOnce(new ApiError(500, "boom", {}));
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    fireEvent.change(screen.getByLabelText(/Choose a password/i), {
      target: { value: "a-good-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Set up my parent account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t set that up/i);
    expect(setSession).not.toHaveBeenCalled();
  });

  it("lets a parent decline without losing the consent they just gave", async () => {
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    fireEvent.click(screen.getByRole("button", { name: /Maybe later/i }));

    expect(screen.getByText(/All done/i)).toBeInTheDocument();
    expect(screen.getByText(/set up an account later from the same link/i)).toBeInTheDocument();
    expect(createAccount).not.toHaveBeenCalled();
  });
});

describe("having a question first", () => {
  it("shows the school's own phone and email when it has them", () => {
    render(
      <ParentConsent
        token={TOKEN}
        invitation={inv({
          schoolPhone: "+234 1 271 0044",
          schoolEmail: "office@coronaschools.edu.ng",
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /I have a question first/ }));

    expect(screen.getByRole("link", { name: /\+234 1 271 0044/ })).toHaveAttribute(
      "href",
      "tel:+23412710044",
    );
    expect(
      screen.getByRole("link", { name: /office@coronaschools\.edu\.ng/ }),
    ).toHaveAttribute("href", "mailto:office@coronaschools.edu.ng");
  });

  it("degrades to prose when the school gave no contact details", () => {
    // Null for MOST schools today - they come from the billing contact. A
    // "reach the school directly:" heading with nothing under it is worse than
    // not offering the route.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /I have a question first/ }));

    expect(screen.queryByRole("link", { name: /tel:/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Contact the school the way you normally would/i)).toBeInTheDocument();
    expect(screen.queryByText(/Reach the school directly/i)).not.toBeInTheDocument();
  });

  it("always offers Nevo's own support address as a second route", () => {
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /I have a question first/ }));

    expect(
      screen.getByRole("link", { name: /support@nevolearning\.com/ }),
    ).toBeInTheDocument();
  });

  it("says plainly that nothing has happened yet", () => {
    // A parent reading the question screen must not fear they have already
    // consented by tapping through.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /I have a question first/ }));

    expect(screen.getByText(/consent is never assumed/i)).toBeInTheDocument();
  });

  it("goes back to the request without having sent anything", () => {
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /I have a question first/ }));
    fireEvent.click(screen.getByRole("button", { name: /Back to the request/ }));

    expect(completeConsent).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Yes, I give my consent/ }),
    ).toBeInTheDocument();
  });

  it("offers two ways back, with distinct accessible names", () => {
    // Both the header arrow and the foot button return to the request. They
    // must not share a name: two controls called "Back to the request" are
    // ambiguous to anyone navigating by voice or a screen reader control list.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /I have a question first/ }));

    const arrow = screen.getByRole("button", { name: "Back" });
    const foot = screen.getByRole("button", { name: "Back to the request" });
    expect(arrow).not.toBe(foot);

    fireEvent.click(arrow);
    expect(completeConsent).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Yes, I give my consent/ }),
    ).toBeInTheDocument();
  });
});
