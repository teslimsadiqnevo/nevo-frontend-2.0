# Design Drift Audit — mirror re-sync (complete pass)

**Method.** The `nevo-design-outputs` mirror is a git repo. This audit diffs the
export the student app was built against (`fb4c40b` "Nevo export 1") against the
pulled `HEAD` (`4b29faf`) — **every changed file in the repo**, not just
`student/`. Large frame diffs were read in full; the remaining files were checked
with a dash-normalizing filter (em-dash→hyphen swaps cancel out, anything left is
a real change) so noise couldn't hide substance. Files whose entire diff was a
handoff-label chip and/or punctuation: verified and listed as no-action.

**Headline.** No shipped screen is *broken*. But the re-sync carries more
directives than a first look suggests: three root documents aimed straight at the
frontend, a universal punctuation rule, a redesigned suggestion pill, a touch-
target pass, a keyboard "composer" variant, a made-for-us orientation decision,
and the SCRUM-68 feedback surface. The genuinely new *app surfaces* (teacher
rebuild, admin, ops, landing page, intelligence layer) are new scope, not drift.

---

## 0 · Read these first — new root documents addressed to the frontend

| Doc | What it is |
|---|---|
| **`Handoff - Frontend (Olayinka).dc.html`** | A guided build handoff: file-class rules (product apps vs numbered boards), breakpoints per role, tokens, the calm state system, component inventory, intelligence-layer overview, and hard conventions (below). |
| **`Student Touch-First Audit.md`** | Per-screen touch audit (🔴/⚠️/✅) with a ticket split. Notably: our build is *ahead* of it on the top 🔴 item (calc numeric → Nevo Keyboard — we shipped that in A12). |
| **`Interactive Audit.md`** | Living tracker: every control wired, no dead ends. Confirms Profile's "Tell us something" = the SCRUM-68 feedback entry; sign-out is now a calm confirm overlay for all four roles. |
| **`Nevo Design - Full Breakdown.md`** | Whole-product inventory (Parts 1–5 + Feedback + conventions). |

**Hard conventions from the handoff that bind our code now:**
- **No em dashes anywhere** — hyphen/colon/semicolon; en dash only in numeric
  ranges (§07). This is universal copy, not just the check screens.
- **Codes = underline lines; PINs = rounded boxes. Never mix.** (We comply.)
- Keyboard is **focus-driven, never constant**; blur debounce **~120ms**;
  desktop = hardware keyboard only.
- Elevation is tonal (cream steps), shadows max L3; define `a/a:hover` colours so
  nothing ever renders browser-blue.
- **Build/route against the product apps** (`Nevo Student App` + `Nevo <Screen>`
  frames); the numbered boards are state documentation.

---

## 1 · Real drift in built screens (actionable now)

Ordered by suggested priority.

