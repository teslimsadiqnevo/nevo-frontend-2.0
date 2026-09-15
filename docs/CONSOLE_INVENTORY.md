# Console inventory — what is undone

**Teacher and parent consoles. Verified 15 Sep 2026 against `main` @ `3795640` and the
deployed spec (v2.0.0, 188 paths, 343 schemas).**

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

**Updated 15 Sep: that is now true of almost everything.** Backend delivered eleven of the
thirteen items in list B in a single afternoon. Of thirteen backend blockers this morning,
**one remains open** (variant approval) and **one was declined** (`category` on
notifications, now a product question rather than a backend one). Ten new items landed in
list A as a result — see *Unblocked 15 Sep*. The teacher console is no longer
meaningfully waiting on backend; it is waiting on us, and in a few places on design.

---

## Teacher console

| Screen | Verdict | What is missing | Blocked by | Size |
|---|---|---|---|---|
| Ask Nevo drawer | LIVE | — (entry prompts are static UI copy) | NONE | — |
| Bulk curriculum ingestion | LIVE | — | NONE | — |
| Connect threads | LIVE | — | NONE | — |
| Feedback panel | LIVE | — (no test on the write) | NONE | — |
| Upload scope + file | LIVE | — | NONE | — |
| Teacher activation | LIVE | — (copy signed off 14 Sep) | NONE | — |
| Password reset | LIVE | Error states unsigned-off | DESIGN | S |
| Session expired door | LIVE | Only the "expired" variant. Backend now sends four codes (`session_expired`, `session_revoked`, `session_replaced`, `account_paused`); **none is consumed anywhere**, and `ConsoleSessionExpired` takes only `signInHref`. Carrying a reason means changing `client.ts`, which all three consoles route through | FRONTEND | **M** |
| Lesson library | LIVE | Subject pills hidden. `subject` landed on the upload body 15 Sep, so this is ours now | FRONTEND | S |
| Notifications panel | LIVE | — | NONE | — |
| Feedback panel copy | LIVE | — (counter already present at the last 200 chars; design to confirm the threshold) | NONE | — |
| Class code / QR | LIVE | No standalone route; dialog only | DESIGN | S |
| Sign-in | PARTIAL | A paused or rate-limited teacher is told their password is wrong | FRONTEND | S |
| Console shell + nav rail | PARTIAL | Role label is `MOCK_TEACHER.role` unconditionally; Help & support has no destination | FRONTEND; DESIGN | S |
| My Classes list | PARTIAL | Card carries no subjects, headcount or summary line | FRONTEND | S |
| Class detail + roster | PARTIAL | No Lessons or Activity tab. (Chips, seat and the two markers built 15 Sep; the header already carried the headcount) | BACKEND (activity); DESIGN (a Lessons tab) | M |
| Compose message | PARTIAL | Deep link resolves against fixtures in **three** places (`ConnectView:108`, `ComposeModal:69` and `:108`) and the profile link carries no query at all; cannot address a class | FRONTEND | **M** |
| Home dashboard | PARTIAL | **Emits no sample marks at all**; class trio subject/status; activity counts (`completedCount`/`totalCount` landed 15 Sep, both nullable); "Good to know" | FRONTEND; DESIGN (cutoffs) | M |
| Insights | PARTIAL | Written summary and "Looking ahead" both landed 15 Sep at `/classes/{class_id}/insights`; per-student recommendations still fan out | FRONTEND | M |
| Student profile | PARTIAL | 3 of 4 drawn actions now (recommend and share both added 15 Sep); session detail remains, now unblocked; no noticing banner | FRONTEND | M |
| Lesson detail | PARTIAL | No entry point to variant review; multi-class reports first class only | FRONTEND; DESIGN | S |
| Lesson assignment wizard | PARTIAL | "Specific students" refused by a guard whose stated reason is false | FRONTEND | M |
| Variant review | PARTIAL | Live and correct but **no entry point**; no 5th-variant tab; no audio player | FRONTEND; DESIGN; CONTENT | S |
| Parse fallback | PARTIAL | 2 of 4 states live; `partial`/`noBoundary` unreachable signed in | BACKEND | M |
| Teacher onboarding | PARTIAL | Redirect covers password only; join-confirm + profile-setup unbuilt | FRONTEND | M |
| Profile & settings | PARTIAL | "Change photo" is a `<button>` with no `onClick`. `profileImageUrl` and the upload endpoint landed 15 Sep | FRONTEND | S |
| Parse progress ladder | LIVE | — (three rungs keyed to `UploadStage`, driven by the live stage; design ruling 14 Sep) | NONE | — |
| Upload module / section review | FIXTURE-ONLY | Hardcoded Photosynthesis six; every control writes nothing | FRONTEND | M |
| Structure preview (standalone) | FIXTURE-ONLY | Orphaned duplicate; no session gate | FRONTEND | S |
| Student observations (C16b) | LIVE | — (built 15 Sep: chips, seat, and the two markers) | NONE | — |
| Recommend a lesson | PARTIAL | Built and live 15 Sep, note box included. The "Suggested" badge stays blocked — `Recommendation` is prose with no lesson id. The note is sent and stored; **no student screen renders it yet**, so the confirmation stops short of C08c's "She'll see your note when she opens it" | BACKEND (badge); STUDENT CONSOLE (render) | S |
| Share with Learning Support | LIVE | — (built 15 Sep on `POST /api/v1/escalations`: `LiveShareSheet`, confirmed per C14 B5. The SENCo cannot yet SEE what arrives — see below) | NONE | — |
| Session detail | NOT BUILT | The per-student session read landed 15 Sep with `sittings`, `narrative` and unscored `sections` | FRONTEND | M/L |
| SSO callback | NOT BUILT | Component complete and live-wired; `slug` landed on `SchoolCodeResponse` 15 Sep, so the signed-out door can now reach it | FRONTEND | M |
| Notifications page | NOT BUILT | Deliberate redirect — C13 is a popover | NONE | — |
| Students index | NOT BUILT | Deliberate redirect to Classes | NONE | — |


