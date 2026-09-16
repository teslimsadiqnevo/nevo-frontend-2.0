# Console inventory — what is undone

**Teacher and parent consoles. Re-verified 16 Sep 2026 against `main` @ `64a74b0` and the
deployed spec (v2.0.0, 188 paths, 343 schemas, 205 operations).**

*A stamp naming a commit is worth more than a date. If `git rev-parse origin/main` no longer
returns the SHA above, some of what follows is older than the code.*

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

**Re-verified 16 Sep, and this file was wrong in nine places.** Every open item was read
back against `origin/main` and the deployed spec, and every verdict of "done", "blocked"
or a changed size was then adversarially checked; three of those checks overturned the
first answer. What it found:

- **Four items were already done** — the paused-teacher message (teacher half), Home's
  sample marks, the variant-review entry point, and the expired parent consent token. One
  had been finished for two days. Four afternoons would have gone on rediscovering them.
- **Two real blockers were not written down anywhere.** Session detail is blocked on
  ADDRESSING, not shape (list B, item 0b). Help & support is blocked on CONTENT: two of
  design's three facts — the WhatsApp number and the support response time — exist nowhere
  in the repo, and neither can be borrowed without inventing a commitment.
- **Six sizes were wrong**, in both directions.
- **Two recorded blockers had expired**: the class-code route's DESIGN attribution, and the
  design blocker on the revoked session-end state (the frame was added 10 Sep).

*The lesson generalises: this file drifts the same way the code comments do, and re-reading
it against the repo is itself work that has to be repeated.*

### Re-verified again, later on 16 Sep — five rows wrong, and a pattern underneath them

All 36 teacher rows were read back against `d0ae9fd`, every claim of drift was then given to
a separate reader told to REFUTE it, and **11 of 16 claimed corrections did not survive that
second pass**. Recording that ratio matters more than the corrections: a single read of this
file against the code produces roughly two false corrections for every true one, so
"I checked and the doc is wrong" is not on its own grounds to edit a row.

The five that survived are folded into the rows below. Two moved the wrong way — **Upload
module review from FIXTURE-ONLY to NOT BUILT, and Bulk ingestion from LIVE to PARTIAL** —
which is the first time this file has had to demote a row it had marked done.

**The new finding is a category this file had no column for: unmarked fixture leaks.** Five
surfaces hand a signed-in teacher invented data, and because they are not wrapped in
`SampleRegion` the E2E assertion that exists to catch exactly this cannot see them. They are
listed in section E. A verdict of LIVE in the table means *the live read is wired*; it has
never meant *nothing invented reaches the teacher*, and on four rows those two are different.

**Both halves of this file must be audited, not just the table.** Line 167 said the
assignment note "waits on backend" while lines 98 and 240-248 of the same file said it
shipped. The 16 Sep pass rewrote the table rows and never touched the numbered backlog, so
the contradiction survived a re-verification specifically looking for it.

---

## Teacher console

