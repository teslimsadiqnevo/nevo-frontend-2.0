# Epic — Student Daily Experience (Product Arch B.4–B.11)

The "build the student's daily experience screens" ticket is an **epic**, not a
single story: six screens + sidebar nav + a detailed preference display. This
splits it into buildable, reviewable stories, with scope decisions and data
dependencies flagged up front.

All screens have design frames (`nevo-design-outputs/student/19–27`), reuse the
existing shared components (`Sidebar`, `TopNav`, `BottomNav`, `EmptyState`,
`Card`, `Pill`, `ProgressBar`, …), and build **to mocks** — real data is a
backend swap when the contracts land.

---

## Decide before starting (blocks scoping)

1. **Subject Detail (frame 23) — in or out?** A designed drill-down from
   Progress/Lessons into one subject. The ticket names Progress + Lessons but not
   this. → Story 6 assumes **in**; drop it if out.
2. **Downloads = real caching or UI shell?** "Lightweight connectivity caching"
   reads as *actual* offline caching (Service Worker / Cache API), which is a
   distinct, meatier task that interacts with the existing `OfflineBanner`. If
   it's just showing which lessons are cached, it's a normal screen. → Story 7
   is written both ways; pick one.
3. **Accessibility settings depth.** Reduced Motion / Font Scaling / High
   Contrast in Profile are **not simple toggles** — each needs global wiring, and
   Font Scaling conflicts with the current fixed-`px` type (would need an `rem`
   pass or a zoom mechanism). → Split out as Story 9; sized separately.
4. **Channel/confidence data shape.** The four-channel preference display (Story
   8b) has **no type to build against** — there's no `LearnerProfile` / channel /
   confidence model in the codebase yet. Define a mock shape first (real one is a
   backend/Intelligence-Framework contract).
5. **Ask Nevo (frame 26)** — assumed **out** of this epic (separate assistant
   feature). Confirm it's intentionally excluded.

---

## Stories

### 1 · Foundation — logged-in shell + sidebar nav  **[prereq for all]**
- **Scope:** the student logged-in layout: left `Sidebar` (already built) wired
  to the tab routes, active state, responsive (sidebar → `BottomNav` on mobile),
  and a shared mock data layer (`lib/mocks`) the screens read from.
- **Data:** mock now.
- **Acceptance:** navigating between all tabs works with the sidebar; mobile
  falls back to bottom nav; no screen is a raw placeholder.

### 2 · Home Dashboard  **(frame 19)**
- **Scope:** "Continue where you left off" (primary), today's assigned lessons
  (secondary), calm progress indicator (tertiary — never a %), illustrated empty
  state.
- **Data:** mock now → backend later (in-progress lesson + assignments).
- **Acceptance:** the three tiers render in priority order; empty state shows when
  no lessons; "Continue" routes into the lesson player.

### 3 · Lessons Tab  **(frame 20)**
- **Scope:** subject-organized list, adaptive time estimates per lesson, empty
  state. This is the screen the player's "Back to lessons" already routes to.
- **Data:** mock now → backend later (lesson list + adaptive estimates).
- **Acceptance:** lessons grouped by subject; each shows an adaptive time
  estimate; empty state present; tapping a lesson opens the preview (Story 4).

### 4 · Lesson Preview Sheet  **(frame 21)**
- **Scope:** the preview surface (bottom sheet) before entering a lesson —
  summary, estimate, start action. Reuses the Nevo-skinned `ui/sheet`.
- **Data:** mock now.
- **Acceptance:** opens from Lessons/Home; "Start" enters the player; dismiss
  returns to the list.

### 5 · Progress Tab  **(frame 22)**
- **Scope:** plain-language growth framing. **Never** percentile, score, or
  peer-comparison (constitution). Illustrated empty state.
- **Data:** mock now → backend later (growth/progress data).
- **Acceptance:** growth shown in words/concepts, not numbers; no
  percentile/peer language anywhere; empty state present.

### 6 · Subject Detail  **(frame 23)** — *gated on Decision #1*
- **Scope:** drill-down into a single subject — its lessons and growth. Reached
  from Progress and/or Lessons.
- **Data:** mock now.
- **Acceptance:** opens from a subject; lists that subject's lessons + growth; no
  numeric scoring.

### 7 · Downloads Tab  **(frame 24)** — *gated on Decision #2*
- **Scope (UI-shell reading):** list of downloadable/downloaded lessons with
  status, manage/remove.
- **Scope (real-caching reading):** the above **plus** actual offline caching
  (Service Worker / Cache API), storage/quota handling, and integration with the
  existing `OfflineBanner` / offline lesson serving. Sized much larger.
- **Data:** local (caching is a frontend capability, not backend-blocked).
- **Acceptance:** depends on the chosen reading; state before estimating.

### 8 · Connect Tab  **(frame 25)**
- **Scope:** teacher messaging thread; extends to a parent when the teacher adds
  one. UI + compose.
- **Data:** mock now → backend later (real messages, parent-link state).
- **Acceptance:** thread renders; compose works against the mock; parent
  extension shown when present; empty state present.

### 9 · Accessibility settings (global wiring)  **[split from Profile]**
- **Scope:** Reduced Motion (override OS `prefers-reduced-motion` from a Profile
  toggle), Font Scaling (global type scale — needs an `rem`/zoom mechanism; audit
  the current fixed-`px` type), High Contrast (palette variant + wiring). Each is
  a real global feature, not a UI toggle.
- **Data:** local (persisted preference).
- **Acceptance:** each setting visibly changes the whole app and persists;
  Font Scaling doesn't break existing layouts.

### 10 · Profile & Settings  **(frame 27)**
- **Scope:** PIN management (change PIN), the accessibility toggles' UI (behaviour
  in Story 9), and read-only **Learning Preferences** (observed patterns, not
  self-report) — see Story 8b.
- **Data:** mock now → backend later (profile, PIN).
- **Acceptance:** PIN change flow works; settings render; preferences read-only.

### 8b · Four-channel Learning Preferences display  **[sub-story of 10]** — *gated on Decision #4*
- **Scope:** show up to four channel statements, **only** for channels at
  **medium/high** confidence; never low, never null. Zero at threshold → show the
  single line *"Nevo learns how you learn best over time."* Copy is **fixed, use
  exactly as written**:
  - `visual_spatial` → "You tend to understand things better when you can see how they connect"
  - `auditory` → "Hearing explanations tends to work well for you"
  - `reading_writing` → "You work well with written explanations"
  - `interactive_kinesthetic` → "You learn well by trying things out"
- **Data:** needs a mock channel-confidence shape now (Decision #4); real data
  from the profile/intelligence contract later.
- **Acceptance:** 0 channels → the fallback line only; 1–4 medium/high → those
  exact statements, nothing for low/null; max 4 simultaneously. (This spec is
  precise and directly testable.)

---

## Suggested order

**1 (foundation) → 2 (Home) → 3+4 (Lessons + Preview) → 5 (Progress) → 10+8b
(Profile + preferences) → 6 (Subject Detail, if in) → 7 (Downloads) → 9
(accessibility) → 8 (Connect).**

Rationale: foundation unblocks everything; Home + Lessons close the open loop
(the player already routes to a placeholder `/student/lessons`); the four-channel
display is high-value and precisely specced; Downloads (caching) and accessibility
are the heaviest/most-uncertain, so they come after the decisions land.

## Cross-cutting: real data is backend

"Continue where you left off," adaptive time estimates, growth data, messages,
and channel confidence are all **backend-provided** — built to mocks here, swapped
when the contracts exist (tracked in `blocked-items-handoff.md`). The screens
themselves are not backend-blocked.
