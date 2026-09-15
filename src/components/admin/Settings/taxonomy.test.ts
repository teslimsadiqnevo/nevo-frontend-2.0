import { describe, expect, it } from "vitest";
import { defaultYearGroupLabel } from "@/lib/constants/yearGroups";
import {
  PRESETS,
  labelsForPreset,
  presetFor,
  presetMap,
} from "./taxonomy";

/**
 * A shifted preset is not a cosmetic difference: it labelled a Year 1 class
 * "Year 2" on every screen in the product, including the ones a parent sees.
 */

describe("the preset maps", () => {
  it("place P1 at Year 1, as SCRUM-99 states outright", () => {
    // "P1 shows as Year 1" is the spec's own example copy. The map that
    // shipped had p1 as "Year 2".
    expect(presetMap("british")!.p1).toBe("Year 1");
    expect(presetMap("british")!.kg1).toBe("Reception 1");
    expect(presetMap("british")!.kg2).toBe("Reception 2");
  });

  it("run to the end of the enum without falling off", () => {
    const british = presetMap("british")!;
    expect(british.jss1).toBe("Year 7");
    expect(british.ss1).toBe("Year 10");
    expect(british.ss3).toBe("Year 12");
  });

  it("carry the American map the frame draws, Kindergarten A and B included", () => {
    const american = presetMap("american")!;
    expect(american.kg1).toBe("Kindergarten A");
    expect(american.kg2).toBe("Kindergarten B");
    expect(american.p1).toBe("Grade 1");
    expect(american.ss3).toBe("Grade 12");
  });

  it("include IB, which was missing entirely", () => {
    const ib = presetMap("ib")!;
    expect(ib.n1).toBe("PYP 1");
    expect(ib.p1).toBe("PYP 5");
    expect(ib.jss1).toBe("MYP 1");
    expect(ib.ss1).toBe("DP 1");
  });

  it("leave the canonical names alone for Nigerian", () => {
    expect(presetMap("nigerian")).toBeNull();
    expect(labelsForPreset("nigerian")).toEqual({});
  });
});

describe("the preset cards", () => {
  it("offer all four SCRUM-99 names", () => {
    expect(PRESETS.map((p) => p.id)).toEqual([
      "nigerian",
      "british",
      "american",
      "ib",
    ]);
  });

  it("show mappings rather than a list of names", () => {
    // "Each shows three example mappings so the choice is legible without
    // committing ('P1 shows as Year 1')." The cards showed four bare names
    // with nothing saying which level each renames.
    const british = PRESETS.find((p) => p.id === "british")!;
    expect(british.examples[0]).toBe(
      `${defaultYearGroupLabel("p1")} shows as Year 1`,
    );
    for (const p of PRESETS) {
      expect(p.examples).toHaveLength(3);
      for (const e of p.examples) expect(e).toMatch(/ shows as /);
    }
  });
});

describe("presetFor", () => {
  it("reads the labels, never a stored claim", () => {
    expect(presetFor({})).toBe("nigerian");
    expect(presetFor(labelsForPreset("british"))).toBe("british");
    expect(presetFor(labelsForPreset("american"))).toBe("american");
    expect(presetFor(labelsForPreset("ib"))).toBe("ib");
  });

  it("becomes custom the moment one label is hand-edited", () => {
    // SCRUM-99's done-criterion: "Editing a label moves the preset to Custom
    // rather than lying." The card went on saying "British" over labels that
    // were no longer British.
    const edited = { ...labelsForPreset("british"), p1: "Primary One" };
    expect(presetFor(edited)).toBe("custom");
  });

  it("is custom for a partial map that matches nothing", () => {
    expect(presetFor({ ss3: "Upper Sixth" })).toBe("custom");
  });

  it("is nigerian for a map that only restates the defaults", () => {
    // Storing "P1" as the label for p1 changes nothing, so the school is still
    // on the canonical naming and the card should say so.
    expect(presetFor({ p1: defaultYearGroupLabel("p1") })).toBe("nigerian");
  });
});
