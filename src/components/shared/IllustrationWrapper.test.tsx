import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { IllustrationWrapper } from "./IllustrationWrapper";

/**
 * Lesson visuals arrive as SIGNED remote URLs. `next/image` refuses any
 * hostname absent from `images.remotePatterns`, and `next.config.ts` configures
 * none - so every live lesson picture threw E231 in development and 400'd from
 * `/_next/image` in production, on the modality that had just been switched on.
 *
 * The property pinned here is the one that fixes it: a remote source is handed
 * to the browser AS SENT, never rewritten through the optimizer. Local art
 * keeps the optimizer, because resizing matters for a child on a slow
 * connection.
 *
 * There was a green unit test asserting the URL survives `fromContent`, and
 * nothing that rendered it - which is exactly why this went unnoticed.
 */

const REMOTE =
  "https://storage.example.com/lessons/photosynthesis-1.png?X-Signature=abc123";

describe("a remote lesson visual", () => {
  it("is passed straight through, not rewritten through /_next/image", () => {
    render(
      <IllustrationWrapper src={REMOTE} alt="A leaf" width={600} height={400} />,
    );

    const img = screen.getByRole("img", { name: "A leaf" });
    expect(img).toHaveAttribute("src", REMOTE);
    expect(img.getAttribute("src")).not.toContain("/_next/image");
  });

  it("carries no srcset, because there are no generated widths to offer", () => {
    render(
      <IllustrationWrapper src={REMOTE} alt="A leaf" width={600} height={400} />,
    );
    expect(screen.getByRole("img", { name: "A leaf" })).not.toHaveAttribute("srcset");
  });

  it("treats http the same as https", () => {
    const http = "http://storage.example.com/x.png";
    render(<IllustrationWrapper src={http} alt="X" width={10} height={10} />);
    expect(screen.getByRole("img", { name: "X" })).toHaveAttribute("src", http);
  });
});

describe("local art we ship", () => {
  it("still goes through the optimizer", () => {
    // Resizing and format conversion genuinely matter on a slow connection, so
    // the fix must not quietly switch optimization off for everything.
    render(
      <IllustrationWrapper
        src="/illustrations/consent-gate.png"
        alt="Nevo"
        width={600}
        height={400}
      />,
    );

    const img = screen.getByRole("img", { name: "Nevo" });
    expect(img.getAttribute("src")).toContain("/_next/image");
  });
});
