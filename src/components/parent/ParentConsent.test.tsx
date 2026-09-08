import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import type { ParentInvitation } from "@/lib/api/parent";

const { completeConsent } = vi.hoisted(() => ({ completeConsent: vi.fn() }));

// Replaced wholesale - pulling the real module in alongside `client.ts` hangs
// the jsdom worker for 60s. See ParentDataManagement.test.tsx.
vi.mock("@/lib/api/parent", () => ({ parentApi: { completeConsent } }));

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
  completeConsent.mockResolvedValue({
    invitation_id: "inv-1",
    parent_link_id: "pl-1",
    parent_id: "p-1",
    student_id: "s-1",
    confirmed_types: ["data_processing"],
    completed_at: "2026-09-08T10:00:00Z",
  });
});

describe("the request", () => {
  it("names the school and the child, in the school's words", () => {
    render(<ParentConsent token={TOKEN} invitation={inv()} />);

    expect(
      screen.getByRole("heading", {
        name: /Amara[’']s school would like your okay to get her started on Nevo\./,
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

describe("what the success screen refuses to claim", () => {
  it("does not offer a parent account, because nothing can create one", async () => {
    // The frame draws "Set up my parent account". There is no endpoint to give
    // a parent credentials and D15d is unbuilt, so the button would do nothing.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    expect(
      screen.queryByRole("button", { name: /Set up my parent account/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Maybe later/i)).not.toBeInTheDocument();
  });

  it("does not promise a copy was sent to their phone", async () => {
    // Nothing in the contract says a copy is sent, and the completion response
    // does not report one. Telling a parent they have a receipt they may not
    // have is exactly the kind of small untruth this page cannot afford.
    render(<ParentConsent token={TOKEN} invitation={inv()} />);
    fireEvent.click(screen.getByRole("button", { name: /Yes, I give my consent/ }));
    await screen.findByText(/that[’']s all we needed/i);

    expect(screen.queryByText(/sent to your phone/i)).not.toBeInTheDocument();
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
