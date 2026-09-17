# Nevo: Frontend Build Document

Version 3.0 · Olayinka · Companion to the Shared Cognitive Architecture

Read the shared document first. This one assumes it.

# Page one: your job in one page

You build a rendering engine, not an adaptive one.

The frontend does three things and nothing else. It captures what the child does with millisecond precision and sends it up. It asks the engine what to render. It renders exactly that.

It computes no scores. It sets no thresholds. It infers no state. It decides no adaptation. When the engine sends nothing, that absence is the instruction, and you render the state that corresponds to nothing rather than filling the gap.

Everything a child experiences as intelligence arrives as a payload. Your job is to apply it so smoothly that the child never notices anything was applied.

# 1. The contract

One endpoint for state. You do not talk to six engines.

GET /api/session/state/:student_id

Called at session start and after every interaction event. Returns one payload:

{  "next_content": { "concept_id": "uuid", "difficulty": 0.0 },  "scaffold_level": 0,  "affective_intervention": "no_action",  "accommodation_overrides": {    "font_scale": 1.0,    "line_height": 1.0,    "contrast_mode": "standard | soft",    "segment_length": "full | short",    "numerical_display": "abstract | visual | concrete"  },  "review_queue": [ { "concept_id": "uuid", "priority": 0.0 } ],  "module_position": { "current_module": 1, "total_modules": 4, "current_segment": 2 }}

affective_intervention is one of: no_action, modulate_density, offer_hint, offer_break, show_socratic_panel, increase_difficulty.

You apply this payload. You do not evaluate it, second-guess it, or supplement it.

# 2. Signal collection

This is the half of your job the child never sees and the whole engine depends on.

Every interaction event carries:

- Timestamp from performance.now(). Not Date.now(). Clock skew across devices would corrupt every latency measurement in the system, and latency is the primary signal for three of the four affective states.
- Event type: tap, swipe, text_input, audio_play, audio_pause, navigation, idle
- Target element: which component was touched
- Response data: selected answer, step input
- Coordinates: x and y of the tap
- Dwell: time since last interaction
Batch and send every 5 seconds, or on interaction completion, whichever comes first.

## Why the precision matters

Frustration is inferred partly from erratic tap coordinates. Confusion is inferred partly from dwell time without progress. Anxiety is inferred partly from shrinking tap precision.

If your coordinates are rounded, your timestamps are server-derived, or your idle periods are approximated, the engine is inferring emotional state from noise. It will fire interventions at children who were concentrating and miss children who were struggling.

There is no way for the engine to recover precision you did not send.

# 3. Onboarding

One activity shell. Four content variant sets loaded by age band. The architecture does not fork.

The interaction patterns are shared: tap grid cells in reverse sequence, match icons, verify sentences, compare dot arrays. What changes by band is presentation, meaning icon sets, grid sizes, text complexity and tap target sizes. Not structure.

Flow: profiling intro, four modules, stretch interstitial, completion screen reading “Nevo is ready for you.”

## What you capture

Every tap timestamp using performance.now(), tap coordinates, response sequence, module completion time. Raw, unprocessed, sent up.

You compute nothing. Not a span score, not a reaction time median, not a Weber fraction, not an accuracy rate. The moment the frontend computes a cognitive parameter, that parameter exists in two places with two implementations, and they will diverge.

## The motor baseline is not optional

A short motor-screening step precedes the speeded task. It captures the child’s raw touchscreen tap latency so the engine can subtract interface latency from cognitive latency.

If this is skipped, degraded, or its data is not transmitted cleanly, then every child unfamiliar with touchscreens is measured as cognitively slow. That is not a minor accuracy issue. It is the product systematically penalising children from lower-income homes, and it would be invisible in testing because your test devices are familiar to you.

## Fixed UI constraints

- No skip button
- No back button
- No visible timer or countdown
- No attempt counter
- No right or wrong feedback during tasks
- A wrong tap gets a gentle violet nudge, never red
- The words “test”, “score” and “ability” never appear
- No results screen is ever shown to the child
- A filled four-segment quest map is the only progress indicator
These are not stylistic. A visible timer changes measured processing speed. Right-or-wrong feedback changes subsequent responses. A results screen turns a configuration exercise into a judgement about the child.

# 4. Rendering each mechanic

## Mastery

Nothing to render directly. You send interaction events and receive next_content. You do not compute, display, or reason about mastery probability.

## Scaffold indicator

Four small circles, top-right of the lesson player. Fill the number you receive in scaffold_level, 0 to 4.

No animation on change. No sound. No tooltip. No label. It should feel ambient rather than announced, because a child who notices the scaffold indicator moving has been told something about themselves.

The child cannot control it. There is no interaction on this component.

## Affective interventions

You receive an instruction and apply it as a change to the active screen. You never decide which state is active.

| Instruction | What you render |
|---|---|
| no_action | Nothing changes |
| modulate_density | Secondary UI to 40% opacity, transitions slow, gentler copy variants |
| increase_difficulty | “Ready for something harder?” pill, scaffold withdraws |
| offer_hint | Hint overlay, unrequested |
| offer_break | Calm break screen |
| show_socratic_panel | Socratic panel with guided questions |

Transitions must be smooth. The density change on anxiety is meant to be felt rather than seen. If the interface visibly snaps into a different mode, the child learns that something about them triggered it, and the whole premise of silent adaptation collapses.

## UDL accommodations

Fetch at session load. Apply as CSS custom properties and layout configuration before the first lesson screen renders.

