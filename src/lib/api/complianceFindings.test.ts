import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Counsel's ruling of 14 September, enforced where it cannot be forgotten.
 *
 * Two of the four rules are subtractive: never show the flagged `term`, and
 * never show the `recordId`, which ties a finding to an identifiable child.
 * Both arrive on every finding — all four fields are REQUIRED on
 * `ComplianceFindingResponse` — so they are stripped at the API boundary rather
 * than merely left unrendered.
 *
 * The distinction matters. A field held in React state is one
 * `JSON.stringify` away from a screen, one debug log away from a console, and
 * one props spread away from an attribute. These tests pin that the data never
 * gets that far.
 */

const get = vi.fn();
const post = vi.fn();

vi.mock("./client", () => ({
  api: {
    get: (p: string, o?: unknown) => get(p, o),
    post: (p: string, b?: unknown) => post(p, b),
  },
}));

const AUDIT = {
  schoolId: "sch1",
  schoolName: "Brightgate Academy",
  generatedAt: "2026-09-14T08:00:00Z",
  studentsProfiled: 40,
  adaptationEventsLogged: 120,
  diagnosticLabelsStored: 2,
  compliant: false,
  findings: [
    {
      table: "student_profiles",
      field: "notes",
      recordId: "9f1c7a2e-0000-4000-8000-000000000001",
      term: "dyslexia",
    },
    {
      table: "teacher_notes",
      field: "body",
      recordId: "9f1c7a2e-0000-4000-8000-000000000002",
      term: "ADHD",
    },
  ],
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  get.mockResolvedValue(structuredClone(AUDIT));
  post.mockResolvedValue(structuredClone(AUDIT));
});

describe("compliance findings reach the console stripped", () => {
  it("drops term and recordId from the read", async () => {
    const { schoolIntelligenceApi } = await import("./schoolIntelligence");
    const audit = await schoolIntelligenceApi.complianceAudit();

    expect(audit.findings).toEqual([
      { table: "student_profiles", field: "notes" },
      { table: "teacher_notes", field: "body" },
    ]);
  });

  it("drops them from the re-scan too", async () => {
    // The scan returns the identical schema. Stripping one and not the other
    // would mean the forbidden fields arrive the moment an admin presses
    // "run the check again".
    const { schoolIntelligenceApi } = await import("./schoolIntelligence");
    const audit = await schoolIntelligenceApi.runComplianceScan();

    for (const f of audit.findings) {
      expect(Object.keys(f).sort()).toEqual(["field", "table"]);
    }
  });

  it("leaves no trace of either value anywhere in the returned object", async () => {
    // The strongest form: serialise the whole audit and look for the values
    // themselves, not just the keys.
    const { schoolIntelligenceApi } = await import("./schoolIntelligence");
    const serialised = JSON.stringify(
      await schoolIntelligenceApi.complianceAudit(),
    );

    expect(serialised).not.toMatch(/dyslexia/i);
    expect(serialised).not.toMatch(/ADHD/i);
    expect(serialised).not.toMatch(/9f1c7a2e/);
    expect(serialised).not.toMatch(/recordId/);
    expect(serialised).not.toMatch(/"term"/);
  });

  it("carries a NEW identifying field no further than the two it knows", async () => {
    // Rebuilt field by field rather than destructured-and-rested, so a field
    // the backend adds later does not ride in by default. This is the test
    // that fails if someone "simplifies" it to `...rest`.
    get.mockResolvedValue({
      ...structuredClone(AUDIT),
      findings: [
        {
          table: "student_profiles",
          field: "notes",
          recordId: "x",
          term: "y",
          studentName: "Amara Okafor",
          snippet: "…diagnosed with…",
        },
      ],
    });

    const { schoolIntelligenceApi } = await import("./schoolIntelligence");
    const audit = await schoolIntelligenceApi.complianceAudit();

    expect(Object.keys(audit.findings[0]).sort()).toEqual(["field", "table"]);
    expect(JSON.stringify(audit)).not.toMatch(/Amara|diagnosed/);
  });

  it("keeps the audit's own counts, which are not findings", async () => {
    const { schoolIntelligenceApi } = await import("./schoolIntelligence");
    const audit = await schoolIntelligenceApi.complianceAudit();

    expect(audit.diagnosticLabelsStored).toBe(2);
    expect(audit.compliant).toBe(false);
    expect(audit.findings).toHaveLength(2);
  });

  it("survives a response with no findings array at all", async () => {
    get.mockResolvedValue({ ...structuredClone(AUDIT), findings: undefined });

    const { schoolIntelligenceApi } = await import("./schoolIntelligence");
    const audit = await schoolIntelligenceApi.complianceAudit();
    expect(audit.findings).toEqual([]);
  });
});
