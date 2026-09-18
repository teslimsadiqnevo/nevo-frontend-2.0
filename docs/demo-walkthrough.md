# Demo clips — recording guide

**For:** Lydia presenting live to an intermediary, narrating over silent clips.
**Recorded against:** the live `nevo-e2e` tenant. Everything on screen is real.
**Shape:** nine standalone clips, ~20 minutes total. Each makes one point and stops.

Clip order is the pitch: a school opens, a teacher sets up, a child is measured,
a lesson adapts, the teacher sees it, the school oversees it, a parent consents.

---

## Tenant state — probed 18 September 2026

Verified against the live API, not assumed. **This tenant is demo-ready.**

| | | |
|---|---|---|
| Students | **37** (34 profiled) | clips 6, 8 have a real roster |
| Classes | **7** | clips 2, 6 |
| Teachers | **4** | clip 6 |
| Adaptation events | **256** | clip 8 — the log is full |
| Diagnostic labels stored | **0**, `compliant: true` | **clip 8's money shot** |
| SSO | Microsoft, `needs_attention`, 7 sync runs including a failed one with a reason | filmable |
| Billing | Visa ending 4242, 3 invoices, upcoming ₦3,225,000 due 11 Oct | filmable |
| **Pending invites** | **0** | **films empty — create one live, or skip** |
| **Admin team** | **1 row** | **thin — add members first, or skip** |
| **Contract start / end** | **`null`** | check the billing screen renders without them |

No seeding day is needed. Earlier concern about an empty tenant applied to a
different admin account; this one has history behind it.

### Film this one lesson: **Simple Interest**

`627ad68b-23bd-4fd7-a064-1f1573662dd2`. Probed 18 Sep, and it is the only lesson
on the tenant that should appear on camera.

| | |
|---|---|
| Status | `completed_with_review` |
| Segments | 9, plus 2 review |
| Modalities | **text ×7, audio ×6, visual ×3** — all three renderable, nothing that will fail to draw |
| Assessment / recap | both present, so the summary and review routes resolve |
| Assignments | 6 |
| Length | ~19 min |
| **Modules** | **0 — there is no module boundary screen on this lesson** |

All 256 adaptation events on the tenant are against this one lesson, across 34
profiled children. It is school-appropriate maths, it exercises every modality
the player can render, and it is the only content here that fits the audience.

### The teacher account cannot see it — resolve before recording

`TEACHER_EMAIL` in `.env.local` signs in fine (role `teacher`, 3 of the 7
classes), but its lesson library is **three university computer-science PDFs**:

| Lesson | Problem |
|---|---|
| **CSC320 Exam Guide** | `status=failed`, **0 segments**. Opening this as a child triggers the fixture fallback. This is the landmine, and it is sitting in the library. |
| **Formal Specification Using Z** | Renders, but it is undergraduate CS. |
| **CSC324 Formal Specification Z Exam Guide** | 1 segment, text + interactive. Interactive does not render. |

Filming clips 6 and 7 from this account does two kinds of damage: it tells an
intermediary the product is for universities, and it puts a failed lesson one
click away from the camera.

**What is needed:** credentials for the teacher who owns *Simple Interest*, or
that lesson assigned to the `TEACHER_EMAIL` account. Until then clips 4, 6 and 7
should not be recorded.

### You need three separate logins

The thing most likely to derail a recording day.

| Clips | Account |
|---|---|
| 1, 8, 9 | **Admin** — the `senco_admin` in `.env.local`. All 7 scopes, all 14 nav items. |
| 2, 6, 7 | **Teacher** — a different account. `/teachers/me/classes` returns 0 for the admin, because an admin is not a teacher. CI holds `E2E_TEACHER_EMAIL` / `E2E_TEACHER_PASSWORD`. |
| 3, 4, 5 | **A child** — created live during clip 3, through the join flow. |

Sign all three in, in separate browser profiles, before you start.

---

## Read this before you record anything

### 1. The fixture fallback will film a lie

`useStudentLesson` answers a 404 or a failed parse with **an authored fixture of
the same id**. `SampleRegion` renders as `display:contents`, so there is nothing
on screen to see. If a lesson fails while recording, you capture the
photosynthesis fixture — richer than anything real — and it will look like your
best take.

**Pre-flight, on the day:**

1. Open each lesson id you plan to film, signed in as the child you will film.
2. In devtools, confirm there is no `SampleRegion` wrapper in the rendered tree.
3. Confirm the Network tab shows a 200 for the lesson read, not a 404 followed
   by a render.
4. Only then record. Re-check after any gap — a lesson that was still parsing
   when you checked may have failed since.

