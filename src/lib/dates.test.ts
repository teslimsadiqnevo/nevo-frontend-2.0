import { describe, expect, it } from "vitest";
import { longDate } from "./dates";

/**
 * A date we cannot read is a fact we do not have, and this console does not
 * print a placeholder for one - the caller drops the line. The alternative,
 * shipped elsewhere in this codebase before now, is a row reading
 * "Assigned Invalid Date" on a screen about a member of staff.
 */
describe("longDate", () => {
  it("writes a full month and an explicit year", () => {
    // The year is not optional: an assignment can predate this school year,
    // and "14 July" beside a role would read as the current one.
    expect(longDate("2026-07-14T09:30:00Z")).toBe("14 July 2026");
  });

  it("is null for every shape that is not a date", () => {
    expect(longDate(null)).toBeNull();
    expect(longDate(undefined)).toBeNull();
    expect(longDate("")).toBeNull();
    expect(longDate("not a date")).toBeNull();
  });
});
