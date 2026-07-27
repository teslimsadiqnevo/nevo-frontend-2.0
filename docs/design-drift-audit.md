# Design Drift Audit — mirror re-sync

**Method.** The `nevo-design-outputs` mirror is a git repo. This audit diffs the
export the student app was originally built against (`fb4c40b` "Nevo export 1")
against the freshly-pulled `HEAD` (`4b29faf`), so **every** design change since is
captured — nothing sampled. Scope: `student/` frames that back an already-built
screen. Findings are grouped by how much action they need.

**Headline:** no built screen is *broken* by the re-sync. The large diffs
(Lesson Player +150, Calc +84) are almost entirely the **new intelligence layer**
(affective states, scaffold indicator, UDL) being woven in — new, adaptation-
backend-dependent features, not corrections. The genuinely actionable drift in
built screens is small and listed in **Category B**.

---

## Change taxonomy (how to read the diffs)

Every changed frame falls into one of these. The mirror re-export touched almost
all frames, but most changes are not design changes:

1. **Noise** — a `<!-- HANDOFF LABEL … -->` comment added (the `+1`-line frames).
   No visual change.
2. **Prototype wiring** — `onClick` / `on-nav` / `href` / tap-to-advance handlers
   added so the design canvas is click-through. Not real UI; the app already
   navigates for real.
3. **Real drift** — actual layout / copy / structure / state changes. **Category B.**
4. **New intelligence-layer hooks** woven into built screens — `affectSecDim`,
   `scaffoldDots`, `UDL`. New adaptive behaviour. **Category C.**
5. **Entirely new frames** — new screens/features. **Category D.**

---

## Category A — No action (noise + prototype wiring only)

Diffed and cleared; the built screen already matches, or the change is canvas-only:

- **Lessons Tab** (`Nevo Lessons Frame`) — prototype nav wiring only.
- **Bottom Nav** (`Nevo Bottom Nav`) — `<a href>` + link map for the prototype; the
  app already routes.
- **Downloads** (`Nevo Downloads Frame`) — tap-a-row → spin → done is prototype
  behaviour; our UI shell already shows the cloud→spinner→check states.
- **Home** (`Nevo Home Frame`) — mostly prototype click-through. One real tweak:
  desktop content max-width **760 → 860** + centred (`margin:0 auto`). *Trivial.*
- All `+1`-line frames (Activities 1–4, Consent, The Close, Transition, You're In,
  Onboarding Step 3, etc.) — HANDOFF LABEL comment only.

---

## Category B — Real drift in built screens (actionable)

Small and mostly low-severity. Ordered by suggested priority.

| # | Screen | Drift | Severity |
|---|--------|-------|----------|
| B1 | **Lesson Check / assessment** (`Nevo Lesson Check Frame`) | Copy switched **em dash → hyphen** throughout ("take your time -", "didn't land -", "One idea - the word equation -"). Extends the A10 hyphen convention across the check copy. Our `AfterLessonAssessment` `DEFAULT_RECOVERY` and the lesson mock copy (`resultNote`/`recoveryNote`/`correctNote`) still use em dashes. | Low (copy) |
| B2 | **Profile & Settings** (`Nevo Profile Frame`) | Name is now **inline-editable** (tap name → input → save; initials derive from the name). Plus a new **"Tell us something"** row (a prompt/message affordance). Our Profile has a static name + a `Change` `TODO(account)` stub and no such row. | Medium |
| B3 | **Subject Detail** (`Nevo Subject Detail Frame`) | New **Session Detail bottom sheet** — tapping a timeline session opens a sheet (date / title / note), with a scrim + slide-up. Session data updated. We render the timeline but not the tap-to-open sheet. | Medium |
| B4 | **Connect** (`Nevo Connect Frame`) | A **second conversation** (Mr Bell) + active-thread name binding — we already do multi-thread, so mostly parity. New: the message composer now shows the **Nevo Keyboard** (`kb`) on focus (A12 extended into Connect). | Low–Med |
| B5 | **Sidebar Rail** (`Nevo Sidebar Rail`) | Nav rows gained an explicit **active tint** `rgba(59,63,110,0.08)` + **hover tint** `0.05` + `transition:background 130ms`. Worth confirming our sidebar matches. | Low (polish) |
| B6 | **Lesson Summary** (`Nevo Post-Lesson Frame`) | Already reconciled in the A5 work: added "FROM THE CHECK-IN" section + swapped ghost button "Home" → "Review answers". ✅ *(no further action)* |

---

## Category C — New intelligence-layer hooks in built screens (backend-dependent)

These are the bulk of the big diffs on the **Lesson Player** (+150) and **Calc
Solver** (+84). They are new adaptive behaviour, not fixes — and all depend on the
intelligence/adaptation backend (**B2** in the blocked-items handoff), so they are
not buildable-to-completion now:

- **Affective dimming** — the player header/secondary chrome dims
  (`opacity:{{ affectSecDim }}; transition 400ms`) based on detected affective
  state (frame **37b Affective States**).
- **Scaffold indicator** — `scaffoldDots` on the player and calc show how much
  scaffolding the system is providing (frame **37a Scaffold Indicator**).
- **UDL accommodations** — e.g. calc gains "PICTURE IT · UDL: NUMBERS MADE VISUAL"
  / "Build the total — tap a quarter to drop it in." (frame **37c**). Overlaps our
  existing kinesthetic "build it" tray, but is framed as a system-chosen UDL swap.
- **Affective nudges** — calm mid-lesson nudges.

**Recommendation:** track these with the intelligence layer (Category D / B2), not
as drift. When the adaptation contract lands, they build against these frames.

---

## Category D — Entirely new frames (new scope, nothing to reconcile)

Net-new design added in this export; no existing build to diff against. These are
new features/screens, most gated on the intelligence/adaptation backend:

- **37 Intelligence Layer**, **37a Scaffold Indicator**, **37b Affective States**,
  **37c UDL Accommodations**, **37d Review Session**, **38 Adaptation Loop** —
  the adaptive-learning surface. Backend-dependent (B2).
- **Nevo Autopilot Demo**, **Nevo Feedback**, **Nevo Adaptation Loop** — supporting
  demos/patterns.
- **Nevo Rotate Prompt** — a landscape/orientation prompt overlay. *Buildable now*
  (pure frontend) if desired.
- **Nevo Progress Frame** — Progress refactored into its own component frame; the
  numbered `22 Progress Tab` did not re-point its import, so our Progress Tab is
  likely still aligned — **verify separately**, low priority.
- **Nevo Student App** — a full-app shell demo (composition reference).
- **18a Lesson Summary & Review Answers** / **Nevo Post-Lesson Frame** — already
  actioned by the A4/A5 work. ✅

---

## Suggested order of work

1. **B1** hyphen copy sweep (trivial; aligns with the A10 house style already agreed).
2. **B2** Profile inline-edit name + "Tell us something" row.
3. **B3** Subject Detail session sheet.
4. **B5** sidebar active/hover tint check; **B4** Connect keyboard-on-composer.
5. Defer **Category C** to the intelligence/adaptation backend (B2 in
   [blocked-items-handoff.md](blocked-items-handoff.md)); it's where frames 37/38 land too.

*Nothing here regresses a shipped screen — these are enhancements + one copy
convention. The heavy new design is the intelligence layer, which is backend-gated.*