### 2. The one rule for Lydia's narration

The architecture is explicit, and this is the easiest way to lose credibility
with someone who will repeat it to schools:

> A floor is a target. It has never been measured on Nevo. It must never be
> stated externally as though it has.

The defensible sentence, near enough verbatim: *the methods are validated at the
published levels, across the samples named; the combination has not been measured
by anyone, including us; a term of deployment is what produces our number.*

That is **stronger** than a borrowed statistic, because it is true, it is
checkable, and it is why the first cohort of schools gets the rate they get.
Two sigma is **aimed at**, never **achieved**.

### 3. Do not film these

| | Why |
|---|---|
| **Admin → Overview period pill** | Nothing deployed carries a period or accepts a date filter for those five figures. Every "this half-term" number would be false. |
| **Admin → Invitations** | Zero pending. Films empty. Either create one live as part of clip 9, or skip it. |
| **Admin → Team** | One row. Thin enough to look unfinished. Add members before filming, or skip. |
| **SSO as "monitoring"** | Filmable, and the failed-run detail is genuinely good. But the schema carries no certificate expiry, so do not present it as catching everything — the one fully predictable lockout is the thing it cannot see. |
| **Any result shown to a child** | If a score, grade or percentage appears in the student app, that is a bug. Stop and raise it. |

### 4. Pacing, because Lydia is talking over this

- **Hover before you click.** A viewer needs to see the target before it changes.
- **Let each screen settle ~2 seconds** before moving. She needs somewhere to
  land a sentence.
- **Move the cursor slowly and deliberately.** No hunting, no overshoot.
- **Never scroll fast.** Half the speed that feels natural.
- **Leave 3 seconds of stillness at the end of every clip.**
- Record 1920x1080. For slow-motion polish, the 0.25x capture pipeline in
  `scratchpad/demo-recorder/slowmo.mjs` already solves this.

---

## Clip 1 — A school can open its own door

**Proves:** no sales engineer required. **~90 seconds. Admin login.**

| Shot | Route | Action |
|---|---|---|
| 1 | `/landing` | Land. Settle. Scroll slowly to the footer. |
| 2 | `/landing` | Hover the onboarding link, then click. |
| 3 | `/admin/onboarding` | Move through at reading pace. **Cut before submit** — do not create a real school on camera. |

**Lydia's point:** a school starts this themselves, today, without us.

---

## Clip 2 — A teacher sets up a class in minutes

**Proves:** setup belongs to a teacher, not to IT. **~2 minutes. Teacher login.**

| Shot | Route | Action |
|---|---|---|
| 1 | `/teacher/onboarding` | Step through. Pause on each screen. |
| 2 | `/teacher/classes` | The class list — 7 real classes. Hover a card; the headcount is real. |
| 3 | `/teacher/classes/[classId]` | Open one. Let the roster settle. |
| 4 | `/teacher/classes/[classId]/code` | The class code. **Hold this shot** — it is the hinge into clip 3. |

**Lydia's point:** one code on the board, and the class joins.

---

## Clip 3 — The system measures how a child thinks. It does not ask.

**Proves:** the core differentiator. **~4 minutes. The most important clip.**

Everything Nevo claims rests on this being measured rather than self-reported,
and on the child never being told.

| Shot | Route / component | Action |
|---|---|---|
| 1 | `/student/connect` | Enter the class code from clip 2, at human typing speed. |
| 2 | `/student/onboarding/name` | Name and age. |
| 3 | `/student/onboarding/school` → `class` | Confirm school and class. |
| 4 | `ProfilingIntro` | **Pause.** The framing is "setting up your learning space". Let it sit. |
| 5 | `GridSpanModule` | Play it properly — tap cells in reverse sequence. **Get one wrong on purpose:** the nudge is violet, never red. Worth more than a clean run. |
| 6 | `SentenceDotModule` | Sentence verification and dot arrays. The West African names and settings are deliberate, not decoration. |
| 7 | `PatternFlankerModule` | The attention task. |
| 8 | `DomainProbeModule` | Prior knowledge. |
| 9 | `QuestMap` | The four-segment map filling. **The only progress cue a child ever sees.** |
| 10 | `StretchInterstitial` | Brief. |
| 11 | `YoureInScreen` | "Nevo is ready for you." Hold 3 seconds. |

**Film the absences.** Move the cursor slowly near the top of screen so a viewer
sees there is no timer, no score, no attempt counter, no back button, no skip.
Lydia names each one as it fails to appear.

**Lydia's points:**
- Six dimensions, measured through public paradigms — Corsi span, flanker,
  sentence verification, dot comparison — not a preference survey.
