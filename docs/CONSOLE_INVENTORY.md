# Console inventory — what is undone

**Teacher and parent consoles. Verified 14 Sep 2026 against `main` @ `b7e4c3e` and the
deployed spec (v2.0.0, 183 paths, 335 schemas).**

## Why this file exists

The question "is the console complete?" got a different answer every time it was asked,
because there was no maintained list — each answer was re-derived from grep and memory,
scoped to whatever was asked, and drifted. **Read and update this file instead of
re-deriving it.** When a line changes, change it here in the same PR.

Three rules that keep it honest:

- Every verdict carries the `file:line` or spec quote that decided it.
- A component file existing proves nothing. The verdict is about what a **signed-in**
  user sees.
- Every `BACKEND` / `DESIGN` attribution is re-tested against the live spec before it is
  written down. Blockers here have gone stale repeatedly and the comment has outlived the
  blocker every time.

## Verdicts

`LIVE` a signed-in user sees their own data · `PARTIAL` some sections live, some not ·
`FIXTURE-ONLY` renders, but a real user gets sample data or "not available" ·
`NOT BUILT` no component, or the route dead-ends.

## The headline

**Roughly a third of what this repo files under NEEDS BACKEND is not blocked at all.**
Recommend-a-lesson, specific-students, observation chips, seat context, class headcount
and variant review were six items sitting behind comments that had stopped being true.
Every one is a frontend afternoon. *Stale comments, not missing endpoints, are the
largest category of undone work here.*

---

## Teacher console

| Screen | Verdict | What is missing | Blocked by | Size |
|---|---|---|---|---|
| Ask Nevo drawer | LIVE | — (entry prompts are static UI copy) | NONE | — |
| Bulk curriculum ingestion | LIVE | — | NONE | — |
| Connect threads | LIVE | — | NONE | — |
| Feedback panel | LIVE | — (no test on the write) | NONE | — |
| Upload scope + file | LIVE | — | NONE | — |
| Teacher activation | LIVE | Error states unsigned-off | DESIGN | S |
| Password reset | LIVE | Error states unsigned-off | DESIGN | S |
| Session expired door | LIVE | Only the "expired" variant. Backend now sends four codes (`session_expired`, `session_revoked`, `session_replaced`, `account_paused`); **none is consumed anywhere**, and `ConsoleSessionExpired` takes only `signInHref`. Carrying a reason means changing `client.ts`, which all three consoles route through | FRONTEND | **M** |
| Lesson library | LIVE | Subject pills hidden — upload cannot set a subject | BACKEND | S |
| Notifications panel | LIVE | — | NONE | — |
| Class code / QR | LIVE | No standalone route; dialog only | DESIGN | S |
| Sign-in | PARTIAL | A paused or rate-limited teacher is told their password is wrong | FRONTEND | S |
| Console shell + nav rail | PARTIAL | Role label is `MOCK_TEACHER.role` unconditionally; Help & support has no destination | FRONTEND; DESIGN | S |
| My Classes list | PARTIAL | Card carries no subjects, headcount or summary line | FRONTEND | S |
| Class detail + roster | PARTIAL | Chips, seat, headcount fetched and dropped; no Lessons/Activity tab; consent not shown | FRONTEND; BACKEND (activity); DESIGN (consent) | L |
| Compose message | PARTIAL | Deep link resolves against fixtures in **three** places (`ConnectView:108`, `ComposeModal:69` and `:108`) and the profile link carries no query at all; cannot address a class | FRONTEND | **M** |
| Home dashboard | PARTIAL | **Emits no sample marks at all**; class trio subject/status; activity counts; "Good to know" | FRONTEND; BACKEND; DESIGN (cutoffs) | M |
| Insights | PARTIAL | Written summary; "Looking ahead"; per-student recommendations | BACKEND; FRONTEND (fan-out) | M |
| Student profile | PARTIAL | Read-only — 1 of 4 drawn actions; no noticing banner | FRONTEND | L |
| Lesson detail | PARTIAL | No entry point to variant review; multi-class reports first class only | FRONTEND; DESIGN | S |
| Lesson assignment wizard | PARTIAL | "Specific students" refused by a guard whose stated reason is false | FRONTEND | M |
| Variant review | PARTIAL | Live and correct but **no entry point**; no 5th-variant tab; no audio player | FRONTEND; DESIGN; CONTENT | S |
| Parse fallback | PARTIAL | 2 of 4 states live; `partial`/`noBoundary` unreachable signed in | BACKEND | M |
| Teacher onboarding | PARTIAL | Redirect covers password only; join-confirm + profile-setup unbuilt | FRONTEND | M |
| Profile & settings | PARTIAL | "Change photo" is a `<button>` with no `onClick` | BACKEND | S |
| Parse progress ladder | FIXTURE-ONLY | Live path shows a plain spinner; 3 stages against 4 drawn rungs | FRONTEND; DESIGN | S |
| Upload module / section review | FIXTURE-ONLY | Hardcoded Photosynthesis six; every control writes nothing | FRONTEND | M |
| Structure preview (standalone) | FIXTURE-ONLY | Orphaned duplicate; no session gate | FRONTEND | S |
| Student observations (C16b) | NOT BUILT | Fully drawn. Data, enum and copy all exist; nothing renders them | FRONTEND | M |
| Recommend a lesson | NOT BUILT | Unreachable signed in; fixture sheet claims a send it never makes | FRONTEND (+BACKEND for the note) | M |
| Share with Learning Support | NOT BUILT | Button correctly disabled; no teacher→SENCo transport | BACKEND | M |
| Session detail | NOT BUILT | No per-student, per-segment session read exists | BACKEND | M |
| SSO callback | NOT BUILT | Component complete and live-wired; nothing navigates to it | BACKEND | M |
| Notifications page | NOT BUILT | Deliberate redirect — C13 is a popover | NONE | — |
| Students index | NOT BUILT | Deliberate redirect to Classes | NONE | — |


