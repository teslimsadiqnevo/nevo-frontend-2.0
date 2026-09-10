import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Modal, Sheet } from "./primitives";

/**
 * A dialog that has started a write keeps the screen until that write settles.
 *
 * All three dismissal routes ran unconditionally, and nothing in `lib/api`
 * carries an AbortController - so a dismissed request always completes, the
 * `.then` sets state on an unmounted tree, React discards it in silence, and
 * the dialog's own honest copy is never shown to anybody. That is the inverse
 * of the law this console has fixed fifteen times: a write that DID happen,
 * reading as one that did not.
 *
 * Escape and the backdrop are reflex; the X is a decision. Only the reflexes
 * are made inert, because deadening every exit would leave a browser reload as
 * the only way out - which loses strictly more than the dismissal does.
 */

const cases = [
  ["Sheet", Sheet] as const,
  ["Modal", Modal] as const,
];

describe.each(cases)("%s dismissal while a write is in flight", (name, Dialog) => {
  const open = (busy: boolean, onClose = vi.fn()) => {
    const view = render(
      <Dialog title="Archive this class?" onClose={onClose} busy={busy} footer={<span />}>
        <p>body</p>
      </Dialog>,
    );
    return { ...view, onClose };
  };

  it("ignores Escape", () => {
    const { onClose } = open(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores a backdrop press", () => {
    const { container, onClose } = open(true);
    fireEvent.mouseDown(container.firstChild as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still lets the X out, so nobody is sealed in behind a hung request", () => {
    const { onClose } = open(true);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves all three live when no write is in flight", () => {
    const { container, onClose } = open(false);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("says it is busy in the accessibility tree", () => {
    open(true);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
  });

  it("stops ignoring Escape once the write settles", () => {
    /*
     * THE STALE-CLOSURE TRAP, and the reason this test exists.
     *
     * The keydown effect's deps were `[onClose]`, and callers pass a stable
     * handler - so a `busy` captured on the first run would stay at its
     * MOUNT-TIME value for the life of the dialog. Mount idle, start a write,
     * and the guard never engages; mount busy, finish the write, and the
     * dialog can never be closed by Escape again. Either way the source reads
     * correctly and the behaviour is wrong, which is the failure mode this
     * codebase keeps meeting.
     */
    const onClose = vi.fn();
    function Host() {
      const [busy, setBusy] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setBusy(false)}>
            settle
          </button>
          <Dialog title="Archive this class?" onClose={onClose} busy={busy} footer={<span />}>
            <p>body</p>
          </Dialog>
        </>
      );
    }
    render(<Host />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "settle" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("starts ignoring Escape once a write begins", () => {
    // The mirror of the above: mounted idle, then a write starts.
    const onClose = vi.fn();
    function Host() {
      const [busy, setBusy] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setBusy(true)}>
            start
          </button>
          <Dialog title="Archive this class?" onClose={onClose} busy={busy} footer={<span />}>
            <p>body</p>
          </Dialog>
        </>
      );
    }
    render(<Host />);

    fireEvent.click(screen.getByRole("button", { name: "start" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