**Variant review, two divergences found 14 Sep.** C07b draws it as ONE screen with segment
*pills* and a "← My Lessons" back link; what is built takes `?section=N`. More
substantially, C07b's stated purpose is that "the teacher reviews each segment's variants
and **approves** them for the class. Approval is manual and deliberate." **There is no
approval transport** — `approve` appears in none of the 188 paths (re-checked 15 Sep) and nowhere in the
document; the only sign-off field is `VisualVariant.reviewedBy`, which is a read. So what
is built is review *without* approval, and the approval half is a backend ask nobody had
made. Added to list B.

## Parent console

| Screen | Verdict | What is missing | Blocked by | Size |
|---|---|---|---|---|
| Parent consent (D01b) | LIVE | — | NONE | — |
| Parent data management (D01c) | LIVE | Does not name the recipient address the frame names | FRONTEND; CONTENT | S |
| Parent growth view (D15d) | LIVE | No school attribution. Backend reported 15 Sep that the statements are already gender-neutral and a regression test holds it — the one delivery of the eleven that cannot be checked against the spec, so it wants a spot-check on real prose before the row is closed | FRONTEND; VERIFY | S |
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
3. ~~**Student observations (C16b).**~~ **DONE 15 Sep.** Chips imported from
   `lib/constants/observations.ts` rather than restated; seat context shown; the two
   markers labelled rather than coloured.
4. **Home sample marks.** Until Home emits them the one E2E assertion cited as proof no
   teacher sees invented data is vacuous on the dashboard. **S**
5. **Variant review entry point.** One prop; a finished, tested screen is URL-only. **S**
6. **"Specific students" in the assign wizard.** Swap `ClassOption.roster` for
   `useClassRoster`, key on `studentId`. **M**
7. ~~**Recommend a lesson.**~~ **DONE 15 Sep.** Reused `assignmentsApi.create` rather
   than wrapping a second path. Note field and "Suggested" badge both wait on backend.
8. **Class headcount** — a join on `classId` against data rendered two sections up. **S**
9. **Revoked session-end variant.** **M, not S** — re-sized 14 Sep on inspection. The
   four codes are consumed nowhere, `ConsoleSessionExpired` has no reason prop, and the
   plumbing runs through `client.ts`, which student and admin share.
10. **Connect deep link.** **M, not S** — re-sized 14 Sep. The preset is fixture-bound in
    three places across two components, and the profile link sends no query at all, so
    this is a preset-resolution change rather than a one-line href.
11. **Delete or re-point `/teacher/lessons/upload/structure`.** **S**
12. **Calculation variant tab (SCRUM-136).** Ruled 14 Sep. The fifth form a student can
    receive, which a teacher currently cannot preview at all. **M**
13. **D02 SMS and email copy**, to design's exact strings, plus "Send it again". **S**
14. **Teacher-side active/inactive indicator.** The dependency the no-consent-column
    ruling now rests on. **M**
15. **Help & support screen** — email, WhatsApp, response time. **S**
16. **Standalone class-code route**, and the assign-wizard class selector. **M**
17. **Parent polish** — name the recipient in D01c, school attribution on D15d, link
    `/parent-portal` from somewhere. **S**

