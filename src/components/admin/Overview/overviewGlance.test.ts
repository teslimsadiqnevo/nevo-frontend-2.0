import { describe, expect, it } from "vitest";
import type { AttentionFlag } from "@/lib/api/intelligence";
import type { AdminStudentRow } from "@/lib/api/students";
import {
  awaitingParentReply,
  glanceRows,
  learnersWithOpenFlags,
} from "./overviewGlance";

/**
 * This roll-up was three invented counts under a note admitting they were
 * invented — a school with nothing in it was told six students were waiting on
 * parent consent. Two are real now, so the rules that matter are the ones that
 * stop a real count being wrong in a subtler way than a fixture was.
 */

const student = (
  id: string,
  status: AdminStudentRow["consent"] extends infer _ ? string : never,
): AdminStudentRow => ({
  id,
  name: `Student ${id}`,
  loginIdentifier: id,
  status: "active",
  ageBand: "11-14",
  consent: {
    status: status as "pending",
    actorId: null,
    actorName: null,
    timestamp: null,
    channel: null,
  },
});

const flag = (id: string, studentId: string, acknowledged = false): AttentionFlag => ({
  id,
  studentId,
  flagType: "pace",
  description: "Paused repeatedly on the same step.",
  generatedAt: "2026-09-10T09:00:00Z",
  acknowledged,
});

describe("awaitingParentReply", () => {
  it("counts pending only", () => {
    // `not_sent` is a school that has not asked - nobody is being waited on.
    // `withdrawn` is a decision, not a wait.
    const rows = [
      student("a", "pending"),
      student("b", "pending"),
      student("c", "not_sent"),
      student("d", "withdrawn"),
      student("e", "confirmed"),
    ];
    expect(awaitingParentReply(rows)).toBe(2);
  });

  it("does not count a row that carried no consent record", () => {
    const rows: AdminStudentRow[] = [
      { ...student("a", "pending"), consent: null },
    ];
    expect(awaitingParentReply(rows)).toBe(0);
  });
});

describe("learnersWithOpenFlags", () => {
  it("counts CHILDREN, not flags", () => {
    // Three flags, two children. The row says "students".
    const flags = [flag("1", "s1"), flag("2", "s1"), flag("3", "s2")];
    expect(learnersWithOpenFlags(flags)).toBe(2);
  });

  it("ignores flags already marked as seen", () => {
    const flags = [flag("1", "s1", true), flag("2", "s2")];
    expect(learnersWithOpenFlags(flags)).toBe(1);
  });
});

describe("glanceRows", () => {
  it("omits a row whose read did not answer, rather than reporting zero", () => {
    // THE LOAD-BEARING TEST. null is "we did not find out", and a school must
    // never be told nobody is waiting on consent because a fetch failed.
    expect(glanceRows(null, null)).toEqual([]);
    expect(glanceRows(null, [flag("1", "s1")]).map((r) => r.key)).toEqual([
      "flags",
    ]);
    expect(
      glanceRows([student("a", "pending")], null).map((r) => r.key),
    ).toEqual(["consent"]);
  });

  it("omits a row whose real count is zero", () => {
    // "0 students are waiting" is not worth a glance.
    expect(glanceRows([student("a", "confirmed")], [])).toEqual([]);
  });

  it("keeps D04's order when both are present", () => {
    const rows = glanceRows([student("a", "pending")], [flag("1", "s1")]);
    expect(rows.map((r) => r.key)).toEqual(["consent", "flags"]);
  });

  it("reads naturally at one", () => {
    const rows = glanceRows([student("a", "pending")], [flag("1", "s1")]);
    expect(rows[0].title).toBe("1 student is waiting on parent consent");
    expect(rows[1].title).toBe(
      "1 student has a flag nobody has marked as seen",
    );
  });

  it("never says a waiting child is blocked from lessons", () => {
    // SCRUM-80: the school warrants consent; the learner proceeds.
    const rows = glanceRows([student("a", "pending")], null);
    expect(rows[0].sub).not.toMatch(/can't begin|cannot begin|blocked/i);
    expect(rows[0].sub).toMatch(/learning as normal/i);
  });

  it("names no child and characterises none", () => {
    const rows = glanceRows([student("a", "pending")], [flag("1", "s1")]);
    for (const r of rows) {
      expect(`${r.title} ${r.sub}`).not.toMatch(/Student a|s1/);
      expect(`${r.title} ${r.sub}`).not.toMatch(
        /\b(struggl\w*|at risk|concern\w*|behind|weak)\b/i,
      );
    }
  });
});
