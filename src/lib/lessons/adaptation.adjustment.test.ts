import { describe, expect, it } from "vitest";
import { toAdaptationPlan } from "./adaptation";
import { ADJUSTMENT_ACTIONS } from "@/lib/constants/affect";
import type { AdaptResponse } from "@/lib/api/intelligence";
import type { Lesson } from "@/lib/types";

/**
 * THE INSTRUCTION THE ENGINE WAS ALREADY SENDING.
 *
 * `AdaptResponse.proactiveAdjustment` carries an `action` and nothing read it,
 * so every affective intervention in the player was dead for every signed-in
 * child - the components existed and only the authored demo ever reached them.
 *
 * It was recorded as "no affective transport exists" after searching the
 * document for "frustration", "anxiety" and "boredom" and finding nothing.
 * That was the wrong search: frontend §4 says the frontend receives an
 * INSTRUCTION and never knows the state, so the absence of those words is the
 * design working. `action` is the transport.
 *
 * `action` is a bare string with no enum in the deployed schema, so these tests
 * pin the two halves that matter: §4's vocabulary is honoured, and anything
 * else does nothing rather than something.
 */

const lesson = (): Lesson =>
  ({
    id: "l-1",
    title: "Adding fractions",
    segments: [
      { id: "seg-1", modalities: ["text"], text: { heading: "H", body: { default: "B" } } },
    ],
  }) as unknown as Lesson;

const response = (action: string | null): AdaptResponse =>
  ({
    lessonId: "l-1",
    source: "engine",
    segments: [{ segmentId: "seg-1", modality: "text", density: null, scaffolding: "light", priority: 1 }],
    breakSuggestion: null,
    modalitySuggestion: null,
    proactiveAdjustment: action
      ? {
          action,
          reason: "erratic tap coordinates on segment 1",
          confidence: 0.82,
          triggerSignals: ["tap_precision", "dwell"],
        }
      : null,
  }) as unknown as AdaptResponse;

describe("the engine's proactive instruction", () => {
  it("carries each of the six actions section 4 names", () => {
    for (const action of Object.values(ADJUSTMENT_ACTIONS)) {
      const plan = toAdaptationPlan(response(action), lesson());
      expect(plan.adjustment, action).toBe(action);
    }
  });

  it("does nothing with an action it does not recognise", () => {
    // The schema declares a bare string, so a seventh value can arrive any
    // day. Rule 5: absence is an instruction, and so is a word we cannot act
    // on - render the nothing-state rather than guess which screen it meant.
    for (const action of ["escalate_to_teacher", "", "MODULATE_DENSITY", "offer hint"]) {
      const plan = toAdaptationPlan(response(action), lesson());
      expect(plan.adjustment ?? null, action).toBeNull();
    }
  });

  it("carries nothing when the engine sends no adjustment", () => {
    const plan = toAdaptationPlan(response(null), lesson());

    expect(plan.adjustment ?? null).toBeNull();
  });

  it("never carries the reasoning, the confidence or the trigger signals", () => {
    // Frame 38: "the learner is never shown any of this reasoning - no score,
    // no label, no 'you seem frustrated'." `confidence` is an engine parameter
    // besides, which rule 3 keeps off every screen. The safest place to stop
    // them is here, where they are simply not carried across.
    const plan = toAdaptationPlan(
      response(ADJUSTMENT_ACTIONS.MODULATE_DENSITY),
      lesson(),
    );

    const serialised = JSON.stringify(plan);
    expect(serialised).not.toContain("erratic tap");
    expect(serialised).not.toContain("0.82");
    expect(serialised).not.toContain("tap_precision");
  });
});
