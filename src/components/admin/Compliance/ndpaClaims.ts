/**
 * The NDPA 2023 claims D22 turns into evidence a SENCo can stand behind, and
 * the zero-labels claim itself, which two screens state and neither owned.
 *
 * THE CLAIM IS A FUNCTION OF THE COUNT. `diagnosticLabelsStored` is a live
 * query - design's own build rules are explicit that it must be ("it must
 * always be true, not cosmetic", Handoff - Backend; "a real query, not a
 * constant: it must reflect the store so the claim stays true", SCRUM-39) -
 * and the prose beneath it used to be static on both surfaces:
 *
 *     44px  {audit.diagnosticLabelsStored}   diagnostic labels stored
 *           "Nevo has never assigned or recorded a diagnostic category for
 *            any learner in this school."
 *
 * At a count of 7 the audit screen contradicted itself in adjacent lines, and
 * the Overview card did the same in different words. That is the screen a
 * SENCo hands a regulator. So the copy lives here, once, derived from the
 * count, and both surfaces read it.
 *
 * TWO THINGS THE OLD SENTENCE CLAIMED THAT NOTHING CAN VERIFY:
 *
 * "has never" is historical. The audit is a point-in-time scan with a
 * `generatedAt` - it proves the state of the store when it ran, not the whole
 * past. The wording is now present-tense and tied to the check.
 *
 * "no field exists to record one in" was the mechanism's basis for the claim.
 * If that were strictly so the counter could not return non-zero, and a live
 * counter whose justification is that there is nothing to count is a
 * contradiction whichever way it resolves. The mechanism now describes what
 * the check looked for and what it found.
 *
 * COUNSEL HAS RULED NOTHING HERE. The claim was never put to them - the
 * counsel checklist covers erasure, retention, DPA wording and roster-sync
 * consent, and not this - while every absolute "never" in the legal doc
 * carries "Placeholder wording - final legal text pending counsel". So this
 * file deliberately does not invent a new legal absolute; it states what the
 * scan proves. Final wording is counsel's.
 *
 * The non-zero wording follows the only tone design has set for this state,
 * on the internal ops console: the system owns it, says the data is safe,
 * offers a forward action, and never alarms.
 *
 * Claim states are honest about their own provenance:
 *
 * - `labels` is verified from the live audit and carries the count.
 * - `product` claims describe an architectural property, true of every school.
 * - `unverified` claims need school data no endpoint returns - a consent
 *   count, an erasure request log, a subprocessor register. Those render
 *   their mechanism with no state chip rather than a number we cannot stand
 *   behind, which on this screen of all screens would be the worst thing to
 *   invent.
 *
 * TODO(api): consent coverage as a count, erasure requests in progress, a
 * subprocessor count, and a retention position - the four states this screen
 * cannot currently verify.
 * TODO(design): the non-zero rendering is drawn nowhere school-facing. Wording
 * below is built to the ops breach tone; design and counsel both to confirm.
 */

export type ClaimVerification = "labels" | "product" | "unverified";

export interface NdpaClaim {
  title: string;
  /** Only used when verification is "product". */
  state?: string;
  mechanism: string;
  evidence: string;
  verification: ClaimVerification;
}

export interface LabelHero {
  /** The word beside the numeral. The numeral itself is the live count. */
  unit: string;
  body: string;
  /** True only when the check found none. Never styling - wording only. */
  clear: boolean;
}

/**
 * The hero claim, for the surface asking.
 *
 * Design fixes the zero state hard: it is "the expected reading forever", it
 * "must not look like missing data", the numeral stays navy and is never
 * muted, and the tone is "a statement of fact, not a boast - no 'compliant',
 * no 'certified', no percentage". So zero keeps design's approved framing and
 * loses only the two unverifiable claims described at the top of this file.
 */
export function labelHero(
  count: number,
  surface: "audit" | "overview",
): LabelHero {
  const clear = count === 0;
  const unit =
    surface === "audit" ? "diagnostic labels stored" : "Diagnostic labels stored";

  if (surface === "audit") {
    return {
      unit,
      clear,
      body: clear
        ? "Not zero shown – zero stored. This school’s records hold no diagnostic category and no clinical label for any learner, as of the check above. This is the claim every other item below exists to protect."
        : `The last check found ${count} where there should be none. Nothing has been shared outside your school and no learner has been told anything. Your data officer should have these cleared – until the count is zero, this claim does not hold.`,
    };
  }

  return {
    unit,
    clear,
    body: clear
      ? "Nevo adapts to how each student is learning right now. It records no diagnosis and no label, and the last check found nothing of that kind held about your students."
      : `Nevo is built to record no diagnosis and no label. The last check found ${count} that need looking at. Your data is safe; your data officer should review them.`,
  };
}

/** The claims table. Only the labels row moves with the audit. */
export function ndpaClaims(count: number): NdpaClaim[] {
  return [
    {
      title: "Ephemeral processing",
      state: "Active",
      mechanism:
        "Raw learning signals are used in the moment to adapt the lesson, then discarded. Nothing about how a learner performed is written to long-term storage.",
      evidence: "Processing logs, retention schedule",
      verification: "product",
    },
    {
      // The plain form, which the v1 Build Lock settles on: "the plain
      // 'Diagnostic labels stored: 0' fact. The plain form wins going
      // forward." The old title began with the word "Zero", so at a count of
      // 3 the row read "Zero diagnostic labels stored - Needs review".
      title: "Diagnostic labels stored",
      mechanism:
        count === 0
          ? "The check reads every field in which a diagnostic category or clinical label could sit, and found none. Adaptations reference behaviour in the moment only, so there is nothing of that kind to export or to subpoena."
          : `The check reads every field in which a diagnostic category or clinical label could sit. It found ${count}. Each is recorded as a location in the store rather than as text, and none is shown on this screen.`,
      evidence: "Data-model audit, schema review",
      verification: "labels",
    },
    {
      title: "Parental consent coverage",
      mechanism:
        "Every enrolled learner has a recorded parental consent before any processing begins. Coverage is shown as a count for the school; individual consent records live with the parent and the SENCo, not here.",
      evidence: "Consent register (count only)",
      verification: "unverified",
    },
    {
      title: "Data-flow transparency",
      state: "Documented",
      mechanism:
        "Where each category of data originates, how it moves and where it rests is documented and available to your data officer. No learning data leaves the processing boundary.",
      evidence: "Data-flow map, DPA schedule 2",
      verification: "product",
    },
    {
      // Was `state: "Within limits"` - a per-school verdict rendered as a
      // verified-looking chip with no measurement anywhere behind it, which
      // is exactly what this file's own rule sends to `unverified`. Whether
      // THIS school's records sit within the retention period is not an
      // architectural property, and no endpoint reports it.
      title: "Retention within counsel limits",
      mechanism:
        "Account and enrolment records are kept only for the period set with counsel; nothing is retained beyond it. Learning signals, being ephemeral, have no retention period at all.",
      evidence: "Retention policy, deletion jobs",
      verification: "unverified",
    },
    {
      title: "Right to erasure",
      mechanism:
        "A parent or guardian can request erasure of their child’s account data at any time; requests are actioned within the window agreed with counsel.",
      evidence: "Erasure request log",
      verification: "unverified",
    },
    {
      title: "Subprocessors",
      mechanism:
        "Every third party that touches school data is named, with its role and location, in the subprocessor list attached to your DPA. Adding one requires notice under the same agreement.",
      evidence: "Subprocessor register",
      verification: "unverified",
    },
  ];
}
