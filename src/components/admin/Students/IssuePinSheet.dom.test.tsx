import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { issuePin } = vi.hoisted(() => ({ issuePin: vi.fn() }));

vi.mock("@/lib/api/students", () => ({ studentsApi: { issuePin } }));

import { IssuePinSheet } from "./IssuePinSheet";

/**
 * Issuing a child a new PIN.
 *
 * The endpoint RESETS rather than reveals, and the response is the only time
 * the value is ever visible. Both facts are invisible in the contract - it is
 * a bare `POST` returning `PinIssueResponse` - so every guarantee worth having
 * here lives in this screen, and that is what these pin.
 *
 * They assert on CONSEQUENCE, not on layout: that nothing is issued before the
 * admin says so, that the one-shot nature is stated while the number is still
 * on screen, that a failure says the child is unaffected, and that the PIN is
 * never offered to the clipboard.
 */

const RESPONSE = {
  studentId: "s-1",
  pin: "482913",
  issuedAt: "2026-09-16T10:00:00Z",
  mustShareSecurely: true,
};

beforeEach(() => issuePin.mockReset());

const open = () =>
  render(
    <IssuePinSheet studentId="s-1" studentName="Amara Okafor" onClose={vi.fn()} />,
  );

const confirm = () =>
  fireEvent.click(screen.getByRole("button", { name: /^Issue a new PIN$/i }));

describe("before anything is issued", () => {
  it("does not call the endpoint just by opening", async () => {
    // The whole reason this sheet confirms: opening it to look would lock out
    // a child whose PIN was working.
    open();
    expect(issuePin).not.toHaveBeenCalled();
  });

  it("says the current PIN stops working, before the button is pressed", () => {
    open();
    expect(
      screen.getByText(/current PIN stops working straight away/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/won.t be able to sign in until/i),
    ).toBeInTheDocument();
  });

  it("shows no PIN, because none exists yet", () => {
    open();
    expect(screen.queryByText(/482/)).not.toBeInTheDocument();
  });
});

describe("once issued", () => {
  const issueAndSettle = async () => {
    issuePin.mockResolvedValueOnce(RESPONSE);
    open();
    confirm();
    return screen.findByText(/482 913/);
  };

  it("shows the PIN, grouped so it can be read aloud", async () => {
    expect(await issueAndSettle()).toBeInTheDocument();
    expect(issuePin).toHaveBeenCalledWith("s-1");
  });

  it("says this is the only time it will be seen, on the same screen", async () => {
    // Stated while the number is still visible, not discovered after closing.
    await issueAndSettle();
    expect(
      screen.getByText(/only time you.ll see it/i),
    ).toBeInTheDocument();
  });

  it("warns that issuing another locks the child out again", async () => {
    await issueAndSettle();
    expect(screen.getByText(/locks Amara out again/i)).toBeInTheDocument();
  });

  it("honours mustShareSecurely rather than assuming it", async () => {
    await issueAndSettle();
    expect(screen.getByText(/Hand it to Amara in person/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Don.t send it by message or email/i),
    ).toBeInTheDocument();
  });

  it("drops the do-not-send warning when the server says it is not needed", async () => {
    // A required boolean the server can set false. Hard-coding the warning
    // would be putting words in its mouth.
    issuePin.mockResolvedValueOnce({ ...RESPONSE, mustShareSecurely: false });
    open();
    confirm();

    await screen.findByText(/482 913/);
    expect(
      screen.queryByText(/Don.t send it by message or email/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/only to them/i)).toBeInTheDocument();
  });

  it("never offers the PIN to the clipboard", async () => {
    // `mustShareSecurely` says this may not travel electronically, and
    // everywhere you can paste a PIN is not in person.
    await issueAndSettle();
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();
  });

  it("offers one way out, and it is an acknowledgement rather than a cancel", async () => {
    // "Cancel" beside a PIN that is already live would be a lie, and a second
    // control invites the misclick that costs another lockout.
    await issueAndSettle();
    expect(
      screen.getByRole("button", { name: /I.ve written it down/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Cancel$/i })).not.toBeInTheDocument();
  });
});

describe("when it fails", () => {
  it("says the child's PIN is unchanged, rather than leaving it ambiguous", async () => {
    // An admin who cannot tell whether it went through will press again, and
    // a second successful issue invalidates the PIN from the first.
    issuePin.mockRejectedValueOnce(new Error("nope"));
    open();
    confirm();

    const msg = await screen.findByText(/hasn.t changed/i);
    expect(msg).toHaveTextContent(/can still use their old one/i);
  });

  it("offers a retry", async () => {
    issuePin.mockRejectedValueOnce(new Error("nope"));
    open();
    confirm();

    expect(
      await screen.findByRole("button", { name: /Try again/i }),
    ).toBeInTheDocument();
  });
});