- The words *test*, *score* and *ability* never appear. No result is ever shown.
- The motor baseline subtracts touchscreen latency, so a child unfamiliar with a
  tablet is not measured as slow. **That is the difference between measuring a
  mind and measuring a household's income** — the line that lands hardest with a
  school serving a mixed intake.
- **Nothing here produces a category.** It produces numbers that configure
  software.

---

## Clip 4 — A lesson adapting, while you watch

**Proves:** the central claim. **~4 minutes. Child login from clip 3.**

**Film *Simple Interest*** (`627ad68b…`). Nine segments, text/audio/visual
throughout, assessment and recap both present. Pre-flight it anyway.

| Shot | Component | Action |
|---|---|---|
| 1 | `/student/lessons` | The child's lesson list. |
| 2 | `LessonPlayer` | Open *Simple Interest*. **Do not skip this beat** — accommodations are already applied. There is no un-adapted first screen, and that absence is the point. |
| 3 | `TextSegment` | Read at a child's pace. |
| 4 | `ModalitySuggestionPill` | When it appears: hover, pause, take it. With 6 audio and 3 visual segments, this will fire. |
| 5 | `VisualSegment` / `AudioSegment` | The same segment, the other way in. **Same concept, same objective, same assessment.** |
| 6 | `ScaffoldIndicator` | Get a question wrong; let the circles fill. **Do not point the cursor at it** — it is ambient. Lydia names it; the shot does not chase it. |
| 7 | `BreakOfferPill` → `BreakScreen` | Film if it fires — `break_suggested` appears 31 times in the log, so it is live behaviour. Do not force it. |
| 8 | `LessonComplete` | Quiet completion. Hold 3 seconds. |

**No module boundary shot.** *Simple Interest* has `modules: 0`, so
`ModuleBoundaryScreen` never renders on it. Chunking has to be described rather
than filmed, or it needs a different lesson — and there is no other suitable one
on this tenant.

**Lydia's points:**
- The switch is between two ways into the *same* segment. The child does not
  carry a modality, and the choice is not stored.
- **This is where the learning-styles objection dies.** Any school that reads
  will assume visual/auditory-learner matching. It is the inverse: that idea is
  the most thoroughly disproven in education science, and the preference survey
  was removed permanently because of it. A competitor profiles children into
  categories. We respond to the moment.
- Support arrives as part of the lesson, never as a correction — the only reason
  a struggling child can be helped in a room of peers without being exposed.
- No reward mechanics. A decision about the child's relationship with the
  product, not a missing feature.

---

## Clip 5 — It recalibrates, daily

**Proves:** not one-and-done. **~45 seconds. Child login.**

| Shot | Route | Action |
|---|---|---|
| 1 | `/student/warm-up` | The ~45-second warm-up. `WarmUpCard` → `WarmUpRun`. |

**Lydia's point:** one dimension a day, rotating through all six across a week.
Same activities, single round, no quest map. Never a test, never a score. A child
in September is not the child they are in March.

---

## Clip 6 — What the teacher sees, and what she never sees

**Proves:** actionable signal without a label. **~3 minutes. Teacher login.**

| Shot | Route | Action |
|---|---|---|
| 1 | `/teacher/dashboard` | Settle. |
| 2 | `/teacher/insights` | Class-level narrative — which concept is settling slowly across the class. |
| 3 | `/teacher/students` | The roster. |
| 4 | `/teacher/students/[studentId]` | One child. **Slow down here.** |
| 5 | same | Scroll the whole panel deliberately, so a viewer sees what is absent. |
| 6 | `/teacher/students/[studentId]/recommend` | Recommend a lesson, with a note. |

**Lydia's points:**
- Every line describes what the software did, never what the child is.
  "Finishing the lessons she starts" is an observation. "Struggles with
  retention" is a finding we have no grounds for, and it exists nowhere in the
  product.
- No ranking, no percentile, no league table.
- Help-seeking is aggregate only, never per-question, and nothing shows below
  three interactions — a visible log of asking for help chills exactly the
  children who most need to ask. **And the child is told that**, in the Ask Nevo
  drawer.
- A teacher can act on this. Nobody can label a child with it.

---

## Clip 7 — Their curriculum, not ours

**Proves:** it adapts the teacher's own lesson. **~2 minutes. Teacher login.**

The objection-killer for a school that already has schemes of work.

**Blocked on the right teacher account.** The library on `TEACHER_EMAIL` is three
university CS PDFs, one of them failed — see the tenant section. Shot 1 cannot be
filmed until a teacher with age-appropriate content is available. Shots 2–5 are
fine to record with a freshly uploaded lesson of your choosing.

