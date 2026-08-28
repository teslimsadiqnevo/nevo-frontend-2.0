/**
 * The NDPA 2023 claims D22 turns into evidence a SENCo can stand behind.
 *
 * Each claim's `mechanism` and `evidence` are statements about how Nevo is
 * built - true of every school, and safe to state without asking the API. The
 * `state` is the verification, and that is where they differ:
 *
 * - `labels` is verified from the live audit: `diagnosticLabelsStored`.
 * - `product` claims describe an architectural property. "There is no field to
 *   record a diagnosis in" is not a per-school measurement.
 * - `unverified` claims need school data no endpoint returns - a consent count,
 *   an erasure request log, a subprocessor register. Those render their
 *   mechanism with no state chip rather than a number we cannot stand behind,
 *   which on this screen of all screens would be the worst thing to invent.
 *
 * TODO(api): consent coverage as a count, erasure requests in progress, and a
 * subprocessor count - the three states this screen cannot currently verify.
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

export const NDPA_CLAIMS: NdpaClaim[] = [
  {
    title: "Ephemeral processing",
    state: "Active",
    mechanism:
      "Raw learning signals are used in the moment to adapt the lesson, then discarded. Nothing about how a learner performed is written to long-term storage.",
    evidence: "Processing logs, retention schedule",
    verification: "product",
  },
  {
    title: "Zero diagnostic labels stored",
    mechanism:
      "The system has no field in which to record a diagnostic category or clinical label, so none can be created, exported or subpoenaed. Adaptations reference behaviour in the moment only.",
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
    title: "Retention within counsel limits",
    state: "Within limits",
    mechanism:
      "Account and enrolment records are kept only for the period set with counsel; nothing is retained beyond it. Learning signals, being ephemeral, have no retention period at all.",
    evidence: "Retention policy, deletion jobs",
    verification: "product",
  },
  {
    title: "Right to erasure",
    mechanism:
      "A parent or guardian can request erasure of their child's account data at any time; requests are actioned within the window agreed with counsel.",
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