### Unblocked 15 Sep — these were list B this morning

Sizes are first-pass, read off the shape of the endpoint rather than a written plan.
Ten items; the eleventh delivery (gender-neutral growth statements) needs no frontend
work at all.

18. **Teacher→SENCo escalation.** `POST /api/v1/escalations`. The most-asked-for missing
    action on the teacher console, and the one with a child's welfare behind it.
    ~~**M**~~ **DONE 15 Sep.** `LiveShareSheet` posts the escalation; C14 B5's dismiss,
    toast and quiet note all wait on a stored one. `attentionFlagId` is deliberately not
    sent — flags carry ids and this console already reads them, but C.8b never asks the
    teacher which flag they mean, and guessing would tell the SENCo the wrong thing.
    **The receiving half is not built** — see item 0 in list B.
19. ~~**Assignment note.**~~ **DONE 15 Sep, teacher half.** C08c's "Add a note for Amara
    (optional)" box is in the recommend sheet and what it holds is sent. An untouched or
    whitespace-only box sends no `note` key at all, so a child never gets an empty message
    from her teacher. `note: string | null` was also missing from the client's `Assignment`
    type, which would have dropped it before any screen could read it.
    **The child still cannot see it.** `students/me/dashboard` returns the note on every
    assignment row and `useStudentDashboard` passes it straight through, but nothing
    renders it — so the confirmation says the note went with the lesson rather than
    C08c's "She'll see your note when she opens it", and a test guards that wording.
    Raised as a student-console task; when it lands, the copy and that test change.
20. **Class Insights narrative.** `weeklySummary` and `lookingAhead` replace fixture
    prose on a screen that is currently `FIXTURE-ONLY`. **M**
21. **Per-row completion on recent activity.** `completedCount` / `totalCount`, both
    nullable — so the row must still render when they are absent. **S**
22. **`failedPages`.** Makes `retryPages` sourceable; the retry control currently asks for
    page numbers nobody can supply. **S**
23. **`subject` on upload.** **S**
24. **Profile photo.** Read `profileImageUrl`, then the upload endpoint. **M**
25. **Teacher-initiated SSO.** `slug` on `SchoolCodeResponse` completes the signed-out
    door. **M**
26. **Per-student session detail.** `sittings`, `narrative`, unscored `sections`. The
    largest of the ten, and the one whose copy is in a colleague's voice — it renders
    verbatim, so it cannot be paraphrased client-side. **M/L**
27. **Expired parent consent token.** 404 for unknown, revoked and expired is now
    documented, so D03's terminal screen can be built against it rather than guessed. **S**

## B. Blocked on backend — the exact ask

**Eleven of the thirteen were delivered on 15 Sep.** Each line below was re-checked
against the deployed spec that day — this records what the spec shows, not what the mail
said. All eleven are now frontend work and appear in list A.

| Was blocked | Now on the wire |
|---|---|
| 1. Teacher→SENCo transport | `POST /api/v1/escalations` takes `{studentId, note, attentionFlagId?}`; `GET` returns the SENCo view. The recent picture is derived server-side. |
| 2. Per-student session read | `GET /api/v1/students/{student_id}/sessions/{session_id}` → `{sessionId, lessonId, lessonTitle, occurredAt, sittings, narrative, sections}`. The per-section prose we asked for. |
| 3. A note on an assignment | `note` on **both** `AssignmentCreate` and `LessonAssignmentRequest`; `AssignmentResponse` returns it. |
| 4. Profile photo | `profileImageUrl` on `CurrentUserResponse` and `ProfilePatch`; upload at `POST /api/v1/users/me/profile-photo`. |
| 5. Teacher-initiated SSO | `slug` on `SchoolCodeResponse`, alongside `schoolId`, `schoolName`, `authMethod`, `classes`. |
| 6. `failedPages` | `failedPages` on `UploadStatusResponse`. Populated when page-level parsing falls back. |
| 7. Class narrative | `GET /api/v1/classes/{class_id}/insights` → `weeklySummary`, `lookingAhead`. |
| 8. Per-row completion | `completedCount`, `totalCount` on `TeacherRecentActivityResponse`, both nullable. |
| 9. `subject` on upload | `subject` in the multipart body of `POST /api/content/upload`, carried into the lesson. |
| 11. Expired consent token | 404 for unknown, revoked **and** expired, documented in OpenAPI. D03's terminal screen can rely on it. |
| 12. Gendered growth statements | Backend reports the prose is already gender-neutral and a regression test holds it there. **Not spec-verifiable — taken on their word, unlike every other row here.** |