| # | Item | Detail | Size |
|---|---|---|---|
| D1 | **App-wide hyphen sweep** | Every frame's copy switched em dash → hyphen (the §07 rule). Our components + lesson mocks (photosynthesis, adding-fractions: `recoveryNote`s, `resultNote`s, `completion`, `DEFAULT_RECOVERY`, offline banner line, etc.) still use em dashes. | S–M, mechanical |
| D2 | **Suggestion pill redesign** (`ModalitySuggestionPill` + calc variant) | Old: text + "Sure"/"Not now". New: **whole pill is the accept target** (role=button), a **44×44 "×" dismiss** (stopPropagation), and an **accept beat**: pill fills navy ~300ms (text→cream, dismiss fades) before the modality switches. Documented as component states in board 17 §C3. | M |
| D3 | **Touch-target pass** (player + calc) | Exit "×" 40→**44×44**; calc audio play 42→**44**; density pills → **44px tall, 8px gaps, 13px font** (was ~26px/4px/12px); suggestion dismiss ≥44 (covered by D2). From the Touch-First Audit + frame values. | S |
| D4 | **Profile & Settings** | (a) **"Tell us something"** row → opens the **Nevo Feedback** panel, student variant (SCRUM-68; see §3). (b) **Inline name edit**: tap Change → input (Enter/blur saves, flashes Saved), initials derive from the name — must route through the **Nevo Keyboard** on touch (Touch Audit 🔴). (c) Change PIN row is now wired in the product frames — ours is still `TODO(pin)`. | M |
| D5 | **Subject Detail: session sheet** | Tapping a timeline session opens a bottom sheet (scrim tap-to-close + drag handle + date/title/note + 52px Close; `nevoSheetUp` 300ms / scrim 220ms; reduced-motion honoured). Back button is 44×44. | M |
| D6 | **Keyboard: composer variant + missing routings** | The `Nevo Keyboard` gained a **composer** (`composer: none\|single\|multi`, `value`, `placeholder`): an attached field above the tray with blinking caret; multi shows "return ↵". Flow reference: "multi-line variant for notes". Design also now routes **Lessons search**, **Connect composer**, and **Onboarding Step 3 class search** through the keyboard — none of ours do. Blur-debounce ~120ms per the handoff. | M |
| D7 | **Orientation: portrait-only v1 + Rotate Prompt** | Decided in frame 30: "**Portrait only (v1) · calm rotate prompt if held landscape**". New `Nevo Rotate Prompt` frame + an ORIENTATION section in 34 State Patterns. We have no landscape story → build the prompt overlay. | S–M |
| D8 | **Sidebar + Home polish** | Sidebar rows: active tint `rgba(59,63,110,0.08)`, hover `0.05`, `transition:background 130ms`. Home desktop content max-width **760→860** + centred. | S |
| D9 | **Visual segment: real art, no dashed placeholder** | The player's visual segment replaced the dashed "illustration goes here" box with a **finished inline SVG diagram** (+ handoff §07: never a dashed wireframe on a finished screen). Ours still renders the placeholder style for missing art. | S–M |
| D10 | **Sign-out confirmation** | All four roles now sign out via a calm confirm overlay (`Sign Out Modal.dc.html`). The student app currently has no sign-out affordance at all — placement per design is the account area. | S |

