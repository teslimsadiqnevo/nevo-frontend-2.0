<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nevo-architecture -->
# Nevo: the architecture you are building to

Authoritative, and it supersedes anything older including `docs/architecture.md`:

- `docs/architecture/cognitive-architecture-shared.md` — what the product is and why. v3.0.
- `docs/architecture/frontend-architecture.md` — what this codebase is allowed to do. v3.0.

**The division of labour is absolute. The engine decides. The frontend renders.**
You build a rendering engine, not an adaptive one. Everything a child experiences
as intelligence arrives as a payload. Absence of a payload is an instruction:
render the state that corresponds to nothing, never fill the gap.

## The ten rules

1. No learner types, modality categories, or learning styles. Anywhere.
2. No diagnostic label rendered, stored, or implied.
3. Compute no scores, parameters, or thresholds.
4. `performance.now()`, never `Date.now()` — for anything timed and sent to the engine.
5. Absence is an instruction. Render the nothing-state, do not fill the gap.
6. Accommodations applied before the first screen renders, never after.
7. Adaptation transitions are felt, not seen.
8. No reward mechanics of any kind.
9. Never a score, grade or percentage shown to a child.
10. When contract and design disagree, raise it before building.

Rule 1 is the one that has already been breached once and would do the most
damage. A stored modality makes our NDPA filings inaccurate and puts the product
on the meshing hypothesis, which is the most thoroughly disproven idea in
education science. Segment-level modality *switching* is correct and expected.
A modality stored *on a child* is the bug. See shared doc §1.

## Read before you build

| Touching | Read first |
|---|---|
| `student/Lesson/**` | frontend §4 (rendering each mechanic), §5 (multi-modality) |
| `student/Onboarding/**` | frontend §3, shared §3 — incl. the motor baseline, which is not optional |
| `hooks/useSignals`, any event capture | frontend §2 — precision you do not send cannot be recovered |
| anything affective, hints, breaks, Socratic | frontend §4, shared §4 mechanic 3 — incl. productive confusion |
| teacher/parent-facing copy about a child | shared §1 (Zero-Tag), frontend §6 |
| any number shown to anyone | shared §9 — a floor is a target, never a result |

## When the contract does not match the design

Check what the deployed contract returns, put it next to what the frame draws,
and if they differ **say so before building either one**. Three outcomes are
legitimate: the contract changes, the design drops what the contract cannot
support, or the design ships reduced with the richer version filed. The frontend
synthesising the difference is not one of them.

Run `npm run architecture` before you commit. It checks what is mechanically
checkable; it is a safety net under correct construction, not a substitute.
<!-- END:nevo-architecture -->
