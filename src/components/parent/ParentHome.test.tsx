import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import type { GrowthNarrative, ParentChild } from "@/lib/api/parent";

const { myChildren, childGrowth, getSession } = vi.hoisted(() => ({
  myChildren: vi.fn(),
  childGrowth: vi.fn(),
  getSession: vi.fn(),
}));

// Replaced wholesale - see ParentDataManagement.test.tsx for why importOriginal
// deadlocks the jsdom worker here.
vi.mock("@/lib/api/parent", () => ({ parentApi: { myChildren, childGrowth } }));
vi.mock("@/lib/auth/session", () => ({ getSession }));

import { ParentHome } from "./ParentHome";

/**
 * The signed-in parent portal.
 *
 * Two properties are worth more than the rest here. A parent who is not signed
 * in must be told something TRUE and useful rather than shown a login that does
 * not exist; and switching between children must never leave one child's
 * narrative sitting under another child's name, which on this screen would be a
 * serious thing to get wrong.
 */

const CHILD: ParentChild = {
  studentId: "s-1",
  firstName: "Amara",
  lastName: "Okafor",
  status: "active",
  schoolId: "sc-1",
  schoolName: "Corona Secondary School",
};

const SIBLING: ParentChild = { ...CHILD, studentId: "s-2", firstName: "Tunde" };

const growthFor = (name: string, id: string): GrowthNarrative => ({
  studentId: id,
  studentFirstName: name,
  headline: "Real change",
  summary: `${name} is settling in.`,
  statements: [
    {
      dimension: "connecting_ideas",
      trend: "growing",
      statement: `${name} is carrying ideas between subjects.`,
    },
  ],
  periodStart: "2026-06-12",
  periodEnd: "2026-09-10",
  comparisonStart: "2026-03-14",
  comparisonEnd: "2026-06-11",
  generatedAt: "2026-09-10T09:00:00Z",
});

beforeEach(() => {
  myChildren.mockReset();
  childGrowth.mockReset();
  getSession.mockReset();
  getSession.mockReturnValue({
    token: "t",
    expiresAt: "2026-12-01T00:00:00Z",
    userId: "p-1",
    role: "parent_guardian",
  });
  myChildren.mockResolvedValue([CHILD]);
  childGrowth.mockImplementation(async (id: string) =>
    growthFor(id === "s-2" ? "Tunde" : "Amara", id),
  );
});

describe("a parent who is not signed in", () => {
  it("offers the sign-in screen rather than sending them hunting for a link", async () => {
    /*
     * THIS TEST USED TO ASSERT THE DEAD END, and its comment said "design has
     * not drawn a parent door". D03 Parent Sign-In was drawn the whole time -
     * nobody had built it. So the screen told a parent who HAS an account to go
     * and find the consent link, which for many of them had already expired:
     * the invitation carries `expiresAt`, and a spent token 404s.
     *
     * Awaited rather than asserted synchronously: the local session check runs
     * inside the same promise chain as the request, so the state settles a
     * microtask later. Deliberate - it keeps every setState in a callback - and
     * it costs one tick, not a visible loading flash.
     */
    getSession.mockReturnValue(null);
    render(<ParentHome />);

    const door = await screen.findByRole("link", { name: "Sign in" });
    expect(door).toHaveAttribute("href", "/parent-sign-in");
    expect(
      screen.queryByText(/Open the link your school sent you/i),
    ).not.toBeInTheDocument();
    // Still no request: the throw happens before `myChildren` is reached.
    expect(myChildren).not.toHaveBeenCalled();
  });

  it("still tells them where a first-time account comes from", async () => {
    // Sign-in is for a parent who already has one. A parent who does not must
    // not be left thinking this screen is their route in.
    getSession.mockReturnValue(null);
    render(<ParentHome />);

    expect(
      await screen.findByText(/Open the consent link your child’s school sent you/i),
    ).toBeInTheDocument();
  });

  it("says the same thing when the server rejects the session", async () => {
    getSession.mockReturnValue({ token: "stale", expiresAt: "", userId: "", role: "" });
    myChildren.mockRejectedValue(new ApiError(401, "no"));
    render(<ParentHome />);

    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/parent-sign-in",
    );
  });

  it("offers a non-parent no parent door, because it is not theirs", async () => {
    // 403 is a different fact from 401. A teacher who lands here is signed in,
    // just not as a parent, and a "Sign in" button would send them round a loop
    // that cannot end well.
    myChildren.mockRejectedValue(new ApiError(403, "forbidden"));
    render(<ParentHome />);

    await screen.findByText(/This page is for parents and guardians/i);
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("points a signed-in NON-parent at their own console instead", async () => {
    // 403 is a different fact from 401 and deserves different words: a teacher
    // who lands here is signed in, just not as a parent.
    myChildren.mockRejectedValue(new ApiError(403, "forbidden"));
    render(<ParentHome />);

    expect(await screen.findByText(/This page is for parents and guardians/i)).toBeInTheDocument();
  });
});

describe("one child", () => {
  it("goes straight to the growth view, with no list of one to pick from", async () => {
    render(<ParentHome />);

    expect(await screen.findByText(/How Amara Is Growing/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Amara" })).not.toBeInTheDocument();
    expect(childGrowth).toHaveBeenCalledWith("s-1");
  });
});

describe("more than one child", () => {
  it("offers a name for each, and shows none until one is chosen", async () => {
    myChildren.mockResolvedValue([CHILD, SIBLING]);
    render(<ParentHome />);

    expect(await screen.findByRole("button", { name: "Amara" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tunde" })).toBeInTheDocument();
    expect(screen.getByText(/Choose a child/i)).toBeInTheDocument();
    expect(childGrowth).not.toHaveBeenCalled();
  });

  it("never shows one child's narrative under another child's name", async () => {
    // The failure worth guarding. Leaving the previous narrative on screen
    // while the next loads would attribute one child's growth to their sibling.
    myChildren.mockResolvedValue([CHILD, SIBLING]);
    render(<ParentHome />);

    fireEvent.click(await screen.findByRole("button", { name: "Amara" }));
    expect(await screen.findByText(/How Amara Is Growing/)).toBeInTheDocument();

    let release: (v: GrowthNarrative) => void = () => {};
    childGrowth.mockReturnValueOnce(new Promise<GrowthNarrative>((r) => { release = r; }));
    fireEvent.click(screen.getByRole("button", { name: "Tunde" }));

    // Mid-flight: Amara's narrative is GONE, not lingering under Tunde's name.
    expect(screen.queryByText(/How Amara Is Growing/)).not.toBeInTheDocument();

    release(growthFor("Tunde", "s-2"));
    expect(await screen.findByText(/How Tunde Is Growing/)).toBeInTheDocument();
  });
});

describe("edges", () => {
  it("says so plainly when the account is linked to no child", async () => {
    myChildren.mockResolvedValue([]);
    render(<ParentHome />);

    expect(await screen.findByText(/Nothing to show yet/i)).toBeInTheDocument();
  });

  it("does not blame the parent when the growth read fails", async () => {
    childGrowth.mockRejectedValue(new ApiError(500, "boom"));
    render(<ParentHome />);

    expect(await screen.findByText(/couldn’t load this just now/i)).toBeInTheDocument();
  });
});