**Variant review, two divergences found 14 Sep.** C07b draws it as ONE screen with segment
*pills* and a "← My Lessons" back link; what is built takes `?section=N`. More
substantially, C07b's stated purpose is that "the teacher reviews each segment's variants
and **approves** them for the class. Approval is manual and deliberate." **There is no
approval transport** — `approve` appears in none of the 183 paths and nowhere in the
document; the only sign-off field is `VisualVariant.reviewedBy`, which is a read. So what
is built is review *without* approval, and the approval half is a backend ask nobody had
made. Added to list B.

## Parent console

| Screen | Verdict | What is missing | Blocked by | Size |
|---|---|---|---|---|
| Parent consent (D01b) | LIVE | — | NONE | — |
| Parent data management (D01c) | LIVE | Does not name the recipient address the frame names | FRONTEND; CONTENT | S |
| Parent growth view (D15d) | LIVE | No school attribution; gendered statement templates. (Reachable on a second visit now that sign-in exists) | FRONTEND; BACKEND (prose) | S |
| Parent account setup (D02) | PARTIAL | No route of its own; contact read-only where the frame draws it editable; SMS copy invented | DESIGN | M |
| Parent sign-in (D03) | LIVE | — (built 14 Sep at `/parent-sign-in`; takes email **or** phone, see the note) | NONE | — |

**The parent lane no longer hangs on one token** (14 Sep). `/parent-sign-in` is built, and
`/parent-portal` offers it instead of telling a parent to go and find a link that may
already have expired.

**Two things about it design should see.** D03 says "Email only, no password" and labels
the field "Email address"; the 14 Sep ruling on the sister screen says "SMS is the path to
get right, not the fallback", and `request-code` takes `contact` rather than `email`. Built
to the newer ruling, so the field accepts either — email-only would lock out every parent
whose school holds a number. And the resend reads "Send it again" per that ruling, not
D03's "Resend code", because two parent auth screens with two wordings for one action is
the worse outcome. Both are a label and a validator to reverse.

**Still open:** the invitation's `expiresAt` is typed and never read, and
`GET /api/v1/consents/parent/{token}` documents **only 200 and 422 — no 404**, which the
UI assumes. That is backend item 11 and matters less now that a dead token is no longer
the end of the road.

---

## A. Buildable today — priority order

1. **Paused teacher told their password is wrong.** `classifyLoginFailure` is written and
   tested and used on both student doors; `TeacherSignIn.tsx:127` and `AdminSignIn.tsx:152`
   still map 401/403 to "check your details". **S**
2. ~~**Parent sign-in (D03).**~~ **DONE 14 Sep.** Built at `/parent-sign-in`; the portal's
   signed-out screen offers it rather than pointing at a link that may have expired.
3. **Student observations on class detail (C16b).** Largest drawn-but-unbuilt teacher
   screen; chips, seat and headcount are all already on the wire. **M**
4. **Home sample marks.** Until Home emits them the one E2E assertion cited as proof no
   teacher sees invented data is vacuous on the dashboard. **S**
5. **Variant review entry point.** One prop; a finished, tested screen is URL-only. **S**
6. **"Specific students" in the assign wizard.** Swap `ClassOption.roster` for
   `useClassRoster`, key on `studentId`. **M**
