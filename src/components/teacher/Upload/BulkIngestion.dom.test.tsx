import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { batch, getToken } = vi.hoisted(() => ({ batch: vi.fn(), getToken: vi.fn() }));
vi.mock("@/lib/api/uploads", () => ({ uploadsApi: { batch, status: vi.fn() } }));
vi.mock("@/lib/api/lessons", () => ({ lessonsApi: { detail: vi.fn() } }));
vi.mock("@/lib/auth/session", () => ({ getToken }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

import { BulkIngestion } from "./BulkIngestion";

/**
 * The bulk parsing beat, and the counter that belonged to nobody.
 *
 * `TOTAL` is the frame's hardcoded 13 and `sorted` is advanced only by
 * `runDemo`, the signed-out beat. On the live path neither was touched, so a
 * signed-in teacher watched "0 of 13 lessons sorted" at 0% for the whole batch
 * - a fraction describing neither their files nor their progress - while the
 * inventory recorded this screen as LIVE with nothing missing.
 *
 * There is no per-lesson progress on the wire to replace it with: the batch
 * endpoint reports FILES accepted, not lessons sorted. So the fix is to say
 * what is known and let the spinner carry the waiting.
 */

const drop = (n: number) => {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error("no file input");
  const files = Array.from({ length: n }, (_, i) =>
    new File(["x"], `unit-${i}.pdf`, { type: "application/pdf" }),
  );
  Object.defineProperty(input, "files", { value: files, configurable: true });
  fireEvent.change(input);
};

beforeEach(() => {
  batch.mockReset();
  getToken.mockReset();
  // A promise that never settles: the screen stays on the parsing beat, which
  // is the state under test.
  batch.mockReturnValue(new Promise(() => {}));
});

describe("a signed-in teacher's real batch", () => {
  beforeEach(() => getToken.mockReturnValue("tok"));

  it("shows no invented fraction while it parses", () => {
    render(<BulkIngestion />);
    drop(4);

    expect(screen.queryByText(/of 13 lessons sorted/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 of/i)).not.toBeInTheDocument();
  });

  it("says how many files actually went", () => {
    // The one number this path genuinely knows.
    render(<BulkIngestion />);
    drop(4);

    expect(screen.getByText(/4 files sent for reading/i)).toBeInTheDocument();
  });

  it("says file, not files, for one", () => {
    render(<BulkIngestion />);
    drop(1);

    expect(screen.getByText(/1 file sent for reading/i)).toBeInTheDocument();
  });

  it("still shows that something is happening", () => {
    // Removing the fraction must not leave a blank screen mid-parse.
    render(<BulkIngestion />);
    drop(2);

    expect(screen.getByText(/Working through your material/i)).toBeInTheDocument();
  });
});

describe("the signed-out designed beat", () => {
  it("keeps its counted bar", () => {
    // The demo is the one place the frame's 13 means anything, and design drew
    // it. It must not be collateral damage from fixing the live path.
    getToken.mockReturnValue(null);

    render(<BulkIngestion />);
    drop(3);

    expect(screen.getByText(/of 13 lessons sorted/i)).toBeInTheDocument();
  });

  it("sends nothing to the backend", () => {
    getToken.mockReturnValue(null);

    render(<BulkIngestion />);
    drop(3);

    expect(batch).not.toHaveBeenCalled();
  });
});