There is no warm-up, no inference delay, and no un-adapted first screen. The child’s first ever lesson is already shaped for them.

- font_scale and line_height: reading accommodations
- segment_length: short: attention accommodations, sub-segments with tap-to-continue and pause screens
- numerical_display: abstract, visual meaning grouped dots and filled bars, or concrete
On numerical display: abstract notation is always kept alongside the visual, never replaced by it. The child needs to build the association. Removing the notation removes the point.

## Module chunking

Module structure arrives in the lesson data, determined at upload time. You do not compute it.

Render the boundary screen between modules and the two-level progress line.

Boundary screens are calm and informational: “Module 2 of 4: Fractions in everyday life.”

No confetti, no points, no streaks, no celebration animation, no sound. The completion state is quiet satisfaction. This is not a preference, it is a decision about what kind of relationship the child has with the product.

## Calculation player

The component receives a sequence of steps, reveals one at a time, provides input targets for the child’s contribution at each step, and assembles the solution progressively.

This is the one place modalities layer rather than switch. Tap-to-build, audio read-aloud of the current step, and the visual equation scaffold run at the same time.

Backend supplies structure: kind, parts, rows. You render the manipulative. Do not substitute a static scaffold image, because the interaction is the mechanism.

## Review mode

Separate mode in the lesson player. Load the queue, present items in the order received, send response data after each.

The order is interleaved deliberately. Do not group by concept for visual tidiness. Blocked review feels better and teaches worse.

Completion message: “You strengthened this concept.” Never a grade, never a score, never a percentage.

# 5. Multi-modality, stated precisely

Every segment supports at least two ways in. The switch is between a primary and a secondary rendering of the same segment. The child does not carry a modality.

A suggestion pill offers the other route when the engine says so. The child can take it or not. Nothing about that choice is stored as a preference or a type.

The concept, the objective, the curriculum and the assessment are identical across routes. Only the presentation differs.

There is no modality field. If one exists in the build, it must be removed. See section 1 of the shared document for why this is the most serious category of bug in this product.

# 5b. Three lessons, from your side of the wire

## Amara’s fourth minute

She slows on a dense paragraph. Latency climbs.

What you do: nothing. You have already sent the tap timestamps, the coordinates and the dwell duration. You called the state endpoint after her last interaction and it returned affective_intervention: "no_action".

What you must not do: notice that she has been idle a while and surface something helpful. You have no idea that her reading baseline predicts exactly this, that her motor baseline changes what her latency means, or that no second signal corroborates. The engine knows all three. You know none of them.

A frontend that helps here interrupts a child who was concentrating.

## Tunde’s eleven-second pause

Confusion signals fire. The engine opens a grace window, shortened for his profile, and you are told nothing because nothing has been decided yet.

At second 38 the payload comes back with show_socratic_panel. You render it.

The timing was never yours. No local timer, no client-side idle threshold, no “he has been stuck a while so let’s show the hint.” Every one of those would fire at the wrong moment for every child whose baseline differs from the one you had in mind while writing it.

## Chidinma’s boredom

Payload returns scaffold_level: 0 and affective_intervention: "increase_difficulty".

You withdraw the scaffold circles and render the pill. She taps it, which is an interaction event like any other, and you send it up.

You do not decide she is advanced, remember it, or render her lesson differently next time. The next session’s payload tells you what to do next session.

# 6. What you must never do

Never compute a threshold. Not from row counts, not from dates, not from array lengths, not from how much data looks like enough. If the engine did not tell you, you do not know.

Never interpolate a value into a sentence where its absence changes the meaning. Values that may be null render as separate elements that disappear when absent. This is how the null-times bug happened and how it stays fixed.

Never infer a state the engine did not send. No client-side frustration detection, no local confusion timers, no guessing at affect from what you can see in the DOM.

Never derive structure by parsing prose. If a narrative string needs a concept and a student name marked separately, the response carries those spans or the emphasis drops. Finding them by parsing is inventing structure the engine did not send.

Never write copy that characterises a child. “Amara has been finishing lessons she starts” is a product observation. “Amara struggles with retention” is a finding you have no grounds for. When in doubt, describe what the software did rather than what the child is.

Never use a gendered pronoun in generated copy. No pronoun is stored for any child and there is no field that could make it right. The build test catches this.

Never fill a gap because the design needs something there. Raise it. Changing the contract is correct. Guessing well is not.

# 7. When the contract does not match the design

This will keep happening, and how you handle it decides whether the build stays honest.

The order is: check what the deployed contract actually returns, put it next to what the frame draws, and if they differ, say so before building either one.

Three outcomes are legitimate. The contract changes to carry what the design needs. The design drops what the contract cannot support. Or the design ships in a reduced form now with the richer version filed.

One outcome is not legitimate, which is the frontend synthesising the difference.

If a condition is attached to a ruling and the condition is something you can verify, verify it and act. That is what conditions are for.

# 8. The ten rules

- No learner types, modality categories, or learning styles. Anywhere.
- No diagnostic label rendered, stored, or implied.
- Compute no scores, parameters, or thresholds.
- performance.now(), never Date.now().
- Absence is an instruction. Render the nothing-state, do not fill the gap.
- Accommodations applied before the first screen renders, never after.
- Adaptation transitions are felt, not seen.
- No reward mechanics of any kind.
- Never a score, grade or percentage shown to a child.
- When contract and design disagree, raise it before building.
Nevo Learning Limited, RC 9507736.