7. **Recommend a lesson.** Wrap `POST /api/v1/lesson-assignments`; delete the fixture
   sheet's false "That's sent". **M**
8. **Class headcount** — a join on `classId` against data rendered two sections up. **S**
9. **Revoked session-end variant.** **M, not S** — re-sized 14 Sep on inspection. The
   four codes are consumed nowhere, `ConsoleSessionExpired` has no reason prop, and the
   plumbing runs through `client.ts`, which student and admin share.
10. **Connect deep link.** **M, not S** — re-sized 14 Sep. The preset is fixture-bound in
    three places across two components, and the profile link sends no query at all, so
    this is a preset-resolution change rather than a one-line href.
11. **Delete or re-point `/teacher/lessons/upload/structure`.** **S**
12. **Parent polish** — name the recipient in D01c, school attribution on D15d, link
    `/parent-portal` from somewhere. **S**

## B. Blocked on backend — the exact ask

1. **Teacher→SENCo transport.** `MessageRecipientType` is `["student","class"]`.
2. **Per-student, per-segment session read.** Return the per-section *prose*, not a
   duration — the frame's notes are in a colleague's voice and cannot be generated from
   seconds without inventing tone.
3. **A note on an assignment.** `LessonAssignmentRequest` is
   `{lessonId, classId, studentIds, dueAt, availableFrom}` — verified, no note field —
   while the confirmation promises "She'll see your note when she opens it."
4. **Profile photo** — no image property in any of 335 schemas.
5. **Teacher-initiated SSO** — either a slug on the pre-auth `SchoolCodeResponse`, or
   serve the `/s/{slug}` entry path the backend already generates.
6. **`failedPages: int[]`** on `UploadStatusResponse` — `retryPages` takes page numbers
   nobody can source.
7. **A class-scoped written narrative** and "Looking ahead".
8. **Per-row completion** (`done`/`total`) on `recentActivity`.
9. **`subject` on `POST /api/content/upload`.**
10. **`category` on `NotificationResponse`.**
11. **What an expired parent consent token returns.** Settle before shipping D03.
12. **Gendered growth statements** — the prose renders verbatim and cannot be fixed
    client-side.
13. **Variant approval.** C07b: "the teacher reviews each segment's variants and approves
    them for the class." No approval endpoint exists. Either a write, or a ruling that
    review is read-only and C07b's copy is stale.

## C. Blocked on design — the exact ask

1. A tab, label and layout for the fifth (calculation) variant.
2. Pulse band cutoffs — the thresholds are a frontend invention.
3. A Help & support destination — the menu row is drawn, no screen exists.
4. Consent state on the teacher roster.
5. Which `UploadStage` value maps to which drawn ladder rung.
6. **D02's editable contact field** — the frame draws it editable; the backend binds the
   code to the school's contact, so editable would let a link-holder redirect it.
7. **SMS copy for D02** — the frame is email-only; Nigeria is SMS-first.
8. Error states for activation, Ask Nevo history and feedback — written in-house.

## D. Not a gap — do not re-open

- `/teacher/notifications`, `/teacher/students`, `/teacher/onboarding` all redirect
  **deliberately**; the last replaced a simulation that showed 89 invented students to
  anonymous visitors and wrote a token-less `nevo.role=teacher` cookie.
- C01 Step 1 "verify email" — the invite link *is* the verification.
- No class-wide broadcast in compose — ruled out for v1 by the frame.
- Flag sparkline and second action — deferred to v1.5 by design.
- Engine params never rendered — Zero-Tag ruling.
- `DELETE /ask-nevo/threads/{id}` and `DELETE /assignments/{id}` unwrapped on reasoning.
- Email read-only in the profile modal — "Managed by your school".
- Ask Nevo history has no fixture fallback — a fabricated conversation is words put in
  the teacher's mouth, and no sample mark makes that acceptable.
- `not_enough_yet` on the growth view is a correct state, not missing data.
- A parent who withdrew is never re-asked.
- **No notification filter.** C13 draws none — it is "a calm reverse-chronological
  popover", unread carrying a soft tint and nothing else. An earlier version of this file
  listed a missing `category` field as a backend ask; there is no control for it to feed,
  and `NotificationType` already carries nine values if one is ever drawn.

---

## The cross-cutting caveat

**No write path in either console is exercised end to end by any test.** The signed-in
E2E suite has never run once — `gh api repos/:owner/:repo/actions/secrets` returns
`{"total_count":0}`, so `test.skip(!EMAIL || !PASSWORD)` fires every run. The four gates
that do run (types, lint, unit, contract) are real. The gate everyone cites as proof that
no real teacher sees invented data is not running — and on Home it would pass even if it
were, because Home emits no sample marks to count.