| Shot | Route | Action |
|---|---|---|
| 1 | `/teacher/lessons` | The library. **Do not film the current one.** |
| 2 | `/teacher/lessons/upload` | Upload a real lesson. Film the parse progressing. |
| 3 | `/teacher/lessons/[lessonId]` | The parsed result. |
| 4 | `/teacher/lessons/[lessonId]/variants` | **The money shot** — the same lesson, multiple ways in. |
| 5 | `/teacher/lessons/assign` | Assign it to a class. |

**Lydia's point:** we do not replace what a teacher wrote. The concept, the
objective and the curriculum are identical for every child in the class. What
changes is the route through it.

---

## Clip 8 — The school's view, and the thing nobody else can say

**Proves:** oversight, and Zero-Tag. **~3 minutes. Admin login.**

| Shot | Route | Action |
|---|---|---|
| 1 | `/admin/dashboard` | Overview. **Avoid the period pill entirely.** |
| 2 | `/admin/students` | 37 students, with consent states. |
| 3 | `/admin/classes` | 7 classes. |
| 4 | `/admin/senco` → `/admin/senco/[studentId]` | Learning support. |
| 5 | `/admin/adaptations` | 256 logged events. **Scroll this slowly** — the variety is the argument. |
| 6 | `/admin/compliance` | **Hold the longest shot of the clip here.** |
| 7 | `/admin/reports` | Close out. |

**The compliance screen is the single best shot in the whole set**, because the
numbers are real and they say the thing no competitor can say:

> **34 children profiled. 256 adaptations logged. Zero diagnostic labels stored.
> Compliant.**

The log itself backs the claim up, because the events are varied rather than one
mechanic firing repeatedly — probed 18 Sep across all 256:

| Event type | Count |
|---|---|
| `modality_suggestion_accepted` | 37 |
| `expand_trigger` | 32 |
| `simplify_trigger` | 32 |
| `modality_manual_switch` | 31 |
| `break_suggested` | 31 |
| `modality_switch_outcome` | 31 |
| `slower_trigger` | 31 |
| `modality_suggestion_shown` | 31 |

Lydia can name these off the screen: the system offered another route and the
child took it, it expanded, it simplified, it slowed down, it offered a break.
That is the six mechanics visible as behaviour rather than as a claim.

**Lydia's points:**
- The database stores `visual_scaffold_density = 0.8`. It never stores anything
  resembling a description of a person. No category, no type, no diagnosis.
- Enforced three ways: built correctly, guarded by middleware that rejects any
  write containing diagnostic vocabulary, and never written into copy.
- **This is the commercial argument as much as the ethical one.** The nearest
  competitor profiles children into categories and routes them elsewhere. If we
  categorised, we would be a worse version of them. We do not, and the filings
  say so.

---

## Clip 9 — The guardian is in the loop

**Proves:** the NDPA position is real, not a checkbox. **~90 seconds.**

| Shot | Route | Action |
|---|---|---|
| 1 | `/admin/students` | Trigger a parent consent request. (Also fills the empty Invitations screen, if you want it.) |
| 2 | `/parent/[token]` | The consent screen as a guardian sees it. |
| 3 | `/parent-portal` | What a parent can see about their own child. |

**Lydia's point:** consent is recorded with version, accepting person and
timestamp. A guardian who withdraws stops measurement — and that path is built,
not promised.

---

## If a clip goes wrong on the day

- **A screen is empty.** Cut it. An empty state in a sales clip costs more than
  a missing feature.
- **A lesson 404s.** Stop. You are now filming a fixture. Re-run pre-flight.
- **A number looks wrong.** Do not film it. A wrong figure in front of an
  intermediary gets repeated to a school.
- **Something shows a child a result.** Stop and raise it — a rule-9 breach and
  a bug, not a demo problem.

---

## Known gaps, so nobody promises them on camera

- **Interactive and calculation segments do not render from parsed content**
  (`RENDERABLE` is text, visual, audio). Co-construction is the one mechanic of
  the six that clip 4 cannot show. Lydia should describe it, not promise a
  screen.
- **`POST /api/v1/students` returns 500** on valid input, so the tenant cannot be
  topped up by script. Anything extra has to go through the join flow by hand.
- **SSO carries no certificate expiry.** Filmable as a health screen; not
  presentable as complete monitoring.

## Re-probing before the day

Credentials live in `.env.local`, which plain `node` does not read:

```bash
node --env-file=.env.local scripts/admin-probe.mjs
```

Read-only GETs; prints shapes, not names.