Note the path parameters above: they are `{student_id}` and `{class_id}`, still
snake_case, while every property those endpoints return is now camelCase. That is the
wire, not a typo.

**Three remain** — two from this morning, and one created by shipping the teacher half of escalations.

0. **Nothing acknowledges an escalation.** `EscalationResponse.acknowledged` is a boolean
   on the read, but no endpoint sets it — `POST /api/intelligence/flags/{flag_id}/acknowledge`
   covers Nevo's own flags, not teacher escalations. A SENCo can therefore read a concern
   and has no way to mark it handled, and the teacher is never told it was seen. Ask for
   an acknowledge write, or a ruling that the field is informational.

10. **`category` on `NotificationResponse` — declined.** Backend confirmed on 15 Sep this
    will not be implemented. Re-checked the same day: `NotificationResponse` is
    `{notificationId, recipientId, recipientRole, type, title, description, read,
    createdAt, navigatesTo, archived, archivedAt}` — no category field. Whatever this was
    for must be built on `type` or dropped. **This is now a design/product question, not a
    backend one.**
13. **Variant approval — unanswered.** Backend's reply did not mention it. Re-checked
    15 Sep: no path matches `approve` or `variant`, and no non-GET operation mentions
    either. C07b still says "the teacher reviews each segment's variants and approves them
    for the class", and `VisualVariant.reviewedBy` exists to be written by something.
    Either a write, or a ruling that review is read-only and C07b's copy is stale.

## C. Blocked on design

**All ten were ruled on 14 Sep.** What remains from those rulings is BUILD work, not
waiting, so it has moved to list A. Kept here as the record of what was decided:

1. ~~Fifth variant tab~~ → **build it**, labelled "Calculation", same shape as the others,
   worked steps in sequence and the completion statement beneath. **SCRUM-136.**
2. ~~Pulse band cutoffs~~ → hardcoded is fine for launch since the labels derive from the
   cutoffs. Design is asking backend to serve the threshold so it does not live in the
   console permanently.
3. ~~Help & support~~ → **one screen, not a knowledge base**: support email, WhatsApp
   number, response time.
4. ~~Consent on the teacher roster~~ → **no consent column, ever**. But the ruling rested
   on the Deactivated pill already telling a teacher why a child cannot get in, and that
   pill is on the ADMIN roster, not the teacher one. So the ruling now carries a
   dependency: a teacher-side active/inactive indicator. No consent, no reason, just
   whether the child is active.
5. ~~`UploadStage` → rung mapping~~ → **done 14 Sep**, three rungs, labels below.
6. ~~D02 editable contact~~ → **drop the edit.** Read-only stays; the binding is the
   security property, and a parent who has not proven who they are should not choose
   where the code goes. A different address is a change the school makes on the record.
7. ~~SMS copy for D02~~ → **write both paths properly**, SMS is the path to get right and
   not the fallback. Email: "Check your email. If that address has an account, we've sent
   a code." SMS: "Check your phone. If that number has an account, we've sent a code."
   Resend reads "Send it again" in both.
8. ~~Error states~~ → **ship what we have**; copy revised 14 Sep, see the house rule below.
9. ~~Class selector~~ → **build it.** Defaults to the class navigated from, alphabetical
   first if arrived at directly.
10. ~~Class-code screen~~ → **standalone route.** Teachers project it, read it aloud and
    return to it; a route links and reopens cleanly.

### House rule, applied 14 Sep

**No dashes in Nevo copy, anywhere.** Full stops or commas. 23 instances across the
teacher and parent consoles were corrected. **60 remain in the student and admin
consoles**, which other sessions own.
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

## The wire changed shape, 15 Sep

Alongside the eleven, backend renamed **every schema property** from `snake_case` to
`camelCase`. Main went red at 13:09 and stayed red for three merges. The client was
brought into line in one pass; what matters for anyone reading this file later is that
the rename was **surgical, not blanket**:

- **Schema properties (404)** — now camelCase.
- **Enum values (126)** — *unchanged*. `sudden_change`, `head_teacher`,
  `multiple_choice`, `completed_with_review`, `learning_data` are all still snake_case.
  A find-and-replace across the repo breaks every one of them, silently, because they are
  string values and no type checks them.
- **Path parameters (20 of 24)** — *unchanged*. `GET /api/v1/classes/{class_id}/insights`
  returns `classId`.
- **Query parameters** — camelCase, *except* `concept_id` and `window_days`, which were
  missed. The same endpoint therefore takes one convention and returns the other.

The last two points are open questions with backend, not settled design. The contract gate
caught all of this within minutes of the first merge, which is the argument for it.
