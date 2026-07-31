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


---
---

# ROUND 2 — mirror re-sync of 31 Jul 2026 (`4b29faf` → `556627b`)

**Method.** Same as round 1: every changed file in the mirror examined — new root
docs read in full, all 18 changed student files diffed (big ones read whole, the
rest via the dash-normalizing filter), our built components then grepped for the
same defects. Four mirror commits: file renumbering + ops/admin specs, the C07
collision fix, LFS restore, and a "Launch pixel perfect" pass.

**Headline.** This round is dominated by **SCRUM-94 (touch signal correctness)**
and **SCRUM-101 (module structure)**. Design fixed a set of interaction defects
in their frames that **our build shares** — we inherited them faithfully from the
old frames, so several shipped components now need the same corrections. Plus one
new student feature (modules), one copy ruling (greetings), and a small polish set.

## R0 · New governing documents (read first when actioning)

- **`Touch Signal Contract.md`** (SCRUM-94 · G1/G2/G5) — build-affecting invariants:
  the closed gesture set (tap / vertical scroll / framed drag only; HTML5 drag,
  swipe-only and long-press-only actions banned), `system_busy` marker pairs
  (`auth_pending`, `content_loading`, `transition_screen`, `confirmation_hold`,
  `modality_switch`, `view_transition`, `media_playing`, `blocked_by_modal`),
  scrim taps emit `tap_blocked` (never latency/aborted channels), every overlay
  needs a visible ≥44×44 dismiss, form-factor session tagging, and the retirement
  of `pointer_dwell_time` in favour of `tap_duration` + `inter_touch_idle`
  (our constants never used the retired name — verified clean).
- **`Touch Signal Capture Audit.md`** — the per-screen audit behind the contract.
  Its §5 re-measurement confirms our D2/D3 sizes landed in design's own files
  ("was already fixed"); its remaining sizing tickets are Lessons filter chips
  (→44), Ask Nevo close/send (unbuilt), and the Preview Sheet close.
- **`36 Design System Audit - v1 Build Lock`** — locked rulings; the one that
  binds us now: **time-of-day greetings removed** product-wide.
- **`37 Pixel Audit - Batch 1 Student`** — 0 in-place fixes for the student
  surfaces; two open questions (700-weight scope, radius 14) are design's to rule.
- **Frontend handoff §11–12** — "Pressable, not disabled" house rule;
  module-structure defaults (below). Feedback consolidated to one component
  (roles now include `parent`).

## R1 · Signal-correctness drift in built components (SCRUM-94)

Design fixed these in their frames; our build inherited the old behaviour:

