import { describe, expect, it } from "vitest";
import { processingWithdrawn, type ConsentGateStatus } from "./consents";

/**
 * Design's SCRUM-80 ruling (7 Sep), encoded.
 *
 * Nevo does not gate on consent - the school warrants it through the DSA - with
 * exactly one exception: an explicit parental withdrawal must stop processing.
 *
 * The trap this file exists to hold shut is that `granted` is the obvious field
 * and the WRONG one. Three of the four statuses report `granted: false`, and
 * two of those three mean "proceed". Anyone reaching for `if (!gate.granted)`
 * blocks children whose school simply has not filed the paperwork yet - which
 * is the precise failure the ruling was written to prevent.
 */

const gate = (
  status: ConsentGateStatus["status"],
  granted: boolean,
): ConsentGateStatus => ({
  student_id: "s-1",
  granted,
  required_type: "data_processing",
  status,
});

describe("processingWithdrawn", () => {
  it("is true only for an explicit withdrawal", () => {
    expect(processingWithdrawn(gate("withdrawn", false))).toBe(true);
  });

  it("is false when the school has not recorded consent yet", () => {
    // `not_sent` is the school's administrative backlog, not the child's
    // problem. This child learns normally.
    expect(processingWithdrawn(gate("not_sent", false))).toBe(false);
  });

  it("is false while a parent has been asked and not yet replied", () => {
    expect(processingWithdrawn(gate("pending", false))).toBe(false);
  });

  it("is false when consent is confirmed", () => {
    expect(processingWithdrawn(gate("confirmed", true))).toBe(false);
  });

  it("does not read `granted` - the field that would get this wrong", () => {
    // Same status, opposite `granted`. If the implementation ever starts
    // consulting `granted`, one of these two flips and this fails.
    expect(processingWithdrawn(gate("pending", false))).toBe(false);
    expect(processingWithdrawn(gate("pending", true))).toBe(false);
    expect(processingWithdrawn(gate("withdrawn", false))).toBe(true);
    expect(processingWithdrawn(gate("withdrawn", true))).toBe(true);
  });

  it("treats an unreadable gate as not-withdrawn", () => {
    // A failed read must not suspend a child. Withdrawal is an affirmative
    // parental act; absence of evidence is not evidence of it, and the backend
    // remains the real enforcement point either way.
    expect(processingWithdrawn(null)).toBe(false);
    expect(processingWithdrawn(undefined)).toBe(false);
  });
});
