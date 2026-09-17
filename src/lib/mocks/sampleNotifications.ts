import type { NotificationItem } from "@/context/NotificationContext";

/**
 * The bell's sample rows for the signed-out designed screens. EMPTY, and it
 * stays empty.
 *
 * This held two invented items. The second was *"Ms Okafor sent you a message
 * - Lovely work on your fractions today"*: a fabricated message attributed to a
 * named teacher, praising work the child may never have done. A child could
 * have thanked her for a message she never sent.
 *
 * WHICH RULE, because it was nearly triaged against the wrong checklist.
 * Not Zero-Tag - that is diagnostic labels, learner types and modality
 * categories, and praise is none of those. Rule 5: *"Absence is an instruction.
 * Render the nothing-state, do not fill the gap."* There was no payload, so we
 * invented one. An empty bell is merely quiet, and quiet is what having no
 * notifications actually looks like.
 *
 * IN ITS OWN FILE, NAMED `sample`, on purpose. The repo-wide sweep for leaked
 * fixtures grepped for "sample" and "fixture" and missed this entirely,
 * because it lived inside the context as `MOCK_NOTIFICATIONS`.
 *
 * ANYTHING PUT BACK HERE needs `SampleRegion` at the render site, or the
 * end-to-end sweep cannot see it - `NotificationBell` carries no mark today,
 * and `StudentShell` mounts the bell outside both `MaybeSample` wrappers, which
 * is why this survived one. The hydration guard in the provider is what stops
 * whatever lands here from reaching a signed-in child in the meantime.
 */
export const SAMPLE_NOTIFICATIONS: NotificationItem[] = [];
