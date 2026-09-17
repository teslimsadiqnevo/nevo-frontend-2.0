import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AvatarDisc } from "./AvatarDisc";

/**
 * The disc a person is represented by.
 *
 * The case worth guarding is the third one: a stored photo URL can expire or
 * 404, and a broken-image icon where a face should be is worse than the
 * initials that were there before it.
 */

describe("AvatarDisc", () => {
  it("shows the photo when there is one", () => {
    render(
      <AvatarDisc photoUrl="https://example.test/me.jpg">AO</AvatarDisc>,
    );

    expect(screen.getByRole("presentation", { hidden: true })).toHaveAttribute(
      "src",
      "https://example.test/me.jpg",
    );
    expect(screen.queryByText("AO")).not.toBeInTheDocument();
  });

  it("falls back to what the caller drew when there is no photo", () => {
    render(<AvatarDisc photoUrl={null}>AO</AvatarDisc>);

    expect(screen.getByText("AO")).toBeInTheDocument();
  });

  it("falls back when the photo will not load", () => {
    render(
      <AvatarDisc photoUrl="https://example.test/gone.jpg">AO</AvatarDisc>,
    );

    fireEvent.error(screen.getByRole("presentation", { hidden: true }));

    expect(screen.getByText("AO")).toBeInTheDocument();
  });

  it("carries no alt text, because the name is always beside it", () => {
    render(<AvatarDisc photoUrl="https://example.test/me.jpg">AO</AvatarDisc>);

    expect(screen.getByRole("presentation", { hidden: true })).toHaveAttribute(
      "alt",
      "",
    );
  });
});