| # | Component | Change |
|---|---|---|
| R1.1 | `VisualSortingTask` (onboarding Activity 1) | **HTML5 drag → tap-to-select, tap-a-zone.** Drag never fires on touch, so on tablet the diagnostic that seeds the baseline is uncompletable. New frame: tap arms a card (navy ring, 1.06 scale), zones go from quiet cream tiles to armed (inset navy ring), re-tap releases, hint line cycles "Tap one to pick it up / Now tap where it belongs / That's all of them." Zones are solid cream-elevated now, not dashed. |
| R1.2 | `ModalitySuggestionPill` (+ player wiring) | **v3: card with two discrete peer buttons.** "Yes, try it" (navy) + "Not now" (navy-outline), both 44px tall, 8px gap, container no longer tappable (SCRUM-94.5 killed the nested dismiss), and **no auto-dismiss** — the pill holds until acted (a timeout is indistinguishable from a decline in the signal record). Keep the 300ms navy accept beat. Card: radius 12, max-w 340, padding 18. |
| R1.3 | `CalculationSolver` | **All three auto-advances removed — every step ends on a commit tap.** Cards: choose (selection ring) → "Check my answer". Step-1 confirmation → "Next step" button (no 1500ms timer). Numeric: "Check my answer" (no value-sniff; wrong commit → attempt + nudge + hint). Manipulative: "That's the total" once 3 placed. And **`nevo-shake` is retired** — replaced by `nevo-nudge`, a non-displacing soft-violet ring pulse (displacement moves options under the finger; shake reads as alarm). |
| R1.4 | `HomeDashboard` mobile rail | **Horizontal snap rail → 2-up grid.** scroll-snap overrides the student's deceleration curve and nests a horizontal scroller in the vertical page (banned by G5). Same card width, no nested gesture zone. |
| R1.5 | `LessonsTab` | **Subject headers no longer sticky** — sticky headers overlay cards (taps land on the header) and perturb scroll signal. |
| R1.6 | All sheets/dialogs (`ui/sheet` skin) | **Scrim 0.30 → 0.55** (G1: the backdrop must read unavailable). And per the updated boards, sheets swap the drag handle for a **top-right 44×44 close** — Preview Sheet (which currently has *no* visible dismiss — the audit's highest-value sizing item), Session Detail, and the Profile-pattern sheets. |
| R1.7 | `globals.css` animations | **`nevo-glow` and `nevo-sparkle` become one-shot** (were infinite — perpetual motion inside measured windows). The frustration chevron, when built, uses glow x3. |
| R1.8 | `LessonsTab` filter chips | ~33px tall → **44px** (capture-audit sizing table). |

## R2 · Signals infrastructure (with Teslim, per the contract)

- Emit `system_busy` start/end pairs from: player loading/skeleton
  (`content_loading`), audio play/pause/end (`media_playing` — its own reason:
  attending, not idle), the suggestion accept beat (`modality_switch`),
  transition screens 07/16 (`transition_screen`), consent/SSO pending
  (`auth_pending`). The calc's `confirmation_hold` reason mostly disappears
  because R1.3 removes the holds.
- Scrim taps emit `tap_blocked` (diagnostic only).
- Tag every signal session with **form factor** at start (G6) and reduced-motion mode.

## R3 · New feature — SCRUM-101 Module Structure

- Lesson model gains optional **modules** (lesson → modules → segments); the
  default flips at **6+ segments**; students never see the distinction named.
- Player position line becomes **two-level** ("Module 2 of 3 · Segment 4 of 6 in
  this module") above the progress bar; single-level ("Segment 2 of 5") otherwise.
- **`Nevo Module Boundary`** renders between modules — a full player screen
  (never a modal, no scrim): names position + what finished/what's next, two peer
  44px actions ("Yes, continue" / "Take a break first" → break module), recap +
  preview only under the attention accommodation (backend-gated), no celebration.
- Home Continue card shows the two-level line ("Module 2 of 3: Practice").
- Suggestion rate-limit: no modality offer on the first segment after a boundary.

## R4 · Copy & polish

- **Greeting**: "Good morning/afternoon, Ada" → **"Welcome back, Ada"** (build-lock
  ruling; the dated eyebrow line stays). Drop the clock-driven greeting logic.
- Feedback panel: textarea/buttons radius 8 → **10**, heading + Send weight 700 →
  **600**; component now also serves a `parent` role (not a student-app surface).
- QuickCheck sheet scrim joins the 0.55 rule (Lesson Check board).

## R5 · Verified no-action

- 30/32/09 board updates document the tap rebuild + scrim rules (reference only).
- Renumbering (D0→D00 etc.), admin/teacher/ops/landing additions: new scope, not
  student drift. `Nevo Self-Driving Product Walkthrough` is the renamed Autopilot
  demo. Root marketing decks (Pitch, YC demo, Auto-Play Briefing) are internal.
- Event-name hygiene: our signal constants never used `pointer_dwell_time` — clean.

## Suggested order

1. **R1.2 + R1.3** (pill v3 + calc commit taps/nudge) — one player PR; largest
   signal payoff and user-visible correctness.
2. **R1.1** Activity-1 tap rebuild (protects the onboarding baseline).
3. **R1.4–R1.8** structural/polish sweep (rail, sticky, scrims + closes, one-shot
   animations, chips) — can be one PR.
4. **R4** greeting + feedback polish (small PR).
5. **R3** module structure (its own feature PR: types, player line, boundary
   screen, Home line, rate-limit).
6. **R2** signal markers alongside Teslim's collection layer (the marker emits
   can land early behind the existing `useSignals` seam).