**Already satisfied / no action:** calc numeric via Nevo Keyboard (A12 —
we're ahead of the Touch Audit's top 🔴); PIN boxes vs code lines; A4/A5
summary + review (18a/`Nevo Post-Lesson Frame` — B6 in the prior audit); the
Lesson Summary section being removed from board 18 (it moved to 18a); text-size
live preview; assessment answer cards (Touch Audit's "critical item 11" ✅).

---

## 2 · Intelligence layer woven into built screens (mostly backend-gated)

The bulk of the player (+150) and calc (+84) diffs. All behind props, **but note
the defaults**: the scaffold indicator defaults **on** (`light` in the player,
`moderate` in calc), so design intends it visible at ship with a static level.

- **Scaffold "Support" pill** — top-right; 4 dots (full/moderate/light/minimal/off);
  **tap-to-reveal popover**: "Support shows how much help this lesson is giving
  you right now. Nevo sets it for you - it's nothing you need to change."
  *(Buildable now with a mock level; live value needs the adaptation backend.)*
- **Affective states (37b)** — `affect: anxiety|boredom|frustration|confusion`:
  chrome dims to 0.4 (anxiety), "Ready for something harder?" nudge (boredom),
  hint card + glowing forward chevron (frustration), "Which part is unclear?" +
  a "Let's think it through" Socratic bottom sheet (confusion). Backend-gated.
- **UDL (37c)** — `udl: reading|attention`: reading = letter-spacing + body ≥18;
  attention = "Part 1 of 3" chip + dimmed secondary chrome. Calc scaffold card
  label is now "PICTURE IT · **UDL: NUMBERS MADE VISUAL**". Backend-gated.
- **Review mode (37d)** — a REVIEW pill variant of the player. Backend-gated.
- 17a adds the **dynamic scaffold model**: four support intensities + *silent
  re-engagement* (two consecutive misses at a reduced level quietly restores
  support). Spec for the adaptation loop, not v1 frontend.

17b (calc dev spec) is unchanged functionally — its diff is punctuation + zero-tag
language ("dyslexia" → "read-aloud support"). Board 17 now carries a
**CANONICAL · LAYERED CHANNELS** note formalizing the A1 resolution.

---

## 3 · New design scope (nothing to reconcile — future tickets)

- **Break Module update**: the consolidation break dropped the reflection
  *textarea* for **"How are you feeling right now?" + six feeling chips**
  (Focused/Curious/Calm/Tired/A bit lost/Restless, multi-select, 44px) +
  Continue — which both feeds the affective layer and removes the Touch Audit's
  textarea complaint. Component library also shows an "Optional" note input.
  The Break Module is unbuilt; fold this into its ticket.
- **Nevo Feedback (SCRUM-68)** — one reusable panel, all roles
  (`role/variant/state`), student variant is warmer ("nothing you say changes
  your lesson"). Entry from Profile ("Tell us something" — D4a). Textarea routes
  through the keyboard composer.
- **Intelligence-layer frames** 37/37a–d/38, **Autopilot Demo**, **Adaptation
  Loop** — the adaptive surface (backend B2 in the blocked-items handoff).
- **`Nevo Student App`** — the composed, fully-wired click-through product app;
  now the canonical reference for routing/interactions. 32 Prototype embeds it
  and extends the click-through to lesson → check → break → completion →
  summary → home.
- **Whole new apps**: `teacher/` (rebuilt + C16 intelligence set), `admin/`
  (D-series + Nevo Admin frames), `ops/` (J1–J13 internal dashboard, dark theme),
  `landing page/`. Student breakpoint note: tablet is **768×1024 pre-login**,
  **820×1112 logged-in** — don't mix phases.
- `Nevo Progress Frame` (new file) is used by the Student App composition; board
  22 didn't change its imports — our Progress Tab remains aligned.

## 4 · Verified no-action (every other changed file)

- Numbered boards 00–16, 19–29, 31, 35, 36 and small `Nevo *` frames (Activities
  1–4, Ask Nevo, Login, Sequence Shell, Sidebar Navigation, Onboarding 1/2/3,
  PIN, Teacher Join, The Close, Transition, You're In, Consent, Lessons, Bottom
  Nav, Downloads, Home beyond D8): handoff-label chips, em-dash→hyphen swaps,
  and prototype `on-nav`/`href` wiring only — confirmed by full-diff or the
  dash-normalized filter.
- Mirror `CLAUDE.md`: adds admin-layer conventions + per-role flow-map pointers.
- `support.js`/`doc-page.js`/`image-slot.js`, screenshots, `_export/`, uploads:
  canvas runtime + assets.
- No files were deleted or renamed.

---

## 5 · Suggested order of work

1. **D1** hyphen sweep (universal rule; trivial but touches many strings).
2. **D2 + D3** suggestion-pill redesign + touch-target pass (one player/calc PR).
3. **D4** Profile: feedback entry (needs the student Nevo Feedback panel) +
   inline name edit (with keyboard) + Change PIN wiring.
4. **D6** keyboard composer + route Lessons search / Connect composer /
   Onboarding-3 search; add the ~120ms blur debounce.
5. **D5** Subject Detail session sheet · **D7** rotate prompt · **D10** sign-out
   confirm · **D8/D9** polish.
6. §2 ships with the adaptation backend (except the scaffold pill shell, which
   can land early with a static level if we want visual parity with design).

*The prior version of this audit under-reported: it keyword-scanned the two big
frames, skipped the Nevo Keyboard diff and every numbered reference board, and
missed the three root documents entirely. This pass covered every changed file.*