| Screen | Verdict | What is missing | Blocked by | Size |
|---|---|---|---|---|
| Ask Nevo drawer | LIVE | — (entry prompts are static UI copy) | NONE | — |
| Bulk curriculum ingestion | **PARTIAL** | **Demoted 16 Sep**, and the empty cell was hiding three things. (1) **Fixture leak on the live path**: `BulkIngestion.tsx:329-349` shows "{sorted} of 13 lessons sorted" with a 0%-width bar for the whole of a real batch — `TOTAL` is the hardcoded 13 at :48 and only `runDemo` ever increments `sorted`, while `startParse` never touches it. (2) Two dead controls: "Import from Google Drive" (:308) and "Import from OneDrive" (:317), both `<button>` with no handler. (3) `loadTitles` (:92-107) fires once, immediately after the batch POST resolves, and never retries — `lessonTitle` cannot exist before the parse has read the file, so nearly every row falls back to the filename and the 3 Sep title feature is effectively off | FRONTEND | S |
| Connect threads | LIVE | — | NONE | — |
| Feedback panel | LIVE | — (no test on the write) | NONE | — |
| Upload scope + file | LIVE | — | NONE | — |
| Teacher activation | LIVE | — (copy signed off 14 Sep) | NONE | — |
| Password reset | LIVE | Error states unsigned-off | DESIGN | S |
| Session expired door | LIVE | Only the "expired" variant. **Two corrections, 16 Sep.** The code set is **FIVE**, not four — `invalid_session` is in the deployed spec alongside `session_expired`, `session_revoked`, `session_replaced` and `account_paused`. And "none is consumed anywhere" was **false**: `account_paused` is consumed at all four sign-in doors via `loginFailure.ts:38` (`auth/login/page.tsx:171`, `ReturningSignInScreen.tsx:187`, `TeacherSignIn.tsx:153`, `AdminSignIn.tsx:220`). What is true is that none is consumed on the SESSION path, because `handleAuthFailure` is exempted from `/auth/login`, and `ConsoleSessionExpired` takes only `signInHref`. Carrying a reason means changing `client.ts`, which all three consoles route through. Design HAS drawn revoked (`student/28a Session Ended - Revoked`, 10 Sep) — only `session_replaced` and `account_paused` remain undrawn for the console | FRONTEND | **M** |
| Lesson library | LIVE | Subject pills hidden. `subject` landed on the upload body 15 Sep, so this is ours now — but it is **M**: the field has to be sent, stored, read back and filtered on, and two code comments still assert the endpoint cannot take it | FRONTEND | **M** |
| Notifications panel | LIVE | — | NONE | — |
| Feedback panel copy | LIVE | — (counter already present at the last 200 chars; design to confirm the threshold) | NONE | — |
| Class code / QR | **LIVE** | — **Standalone route built 16 Sep** at `/teacher/classes/{classId}/code`; "Show full screen" now navigates rather than opening an overlay with no URL. Historical note, kept because it cost time: **"Dialog only" is loose shorthand and would send someone to rebuild a screen that exists**: `ClassQrScreen` — the full-screen projection the standalone route is FOR — is already built and mounted from live class detail (`LiveClassDetail.tsx:358-364`, via the dialog's `onProject` at :355). What is missing is a URL that links and reopens, not the screen. Design ruled 15 Sep to build it (section C) | NONE | — |
| Sign-in | LIVE | — (`classifyLoginFailure` wired 14 Sep: a paused account is told the account is not open, a throttled one to wait. Re-verified 16 Sep.) The admin door was the last one left and is **DONE 16 Sep** — `AdminSignIn.tsx:220` classifies too, with its own paused line because the teacher's names an authority a proprietor does not have. **All four doors now classify**: `auth/login/page.tsx:171`, `ReturningSignInScreen.tsx:187`, `TeacherSignIn.tsx:153`, `AdminSignIn.tsx:220`. ~~Still open — fixture leak #1~~ **CLOSED same day, #408** (`377ca27`): the hardcoded "Corona Secondary School · Lagos" eyebrow is gone and a comment at `TeacherSignIn.tsx:215` records why no school is named pre-auth. Section E's leak #1 is done; the other four stand | NONE | — |
| Console shell + nav rail | PARTIAL | Role label is `MOCK_TEACHER.role` unconditionally; Help & support has no destination | FRONTEND; DESIGN | S |
| My Classes list | PARTIAL | Card carries no subjects, headcount or summary line. **Split 16 Sep: these are not one job.** Headcount is ours — `ClassLearningPulseResponse.studentCount` is required on `GET /api/v1/teachers/me/home`, already called. **Subjects has no teacher-readable source**: the only schema carrying `subjects` is `ClassSummaryResponse`, and both operations returning it are tagged "school administration"; it is not even in that schema's `required` list. The subjects leg is a backend/scope ask, not an afternoon. **Headcount built 16 Sep** from the home read's `studentCount`, and the fixture leak is marked (section E). Only subjects remains, and it is not ours | **BACKEND (subjects)** | ask |
| Class detail + roster | **LIVE** | — **Lessons tab built 16 Sep**; Activity is RULED OUT, not missing. Design: a per-class activity feed "is a surveillance surface by default and we have nothing that needs it." The Lessons tab shipped because design made it conditional on whether the library can be filtered by class, and it cannot: `GET /api/content/lessons` takes `limit` and `scope` only, `LessonScope` is `mine or school`, `LessonSummaryResponse` carries no class. `GET /api/v1/assignments?classId=` answers it instead. Read-only by ruling | NONE | — |
| Compose message | PARTIAL | **Reasons corrected 16 Sep; the M stands.** Two of the three fixture sites were already fixed — `ComposeModal:69` and `:108` are both gated on `signedIn`, so only `ConnectView:108` survives. The deep-link defect is WORSE than "carries no query": `ConnectView.tsx:113-115` derives `composeOpen` from `Boolean(params.get("student"))`, so with no query **compose does not open at all** and "Send them a message" is a bare nav to the Connect index. Second call site, unrecorded until now: `LiveFlagCard.tsx:106` has the same query-less href, and `LiveFlagCard.test.tsx:126` asserts it as correct — a test locks the bug in. The fix is not a prop: fixture ids are name slugs resolved by `studentSlug(s.name)`, a live id is a roster UUID, so the resolver has to move to `useStudentDirectory` | FRONTEND | **M** |
| Home dashboard | PARTIAL | class trio subject/status; activity counts (`completedCount`/`totalCount` landed 15 Sep, both nullable); "Good to know" | FRONTEND; DESIGN (cutoffs) | M |
| Insights | PARTIAL | **Design ruled 16 Sep and the ruling cannot be built on the current contract — see the note below this table.** The engine is to own the threshold, `weeklySummary`/`lookingAhead` nullable, absence meaning "render the empty state". Both are **required, non-nullable `string`** on the deployed `ClassInsightsNarrativeResponse`, so the engine has no way to send nothing. Per-student recommendations still fan out | **BACKEND (nullability)**; FRONTEND | M |
| Student profile | PARTIAL | 3 of 4 drawn actions live (message, recommend, share). The 4th is a session row opening C08d and it is **not startable** — backend addressing, list B item 0b. ~~"now unblocked"~~ was wrong and optimistic: it was written on 15 Sep when only the response SHAPE had been checked, and survived the 16 Sep pass. No noticing banner; the live banner is the `openFlagCount` callout to `/teacher/dashboard`, not C08's per-student prose | FRONTEND (banner); **BACKEND (session detail)** | M |
| Lesson detail | PARTIAL | Multi-class reports first class only. (The variant-review entry point shipped 14 Sep — re-verified 16 Sep, it renders once per section) | FRONTEND; DESIGN | S |
| Lesson assignment wizard | LIVE | — ("Specific students" built 15 Sep on `useStudentDirectory`, keyed by `studentId`) | NONE | — |
| Variant review | PARTIAL | No 5th-variant tab; no audio player. (Reachable since 14 Sep — the "no entry point" line was stale for two days) | FRONTEND; DESIGN; CONTENT | S |
| Parse fallback | PARTIAL | 2 of 4 states live; `partial`/`noBoundary` unreachable signed in | BACKEND | M |
| Teacher onboarding | PARTIAL | Redirect covers password only; join-confirm + profile-setup unbuilt | FRONTEND | M |
| Profile & settings | PARTIAL | "Change photo" is a `<button>` with no `onClick` — the only dead control in the profile menu. `profileImageUrl` and the upload endpoint landed 15 Sep | FRONTEND | **M** |
| Parse progress ladder | LIVE | — (three rungs keyed to `UploadStage`, driven by the live stage; design ruling 14 Sep) | NONE | — |
| Upload module / section review | **NOT BUILT** | **Demoted 16 Sep.** A signed-in teacher never sees the Photosynthesis six: `SectionReview` is dead code, reachable only through `runMockBeats`, gated on `!getToken()`. The live path always sets `parsed` and renders the read-only `UploadResult` instead (`UploadWizard.tsx:394-409`, :282-294). So on live there is **no module review at all** — no split, no merge, no rename, no re-order, no "keep it as one flow". The task is to build it, not to wire a fixture up | FRONTEND | **L** |
| Structure preview (standalone) | FIXTURE-ONLY | Orphaned duplicate serving fixtures to signed-in teachers. **It IS session-gated** (`proxy.ts` covers `/teacher/*`) — that half of the line was false | FRONTEND | S |
| Student observations (C16b) | LIVE | — (built 15 Sep: chips, seat, and the two markers) | NONE | — |
| Recommend a lesson | PARTIAL | Built and live 15 Sep, note box included. The "Suggested" badge stays blocked — `Recommendation` is prose with no lesson id. The note is sent and stored; **no student screen renders it yet**, so the confirmation stops short of C08c's "She'll see your note when she opens it". **Fixture leak fixed 16 Sep**: the sheet offered eight invented lessons on a failed read, and its honest-empty copy was unreachable | BACKEND (badge); STUDENT CONSOLE (render) | S |
| Share with Learning Support | LIVE | — (built 15 Sep on `POST /api/v1/escalations`: `LiveShareSheet`, confirmed per C14 B5. The SENCo cannot yet SEE what arrives — see below) | NONE | — |
| Session detail | NOT BUILT | The read landed 15 Sep, but **nothing hands a teacher a session id** to call it with — see list B. C08d's panel is frame-complete and mounted only for signed-out visitors | BACKEND (addressing) | M |
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

## Design rulings, 16 Sep — and one that cannot be built yet

**1. Class insights narrative. THE RULING IS RIGHT AND THE CONTRACT WILL NOT CARRY IT.**
Design ruled the same design as the observation count: the engine owns the threshold,
`weeklySummary` and `lookingAhead` are nullable, and **absence is the instruction** — if the
engine cannot support a summary it sends nothing and we render the empty state. Nothing
derived from row counts on our side.

The deployed `ClassInsightsNarrativeResponse` declares both as `{"type": "string"}` and lists
both in `required`. **Non-nullable and mandatory**, so the engine has no way to send nothing
and the empty state is unreachable — the same shape of bug as the recommend sheet's
unreachable copy, one layer down. Building to the ruling today would mean the frontend
inventing a threshold, which is the exact thing the ruling forbids.

**The ask is one line: make `weeklySummary` and `lookingAhead` nullable.** Until then this
row is backend-blocked, not frontend work.

The empty copy, for when it lands: *"No summary this week. Nevo writes one when there is
enough in a week to say something useful."* Note it is about the WEEK, never the class —
design was explicit that "this class has been quiet" is a finding we have no grounds for. One
empty state covers a quiet week and a new class both; design does not want them
distinguished, so no signal is needed for it.

**2. Session-end states: FOUR screens, not five.**
- `session_expired` and `invalid_session` share the ordinary end-of-session screen. Invalid
  means a malformed or unknown token, which is either our bug or tampering, and neither is
  something to put in front of a teacher.
- `session_revoked` as drawn.
- `session_replaced` gets its own screen and says plainly that they signed in on another
  device — the one state where the honest wording matters, because if it was not them they
  need to know.
- `account_paused` is **not a session state and must not look like one**. Same frame as the
  paused learner, one level up: it points at the school administrator, and carries **no retry
  button**, because retrying does nothing.

**3. Class-wide messaging: OUT for v1, confirmed.** Compose is scored complete against the
frame; the transport capability (`messages.ts:14` types the union, `deliver` already takes
`"class"`) is a **deliberate deferral**, recorded in section D. Design's reasoning is worth
keeping: a one-to-one message exists because something triggered it and is attached to that.
A broadcast has no trigger, duplicates channels the school already runs, and sends messages
to families the school never approved. That is a school's decision, not a feature we ship
because the transport allows it.

**4. Lessons tab: IN for v1, and built 16 Sep.** Design made it conditional on one fact —
whether the library can be filtered by class. It cannot, so a teacher had no way to answer
"what has this class been given", which they ask every week. Read-only, with status; no
authoring, because the Library stays the only place a lesson is created. **Activity is out
either way.**

Design also asked that the signed-out sample class screen stop drawing three tabs the
product does not have: "a sample screen is a promise, so either it matches what we ship or
it changes." Changed 16 Sep — `ClassDetail.tsx` now draws Roster and Lessons.

---

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

**Read section E first.** The five fixture leaks found on 16 Sep are all S, all buildable
today, and one of them — the sign-in door naming Corona Secondary School to every teacher in
the country — is the single most embarrassing thing in this console and a smaller fix than
anything numbered below. They are listed there rather than here because they share one cause
and are best done as a sweep.

1. ~~**Paused teacher told their password is wrong.**~~ **BOTH HALVES DONE.** Teacher
   14 Sep, admin 16 Sep; all four doors now classify. The admin half was taken here
   rather than left flagged, because it locks a proprietor out of their own school with
   the correct password and there is nobody above them to ask. **Its paused line is not
   the teacher's** — "your school admin can tell you more" is a circle when the person
   reading it IS the school admin, so the admin line offers a colleague holding `team`
   and then `support@nevolearning.com`. The refusal cannot tell a SENCo from a sole
   proprietor, so it serves both. Nine tests in `AdminSignIn.dom.test.tsx`.
2. ~~**Parent sign-in (D03).**~~ **DONE 14 Sep.** Built at `/parent-sign-in`; the portal's
   signed-out screen offers it rather than pointing at a link that may have expired.
3. ~~**Student observations (C16b).**~~ **DONE 15 Sep.** Chips imported from
   `lib/constants/observations.ts` rather than restated; seat context shown; the two
   markers labelled rather than coloured.
4. ~~**Home sample marks.**~~ **DONE 15 Sep**, re-verified 16 Sep. The four regions
   (`teacher:home-pulse`, `-flags`, `-activity`, `-good-to-know`) are on main, so the E2E
   assertion cited as proof that no teacher sees invented data is no longer vacuous on the
   dashboard. It would now fail if Home stopped marking.
5. ~~**Variant review entry point.**~~ **DONE 14 Sep**, re-verified 16 Sep. The screen is
   reachable from lesson detail, once per section. This line stayed open for two days after
   the work landed, which is the same failure this file exists to stop.
6. ~~**"Specific students" in the assign wizard.**~~ **DONE 15 Sep.** The guard refused
   on a premise that had stopped being true; `useStudentDirectory` already had the ids.
7. ~~**Recommend a lesson.**~~ **DONE 15 Sep.** Reused `assignmentsApi.create` rather
   than wrapping a second path. **Corrected 16 Sep:** the note field does NOT wait on
   backend — it shipped the same day (see the table row and item 19), and this clause
   contradicted two other places in this file for a day. Only the "Suggested" badge waits.
8. **Class headcount** — a join on `classId` against data rendered two sections up. **S**
9. **Revoked session-end variant.** **M** — re-sized 14 Sep, re-verified 16 Sep. The
   four codes are consumed nowhere, `ConsoleSessionExpired` has no reason prop, and the
   plumbing runs through `client.ts`, which student and admin share.
   **Not design-blocked.** `student/28a Session Ended - Revoked` was added 10 Sep and its
   headline is verbatim what `ConsoleSessionExpired` already renders, so the revoked state
   composes by DELETING the inactivity sentence. `session_replaced` and `account_paused`
   console copy are genuinely undrawn; revoked is not, and can ship first.
   **Do `client.ts` first, not last.** The student "expired" door is already live and
   routed, so a student-only change delivers nothing visible — the code at `client.ts:244`
   is the only place any of the four reasons exists, and everything else waits on it.
10. **Connect deep link.** **M, not S** — re-sized 14 Sep. The preset is fixture-bound in
    three places across two components, and the profile link sends no query at all, so
    this is a preset-resolution change rather than a one-line href.
11. **Delete or re-point `/teacher/lessons/upload/structure`.** **S** — confirmed 16 Sep
    after a re-size to M was itself refuted. C07e draws "Open and steer" as a *button with an
    onClick*, not a link: the standalone URL was this repo's invention, so the honest
    re-point is a prop on `ParseProgress` flipping to the `LiveStructureTree` the wizard
    already renders one branch away. No new route, no resumable hook, no shared seam.
12. **Calculation variant tab (SCRUM-136).** Ruled 14 Sep. The fifth form a student can
    receive, which a teacher currently cannot preview at all. **M**
13. **D02 SMS and email copy**, to design's exact strings, plus "Send it again". **S**
14. ~~**Teacher-side active/inactive indicator.**~~ **DONE 16 Sep.** The roster marks
    "Invited" and "Deactivated" and says nothing on an active row. Outlined and muted, not
    coloured: admin draws this pill violet, and violet on this row already means "has a
    learning profile" - a third meaning on one colour is how a teacher acts on the wrong
    one. Words, like the C16b markers beside it. `accountStatus` narrows the wire value and
    resolves anything unrecognised to `invited`, never `deactivated`, because telling a
    teacher a real child is switched off on a value we did not recognise is the failure
    that matters. Copy lives in `lib/constants/accountStatus.ts` with a test that fails on
    consent vocabulary, on giving a reason, and on any instruction the teacher cannot act
    on (`deactivate` and `restore` are both tagged "school administration").
    The old **M** sizing was right, and the notes below are why.
    **No backend work at all.** `ClassStudentResponse.status` is a REQUIRED property of
    `GET /api/v1/classes/{class_id}/students`, typed `UserStatus` = `active | invited |
    deactivated`. It is already fetched, already typed, and thrown away at render:
    `student.status` appears nowhere in `LiveClassDetail.tsx`, while `profileStatus`,
    `seatContext`, `observations` and `flags` are all read. The comment at
    `classes.ts:80-82` is false on both halves. Today two rows look identical whether or
    not the child can actually use Nevo.
15. **Help & support screen** — email, WhatsApp, response time. **S to build, but
    CONTENT-BLOCKED.** Re-verified 16 Sep: the support email exists
    (`support@nevolearning.com`, hardcoded in five places). The WhatsApp number does NOT —
    every `+234` string in the repo is school or parent fixture data, and there is no
    `wa.me` link anywhere. Nor does a support response time: the two response-time strings
    that exist are a landing-page sales promise and an NDPA 48-hour data-objection SLA, and
    borrowing either would invent a commitment Nevo has not made. **Someone has to supply
    the number and the turnaround.** Until then the nav item closes the menu and does
    nothing, which is the one route out of the console when something goes wrong.
16. **Standalone class-code route**, and the assign-wizard class selector. **M**
17. **Parent polish** — name the recipient in D01c, school attribution on D15d, link
    `/parent-portal` from somewhere. **M, not S** — re-sized 16 Sep. Three independent legs
    across two lanes, and one of them (D01c's recipient) needs a content answer first: the
    frame names an email address, but the payload field is `parentContact`, which may hold
    a phone number. Naming an address for an SMS-only parent is not a frontend decision.

### Unblocked 15 Sep — these were list B this morning

~~Sizes are first-pass, read off the shape of the endpoint rather than a written plan.~~
**Re-verified 16 Sep against the code, so the sizes below are now measured rather than
guessed** — and three of the ten moved: two were re-sized S to M, one (27) was already
done, and one (26) turned out to be blocked on addressing rather than buildable. Of the
eleven deliveries, **two of the eleven need no frontend work**: gender-neutral growth
statements, and the expired consent token, which was already handled.

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
20. **Class Insights narrative.** `weeklySummary` and `lookingAhead` at
    `GET /api/v1/classes/{class_id}/insights`. **M** — re-verified 16 Sep. The endpoint is
    live and unwrapped; there is no backend blocker. The real obstacle is a SHAPE MISMATCH
    between what the frame draws and what the endpoint returns, plus no signal for when the
    narrative should be shown at all. That is a **design ruling**, not a backend ask. The
    screen is not wholly fixture-backed either — three sections already render real data.
21. **Per-row completion on recent activity.** `completedCount` / `totalCount`, both
    nullable — so the row must still render when they are absent. **S**, confirmed 16 Sep:
    clean, no blocker, and the field has to go onto `ActivityRow` in `teacherHome.ts` or a
    missing client type will silently drop it, exactly as `note` was dropped on
    `Assignment`. Today Home's LIVE activity list is strictly poorer than the sample one
    the same screen shows when the read fails.
22. **`failedPages`.** **M, not S** — re-sized 16 Sep, **and the premise above is false**:
    there is no `retryPages` control asking for page numbers nobody can supply. The field
    and the retry endpoint are both deployed; what is missing is the whole seam from poll to
    a per-page retry affordance. Today a teacher whose PDF was partly unreadable gets either
    a structure tree with pages silently missing, or a flat "we could not read that one".
23. **`subject` on upload.** **M, not S** — re-sized 16 Sep. Five files and a seam: the
    field has to be sent on the multipart body, carried into the lesson, read back and
    filtered on, or the subject pills stay hidden and nothing is gained. Two code comments
    (`useLessonLibrary.ts:36-38` and one in `content.ts`) still assert the endpoint cannot
    take a subject; both are now false.
24. **Profile photo.** Read `profileImageUrl`, then `POST /api/v1/users/me/profile-photo`
    (multipart, key `file`). **M**, confirmed 16 Sep, no blocker. "Change photo" is the only
    dead control in the profile menu — a `<button>` with no `onClick`.
25. **Teacher-initiated SSO.** `slug` on `SchoolCodeResponse`. **M**, confirmed 16 Sep,
    with two caveats that are real but not fatal: the teacher door has **no school-code step
    at all** today, and `AuthMethod` is `email_password | pin | sso` — so the response says
    a school uses SSO but not WHICH provider, and the client has to branch on that. Today an
    SSO-school teacher is simply told school sign-in is not set up.
26. **Per-student session detail.** ~~**M/L**~~ **BLOCKED — moved to list B, item 0b.**
    Re-verified 16 Sep and this is the one item on this list that cannot start. The response
    SHAPE landed; the ADDRESSING did not. `GET /students/{student_id}/sessions/{session_id}`
    wants a session uuid, and **nothing a teacher can read returns one**: the recent-sessions
    row type has no session id, `ClassStudentResponse.latestSessionAt` is a timestamp, and
    the activity-feed id is an untyped string with no stated relation to a session. The
    panel itself is frame-complete and mounted only for signed-out visitors, so once the id
    exists this is **M**, mostly wiring.
27. ~~**Expired parent consent token.**~~ **ALREADY DONE** — re-verified 16 Sep. Whoever
    built the parent portal handled the 404 before backend documented it, and the deployed
    spec has since caught up. Nothing to build; a parent already gets the terminal screen.

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

**Four remain** — two from 15 Sep, one created by shipping the teacher half of escalations,
and one found on 16 Sep by re-verifying a delivery that was recorded as complete.

0b. **Nothing hands a teacher a session id.** Found 16 Sep. The per-student session read
    was delivered on 15 Sep and ticked off, but only its RESPONSE shape was checked. The
    ADDRESSING is missing: `GET /api/v1/students/{student_id}/sessions/{session_id}` takes
    a `session_id` of `format: uuid`, and every schema in the deployed spec was enumerated
    for a session-id property — the only carriers are student-client writes, the caller's
    own auth session, and `StudentSessionDetailResponse` itself, which you cannot read
    without already holding the id. The list the panel would open from has no session id;
    `ClassStudentResponse.latestSessionAt` is a timestamp; the activity-feed id is a bare
    string with no stated relation to a session and no uuid format, so it is not a safe
    substitute; and `lessonId` is a separate entity on the same response. **The ask is one
    line: a session id on each recent-session row, or a
    `GET /api/v1/students/{student_id}/sessions` list.** Everything else for C08d is
    frontend work, and the panel is already frame-complete.

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
4. ~~Consent on the teacher roster~~ → **no consent column, ever**. The ruling rested
   on the Deactivated pill already telling a teacher why a child cannot get in, and that
   pill was on the ADMIN roster, not the teacher one. **That dependency is now met**
   (16 Sep): the roster marks "Invited" and "Deactivated", no consent, no reason, just
   whether the child is active - which is the ruling's own wording, and the whole of the
   design brief, because no teacher-facing frame draws this state at all.
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
- No class-wide broadcast in compose — **ruled out for v1, re-confirmed by design 16 Sep**, and the transport capability is a deliberate deferral rather than an oversight. Reasoning in the rulings section above. The earlier tension in this file is resolved: Compose is scored COMPLETE against the frame, and its sizing excludes class addressing. Previous note, kept for the record: **Note the tension,
  flagged 16 Sep:** the Compose row scores "cannot address a class" as an open gap feeding
  its M sizing, while this line rules it out. The code sides with this line
  (`ConnectView.tsx:217-219` hardcodes `recipientType: "student"`) but the transport is
  already there — `messages.ts:14` types the union and `ConnectView.tsx:166-170` `deliver`
  already takes `"class"`. This wants a ruling, not a size. Until it gets one, the Compose
  row's M should be read as excluding it.
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

## E. Unmarked fixture leaks — found 16 Sep

**A LIVE verdict in the table means the live read is wired. It has never meant that nothing
invented reaches the teacher, and on these rows those are different facts.** Every one of
these renders fixture data to a signed-in teacher WITHOUT a `SampleRegion` wrapper, so
`e2e/teacher-signed-in.spec.ts` — the one test whose entire purpose is "a signed-in teacher
is never shown invented data" — cannot see them. Its assertion is vacuous on each.

Ordered by what a teacher would actually believe.

1. ~~**The sign-in door names one school to every teacher in the country.**~~ **DONE — #408
   (`377ca27`), the same day it was found.** `TeacherSignIn.tsx` hardcoded the eyebrow
   "Corona Secondary School · Lagos" above "Welcome back", and `TeacherSsoCallback.tsx:8,133`
   rendered "Signing you in through {TEACHER_INVITE.school}" from
   `lib/mocks/teacherOnboarding.ts:18-24`. Both are gone; a comment at `TeacherSignIn.tsx:215`
   records why no school is named before auth. **Four leaks remain, 2–5 below.**
2. **The recommend sheet offers eight invented lessons as the teacher's own library.**
   `useLessonLibrary` returns `FIXTURE_CARDS` whenever the read is in flight OR has failed
   (`useLessonLibrary.ts:201-203`); `LiveRecommendSheet.tsx:61` destructures only
   `{ cards, live }` and never surfaces `sample`, and its honest-empty branch
   (`cards.length === 0`) is unreachable while eight fixtures exist. The Library screen marks
   the identical fallback; the sheet does not. Pressing Recommend posts a slug where the spec
   wants a uuid, so it 422s and nothing is falsely confirmed — but the teacher chose from
   sample data believing it was theirs. The sheet's test mocks the hook wholesale, so this
   path is untested. **S.**
3. **My Classes renders three invented classes with headcounts.** `ClassesList.tsx:117,163`
   renders `TEACHER_CLASSES` — "JSS 2A, 28 students, 2 worth a glance, 1 flagged" — on a
   failed read, and imports `SampleRegion` nowhere, while every other teacher fallback is
   marked (Home ×4, `ClassRoute:57`, `InsightsView:166`, `LessonRoute:110`, `StudentRoute:102`).
   There IS a visible italic banner saying these are samples, so this is a test-coverage hole
   rather than a silent lie. **S.**
4. **Bulk ingestion's frozen progress bar.** See the table row. **S.**
5. **The assign wizard can POST a fixture class id.** `AssignWizard.tsx:171` destructures
   `{options, sample}` and never reads `loading`, so during the in-flight window a teacher
   sees invented classes with no notice, and the confirm guard at :261 tests `sample`
   (failure only), not `loading`. A class picked in that window is a fixture id sent to
   `/api/v1/assignments`. Step 1 has the same flash but IS caught at confirm by the `!live`
   guard at :267 — so the fix is known and already applied one screen away. **S.**

**The shared cause is that `sample` and `loading` are different states and only `sample` is
ever checked.** A fallback that renders during load is invisible to a guard that only tests
for failure. Worth one sweep rather than five fixes.

## F. Things a next reader would waste a day on — found 16 Sep

- **`ClassQrScreen` already exists.** See the Class code row.
- **Three comments still say the insights endpoint does not exist** — `useClassInsights.ts:16`,
  `LiveClassInsights.tsx:13-16`, `teacherInsights.ts:14-22` ("NO SUCH ENDPOINT WAS EVER
  ADDED, and none is needed"). All three are false against the deployed spec. Anyone starting
  that task from the code concludes it is blocked.
- **The variant audio player's blocker has expired.** `LiveVariantReview.tsx:47-51` defers it
  until "there is a refresh path through `POST /api/content/media/url`". That path is
  deployed, `contentApi.mediaUrl` exists (`content.ts:155-156`), and `mediaUrlExpired` exists
  (`variants.ts:153`). Nothing calls any of them. Unwritten frontend work, not a dependency.
- **`VariantReviewRoute.tsx:27-33`** still says "Nothing consumes `variantsApi` yet, which is
  why this still renders" and carries a `TODO(fe)` to build what is built 40 lines below. The
  named export does not exist at all.
- **`EditProfileModal.tsx:89`** still says `TODO(api): photo upload - the frame draws the
  affordance only`, while this file records the endpoint as landed 15 Sep.
- **`uploadsApi.retryPages` is dead API surface** — no caller anywhere — and the backend proxy
  already grants it the 4-minute long-running budget for a request nothing makes. Meanwhile
  `failedPages` is deployed and **missing from the client type** (`uploads.ts:89-103`), so the
  poll silently drops it. Third instance of the pattern that dropped `note` on `Assignment`
  and `completedCount` on `ActivityRow`.
- **A dead session-ended route.** `src/app/auth/session-ended/page.tsx:8-10` mounts the
  student screen with a hardcoded `variant="concurrent"`. Nothing navigates to it. The one
  screen already shaped like a `session_replaced` answer is unreachable while `client.ts`
  sends every 401 to the generic expired door.

## G. Corrections to section B, found 16 Sep

- **The 401 code set is FIVE, not four.** The spec's 401 description adds `invalid_session`
  ("a token that was never valid") alongside the four this file lists. A reason-carrying door
  has one more branch than list A item 9 budgets for.
- **"None of the four codes is consumed anywhere" is literally false.** `account_paused` IS
  consumed, at the login doors (`loginFailure.ts:38`, `TeacherSignIn.tsx:155`) — which this
  file's own Sign-in row records. The accurate statement is that none is consumed on the
  SESSION path, because `handleAuthFailure` is exempted from `/auth/login` (`client.ts:128`).
- **`NotificationCategory` IS deployed — just not where item 10 looks.** The spec defines a
  7-value enum and uses it at `NotificationPreferenceResponse.category`, and both
  `GET` and `PUT /api/v1/notification-preferences` are already consumed
  (`settings.ts:83`, `:96`). So **a teacher can already mute a category while no notification
  can say which category it is in.** Item 10 and section D both frame this as purely a
  filter-control question and neither mentions that the enum shipped on the preferences side.
  That inconsistency is on the wire today.
- **Item 0b understates itself: there is no client wrapper either.** `GET /api/v1/students/
  {student_id}/sessions/{session_id}` is unconsumed and no api-client function for it exists.
  The addressing is the blocker, but it is not the only thing between a teacher and C08d.
- **A genuinely open blocker, written down nowhere: nothing in the spec ENROLS a school in
  SSO.** Every sso path presupposes an existing connection. So even once the teacher door
  reads `slug`, `start` fails for any school that has never connected. (The slug half is
  already dead — `HandoverStep.tsx:70` calls `ssoStart(school.slug, ...)` today.)

---

## The cross-cutting caveat

**No write path in either console is exercised end to end by any test.** The signed-in
E2E suite has never run once — `gh api repos/:owner/:repo/actions/secrets` returns
`{"total_count":0}`, so `test.skip(!EMAIL || !PASSWORD)` fires every run. The four gates
that do run (types, lint, unit, contract) are real. The gate everyone cites as proof that
no real teacher sees invented data is not running — and on Home it would pass even if it
were, because Home emits no sample marks to count.

**Re-checked 16 Sep, and it is weaker than "the secrets are empty".** Repo secrets, BOTH
deployment environments (Preview and Production), and Actions variables are all empty; org
secrets 422 because the repo is not org-owned. There is no path by which those credentials
get populated. **And filling them would not be enough**: `e2e/teacher-signed-in.spec.ts`
contains only READ assertions, so "no write path is tested end to end" would survive.
Separately, section E now records five screens the sample-mark assertion cannot see even
when it runs, so the claim it licenses — "no signed-in teacher sees invented data" — is
narrower than it sounds on four rows besides Home.

**One inert defect worth knowing, because it is the shape the gates cannot catch.**
`LiveRecommendSheet.test.tsx:54` mocks `create` as `{ created: 1 }`; the client types the
response as `{ assignmentIds, createdCount }` and `AssignWizard.test.tsx:72` mocks it
correctly. Two tests, one API, one of the shapes fictional. It is inert only because the
sheet awaits `create` without reading the result, and `tsc` cannot see it because `vi.fn()`
is untyped. The day that sheet reads the count, the test keeps passing and the screen
renders `undefined`.

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
