import { YEAR_GROUPS, defaultYearGroupLabel, type YearGroup } from "@/lib/constants/yearGroups";

/**
 * D12.4's year-group taxonomy: what a school's canonical levels are called on
 * its own screens.
 *
 * SIXTEEN, NOT SEVENTEEN. Both SCRUM-40 and SCRUM-99 say "17 canonical
 * Nigerian levels" in prose and then enumerate sixteen - n1, n2, kg1, kg2,
 * p1-p6, jss1-jss3, ss1-ss3 - and the frame's own `enums` array is sixteen
 * long. `YEAR_GROUPS` follows the list rather than the sentence, and so does
 * everything here; the count in the prose is a slip in the spec.
 *
 * THE ENUM NEVER CHANGES AND NOTHING SORTS ON A LABEL. That is the whole point
 * of the design - a British school reads "Year 1" and an IB school reads
 * "PYP 5" while cross-school comparison stays intact - and it is why only the
 * label map is ever written.
 *
 * THE MAPS HERE ARE THE FRAME'S, COPIED IN ENUM ORDER. The two that shipped
 * were shifted a level against it: British had `kg1` as "Reception" and `p1`
 * as "Year 2", where D12b's own `presetMaps` put `kg1` at "Reception 1" and
 * `p1` at "Year 1" - and SCRUM-99 states the mapping outright in its example
 * copy, "P1 shows as Year 1". A shifted map is not a cosmetic difference: a
 * Year 1 class was labelled Year 2 on every screen in the product, including
 * the ones a parent sees.
 *
 * CUSTOM IS A REAL PRESET, not the absence of one. SCRUM-99's done-criterion:
 * "Editing a label moves the preset to Custom rather than lying." The enum it
 * names is `nigerian|british|american|ib|custom`, and the screen offered three
 * cards with no way to stop one of them claiming a school's hand-edited
 * labels.
 */

export const PRESET_IDS = [
  "nigerian",
  "british",
  "american",
  "ib",
  "custom",
] as const;
export type PresetId = (typeof PRESET_IDS)[number];

/** In enum order: n1 n2 kg1 kg2 p1-p6 jss1-jss3 ss1-ss3. */
const ORDERED: YearGroup[] = [
  "n1", "n2", "kg1", "kg2",
  "p1", "p2", "p3", "p4", "p5", "p6",
  "jss1", "jss2", "jss3",
  "ss1", "ss2", "ss3",
];

function mapOf(names: string[]): Record<YearGroup, string> {
  const out = {} as Record<YearGroup, string>;
  ORDERED.forEach((yg, i) => {
    out[yg] = names[i];
  });
  return out;
}

/** D12b `presetMaps.British`, verbatim and in order. */
const BRITISH = mapOf([
  "Nursery 1", "Nursery 2", "Reception 1", "Reception 2",
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Year 7", "Year 8", "Year 9",
  "Year 10", "Year 11", "Year 12",
]);

/** D12b `presetMaps.American`. Note "Kindergarten A/B", not "Kindergarten". */
const AMERICAN = mapOf([
  "Pre-K 1", "Pre-K 2", "Kindergarten A", "Kindergarten B",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9",
  "Grade 10", "Grade 11", "Grade 12",
]);

/** D12b `presetMaps.IB`. */
const IB = mapOf([
  "PYP 1", "PYP 2", "PYP 3", "PYP 4",
  "PYP 5", "PYP 6", "PYP 7", "PYP 8", "PYP 9", "PYP 10",
  "MYP 1", "MYP 2", "MYP 3",
  "DP 1", "DP 2", "DP 3",
]);

export interface Preset {
  id: PresetId;
  name: string;
  /**
   * Three MAPPINGS, not a list of names. SCRUM-99: "Each shows three example
   * mappings so the choice is legible without committing ('P1 shows as Year
   * 1')." The cards showed "Nursery · Year 5 · Year 8 · Year 10" - four names
   * with nothing saying which canonical level each one renames, which is the
   * only thing a head teacher is trying to work out.
   */
  examples: string[];
}

function examplesFor(id: Exclude<PresetId, "custom">): string[] {
  const map = presetMap(id);
  const show: YearGroup[] = ["p1", "jss2", "ss1"];
  return show.map(
    (yg) =>
      `${defaultYearGroupLabel(yg)} shows as ${map ? map[yg] : defaultYearGroupLabel(yg)}`,
  );
}

/** Null for `nigerian` (the canonical names) and for `custom` (the school's). */
export function presetMap(id: string): Record<YearGroup, string> | null {
  if (id === "british") return BRITISH;
  if (id === "american") return AMERICAN;
  if (id === "ib") return IB;
  return null;
}

export const PRESETS: Preset[] = [
  { id: "nigerian", name: "Nigerian", examples: examplesFor("nigerian") },
  { id: "british", name: "British", examples: examplesFor("british") },
  { id: "american", name: "American", examples: examplesFor("american") },
  { id: "ib", name: "IB", examples: examplesFor("ib") },
];

/**
 * Only what differs from the canonical default is stored, so a school that
 * goes back to Nigerian has an empty map rather than a full one that happens
 * to match.
 */
export function labelsForPreset(id: PresetId): Record<string, string> {
  const map = presetMap(id);
  if (!map) return {};
  const next: Record<string, string> = {};
  YEAR_GROUPS.forEach((yg) => {
    if (map[yg] !== defaultYearGroupLabel(yg)) next[yg] = map[yg];
  });
  return next;
}

/**
 * Which preset a label map actually IS - never what a stored string claims.
 *
 * The screen kept `taxonomyPreset` as the answer, so a school that renamed one
 * level by hand went on being described as "British" on the card while its
 * labels were no longer British at all. This derives the answer from the
 * labels, which cannot lie, and `custom` is what a map matching nothing is.
 */
export function presetFor(labels: Record<string, string>): PresetId {
  /*
   * Compared on EFFECTIVE labels, not on which keys happen to be present.
   * Only what differs from the canonical default is stored, so a school that
   * has "P1" written out in full against `p1` is still on Nigerian naming -
   * and an earlier draft of this called that school "custom", which is the
   * same shape of lie as the one it exists to stop.
   */
  const effective = (map: Record<string, string>, yg: YearGroup) =>
    map[yg] || defaultYearGroupLabel(yg);
  const matches = (id: Exclude<PresetId, "custom">) => {
    const expected = labelsForPreset(id);
    return YEAR_GROUPS.every(
      (yg) => effective(labels, yg) === effective(expected, yg),
    );
  };
  if (matches("nigerian")) return "nigerian";
  if (matches("british")) return "british";
  if (matches("american")) return "american";
  if (matches("ib")) return "ib";
  return "custom";
}
