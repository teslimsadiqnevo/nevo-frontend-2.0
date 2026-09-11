# Nevo frontend — what is left

Last updated **11 September 2026**. Written from a survey of the source and the
deployed OpenAPI document, not from tickets.

**Start with the section directly below.** It is the only measured, whole-product
view in this file; everything after it is per-area detail, and some of it predates
that measurement.

Keep this current. Two rules make it useful rather than decorative:

1. **The deployed OpenAPI document is the contract.** Handoff docs have diverged
   from it on every item checked so far — `options` as strings where the schema
   says objects, `position` as an integer where it is a string, "everything
   optional" where `required` lists all seven fields. Run `scripts/api-audit.mjs`
   before believing a summary.
2. **Say which pile a thing is in.** "Not done" hides the difference between work
   we can do today and work nobody can do yet.

---

## WHERE THE PRODUCT ACTUALLY IS — measured 10 Sep

Assessed against the deployed OpenAPI document, the design repo and a worktree
pinned to `origin/main`. Every headline below was re-verified by hand, not taken
from an agent.

**80% of screens are built. Close to 0% of the product is usable end to end**,
because every console is missing its front door. This is not a "last 20%"
problem — it is a small number of missing entrances in front of a great deal of
finished work.

| console   | screens             | usable               | demoable  | hours   |
| --------- | ------------------- | -------------------- | --------- | ------- |
| Student   | 51 / 63             | **no**               | **no**    | 135     |
| Teacher   | 22 / 29             | partly               | with care | 115     |
| Admin     | 41 / 51             | partly               | with care | 80      |
| Parent    | 3 / 3               | **no** (unreachable) | with care | 31      |
| **total** | **117 / 146 (80%)** |                      |           | **361** |

Screen counting is judgement-heavy: two independent passes over admin gave 50/63
and 41/51. The RATIO held at ~80% both times. Treat denominators as ±15%.

**API: 132 of 183 endpoints (72%) are truly reachable**, not the 87% a naive
path-match suggests. **27 are referenced but never called** — the recurring
shape being a typed client method with no caller.

### The three missing doors — fix these before anything else

1. **`/admin/onboarding` is unlinked.** Only references in `src/` are
   `proxy.ts:52` and `AdminShell.tsx:19`, both config. The landing page's only
   `href` is `mailto:support@nevolearning.com`. No school can sign up.
2. **The student school-code box holds 4 characters** behind a hardcoded `NEVO–`
   prefix (`SchoolCodeInput.tsx:11`, `SchoolConnectionStep.tsx:69`). Issued codes
   are 8 chars — `751A1136`, `BGA-4827`. `SchoolCodeRequest` is an exact lookup,
   so no server-side normalisation can rescue it. Continue is disabled until it
   verifies. **No child can create an account.**
3. **Nothing can invite a parent.** `consentsApi.requestParentConsent`
   (`consents.ts:113`) has ZERO callers. The parent surface is finished and
   merged and **completely unreachable**.

Together these are perhaps 20–30 hours. They convert the product from unusable to
demoable end to end.

### The long pole is not screens

`RENDERABLE = [MODALITY.TEXT]` (`lib/lessons/fromContent.ts:49`). **A live lesson
renders text only** — visual, audio, interactive and calculation never appear
from parsed content. `lesson.assessment` and `lesson.summary` are never set, so
the assessment, summary and review-answers routes 404 on a real lesson id. Nine
built lesson screens are unreachable by a real child. Adaptive multimodal
learning is the product's central claim and it is the one thing that cannot
render on live data. ~44h, and it is product work rather than plumbing.

### The demo hazard to fix first

`useStudentLesson.ts:203` answers a live 404 or failed read with an **authored
fixture of the same id** (`failed: failed && !mock`). A child whose lesson is
deleted or still parsing is handed the photosynthesis fixture — a rich
multi-modal lesson that does not exist in their school's library, shown exactly
when the backend failed. `SampleRegion` is `display:contents`: detectable by a
test, invisible to anyone watching.

Same class, admin side: the getting-started checklist renders three steps as OPEN
circles regardless of whether the school has done them
(`overviewGettingStarted.ts` admits only two of five are signal-backed).

### How far out

**361 engineering hours.** Against observed velocity — 143 PRs merged in 10 days
across three sessions — that is **4–6 weeks to genuinely shippable**, with the
three doors landing in days.

### Stale docblocks are misdirecting people

Four verified wrong in one admin pass: "No reset endpoint exists anywhere in the
spec" (two exist and teacher consumes them), "`GET /api/v1/users/me` is the only
route on that resource" (PATCH is live), `JoinLanding`'s "Students do not have an
activation flow" (they do), `AdminSidebar`'s "TODO(api): a profile endpoint"
(`usersApi.me` is consumed two files away). **43 `TODO(api)` markers remain in
admin components, none re-checked against the deployed spec.** The 7 Sep re-audit
found 17 of 97 markers repo-wide were already stale; assume the same rate here.

### Corrections to things this document previously asserted

- **"The parent surface is complete."** Three of three screens are built and
  merged. Nothing can reach them. Complete and unreachable are different states.
- **Parent sign-in was recorded as needing a design ruling.**
  `POST /api/v1/auth/login/parent` is live in the deployed spec and unconsumed;
  its `contact` field is a bare string, NOT `format: email`, which is very likely
  the SMS-only answer already shipped. Confirm with backend before treating it as
  a design question.
- **D01b ships seven gendered `she/her` strings** (`ParentConsent.tsx` 51, 60,
  138, 139, 169, 293, 299), copied from the Amara frame, written the same day
  backend was flagged for gendered templates. Same bug, ours.

---

## Student lane — measurement sweep, 11 Sep

Seven merged today (#344, #346, #348, #350, #352, #353 and the useStudentLesson
fixture fix). What follows is the part other lanes need: **two corrections to the
audit, two questions for design, and one shape to grep your own lane for.**

### The shape: a comment that rationalises a gap

The strongest one today. `DomainProbeModule`'s note said a prior-knowledge probe
"has no correct option", and `reduceTrialModule` reported `accuracy: null` on that
authority. It was a statement about the DATA STRUCTURE, not about the questions —
"The capital of Nigeria is:" has an answer, and a knowledge probe is precisely the
thing that needs it. The comment is why nobody looked.

Same week: `useSessionRefresh`'s docblock said "retrying a refusal in a loop would
just spend a dying token faster" while looping; `SentenceDotModule`'s
`TODO(audio): real narration asset; the play affordance is the shell` described a
button with no `onClick`, under "Listen, then tap the matching picture", asked of
six-year-olds. **Grep your lane for comments that explain why something is
absent, and check the code agrees.**

### Correction — `/summary` and `/review` are NOT reachable dead ends

An earlier note implied a child finishing a real lesson hits a 404. They do not.
`LessonPlayer:713` gates "See summary" on `lesson.summary`, and the assessment
phase on `lesson.assessment` (`:520`) — real lessons carry neither, so neither
route is ever pushed. This is the known backend blocker (no recap, no assessment
on `LessonDetailResponse`), not a separate frontend defect. Nine built screens
wait on backend; nothing is broken in front of them.

### Correction — session expiry was silent, and is not any more

`getSession()` self-clears at `expiresAt`, after which `report()` returns at its
`!getToken()` guard and no request is made to 401 — so the 401-driven
session-expired redirect never fired and the route guard, which only runs on
navigation, never saw them. `useSessionLapse` (#348) arms a timer for the expiry
instant and re-checks on `visibilitychange`. **Teacher and admin shells do not
mount it.** It is role-aware (`sessionExpiredDoor(role)`) and takes no arguments —
`useSessionLapse()` in your shell is the whole change, if you want it.

### For design — two questions, neither blocking

1. **A synthetic voice reads to P1-3.** Module 3's audio activity had no sentence
   and no asset, so it now uses `speechSynthesis` — the system voice, not a
   produced narration. It is a large improvement on silence and it is not what
   anyone designed. Where speech is unavailable the activity is skipped rather
   than mimed. Worth a view on whether a system voice is acceptable for a
   calibration activity, and on the two sentences themselves.
2. **There is no way past the rotate prompt.** Working as ruled ("portrait only,
   v1"), but a device mounted landscape on a wheelchair tray or a stand, or one
   with rotation locked, has no route into Nevo at all. SEND-relevant rather than
   hypothetical.

### Still open in the student lane

- `PinCreationScreen.tsx` is held by another session — untouched here.
- The daily warm-up's `WarmUpRun.tsx` (528 lines) is not swept yet. It shares
  `BaselineCapture` and the same `trial_pick` contract, so expect the same
  accuracy-key question there. Being taken next by this session.
- Nothing in the lane has been checked against the design frames since 8 Sep.

---

## ACTION NEEDED — student and admin sessions

**Wrap your fixture fallbacks in `<SampleRegion>`.** Ten minutes each, and the
end-to-end suite is worthless without it.

Every console falls back to fixture data when a live read fails. That is intentional
for the signed-out demo, and it is also what makes an E2E lie: a test asserting "the
teacher signs in and sees their class list" PASSES when the read 401s, because the
fallback renders a class list — which is exactly what the assertion looks for. The
suite goes green while the console shows invented children to a real person.

The fix is a mark the fallback carries, so a test can see it:

```tsx
// before
if (!getToken() && fixture) return <StudentProfile student={fixture} />;

// after
if (!getToken() && fixture)
  return (
    <SampleRegion kind="student:profile">
      <StudentProfile student={fixture} />
    </SampleRegion>
  );
```

`import { SampleRegion } from "@/components/shared/SampleRegion";`

It renders `display: contents`, so it joins no layout and changes nothing visually.
`kind` names the surface, so a failure says WHICH screen fell back.

The planned E2E signs in and asserts no mark appears anywhere. **An unmarked fallback
is invisible to it** — the test walks past reporting success, which is worse than not
having the test at all.

Teacher lane is done: `ClassRoute`, `LessonRoute`, `StudentRoute`. Find yours by
grepping your lane for `fixture` and for `sample`.

---

## Parent surface — NEW AREA, started 7 Sep

There are **five** surfaces, not three. Design drew a parent area (3 frames) and an
ops console (14 frames); neither had a route until now. `docs/BUILD_STATUS.md` and the
design flow index both missed this — the index does not list parent at all, because
its screens are numbered as admin follow-ups (D01b, D01c, D15d).

**`/parent/[token]` is built** — D01c Parent Data Management, SCRUM-80. Public and
tokenised: a parent never signs in, because putting a login in front of a statutory
data right defeats the point of having it.

**This is a launch blocker, not a feature.** SCRUM-80: _"Section 31 of the NDPA 2023
requires verifiable parental consent... Our legal review confirms this must be in
place before launch."_

### Two backend gaps found while building

1. **There is no `GET /api/v1/parent/{token}`.** The page cannot resolve the token to
   the child's name, their school, or whether consent was already withdrawn. D01c is
   written throughout in the child's name; none of it can be rendered, and a parent
   who already withdrew sees the actions again on return. The page says "your child"
   rather than inventing a name.
2. **An objection has nowhere to put its reason.** `ParentRightRequest` carries
   `requestType` and nothing else, and the API **accepts and ignores** extra fields —
   `reason`, `message`, `details` and `note` all pass validation and go nowhere. So
   D01c's "Describe your concern" textarea is deliberately NOT built: a parent typing
   into a box that discards it, and being told it was received, is worse than not
   offering the box.

### The enum is not in the spec

`requestType` is declared a bare `string`. The real values came from asking the
deployed API with a bad one:

    String should match pattern '^(request_data|object|withdraw_consent)$'

Pinned by a test so a rename fails loudly rather than 422ing a parent's request.

### SCRUM-80 gating — RULED 7 Sep. Nevo is not the consent gate.

Design's ruling, verbatim in effect: **when the backend says `granted: false`, the
child proceeds normally.** The school warrants consent through the DSA. `granted:
false` means the school has not recorded it yet — their administrative task, not a
blocker for the child.

**One exception: explicit withdrawal.** If a parent withdraws, that child's data must
stop being processed.

**The API already distinguishes the two.** `ConsentStatus` has FOUR values on the
deployed spec, not the two this doc used to claim:

| status      | `granted` | means                         | child     |
| ----------- | --------- | ----------------------------- | --------- |
| `not_sent`  | false     | school has not asked yet      | proceeds  |
| `pending`   | false     | asked, parent has not replied | proceeds  |
| `confirmed` | true      | parent granted                | proceeds  |
| `withdrawn` | false     | parent actively withdrew      | **stops** |

**Three of the four are `granted: false`.** So reading `granted` cannot implement the
ruling — it blocks children whose school merely has not filed paperwork, which is the
exact failure the ruling exists to prevent. **Read `status`.** The single encoding of
this is `processingWithdrawn()` in `lib/api/consents.ts`, pinned by six tests plus a
mutation check.

Done under the ruling:

- `ConsentStatus` corrected from `pending | confirmed` to all four. It was previously
  missing `withdrawn`, which made the withdrawal rule a TYPE ERROR — literally
  inexpressible.
- The onboarding gate call is gone. `ConsentGate.tsx` is now
  `LearningNotice.tsx`: the screen stays (it is what tells a child they are being
  profiled — the only notice they get under a school-warrants model), the gating does
  not. Design asked for the file to be deleted; the file also held frame 14's
  explanation screen, so the gate was removed and the screen kept. **Flagged to design
  to overrule if the screen was meant to go too.**

**STILL OPEN — a design question, not a backend one.** What does a withdrawn child
actually SEE? D01c already promises the parent "your child's account is suspended…
they can no longer access Nevo", but no student-side frame exists for a suspended
child. Either D01c over-promises or a frame is needed. Nothing is invented in the
meantime.

---

## API re-audit, 7 Sep — all 97 `TODO(api)` markers vs the live spec

Every marker in the tree was written against an OLDER spec, and the spec moves daily.
Re-checked all 97 against the deployed document, with each "now unblocked" claim
adversarially verified twice before being called that.

| verdict                 | n   | meaning                                                                  |
| ----------------------- | --- | ------------------------------------------------------------------------ |
| unblocked               | 4   | build it today                                                           |
| **partially** unblocked | 26  | the READ landed, the WRITE (or 1 of 3 needs) did not                     |
| still blocked           | 50  | genuinely absent                                                         |
| **stale**               | 17  | **delete the comment — the need is already met or was never an API gap** |

The 26 are the interesting pile: in nearly every case a screen can now render its data
and still cannot perform its action. Do not read "partially" as "blocked".

### Two live bugs this turned up — FIXED, see the enum-mismatch PR

- **`ClassSource` has no `"sso"` member** (it is `manual | roster_sync`). Both
  `ClassesView.tsx:133` and `ClassDetailView.tsx:133` compared against `"sso"`, so
  `ssoSourced` was permanently false and a provider-owned class was offered Create and
  archive actions the school must not have.
- **A revoked teacher was labelled "Invited".** `isInvited` was `status !== "active"`,
  and `UserStatus` is `active | invited | deactivated`. `GET /teachers` has no
  include-inactive filter, so a revoked teacher returns in the ordinary list.

Both were silent — no error, correct-looking code. **If you fix one instance of a
mismatch like this, grep for siblings**; the second `ssoSourced` was at the same line
number in a different file and was nearly missed.

### Endpoints that exist and nothing calls — 8 rated high value

**FOR THE ADMIN SESSION, the big one: `POST /api/v1/students` is not wired.** There is
no student-create call anywhere in `src/`, and the students screen has TWO "Enrol a
student" buttons (`StudentsView.tsx:159` and `:361`). `students.ts` has patch,
deactivate and restore — no create. Also unwired: `POST /students/{id}/pin/reset`
(referenced only in comments in `ForgotPinScreen.tsx`), and `GET /school/overview`,
`GET /school/narrative` and `POST|GET /school/dpa-acceptance` — the last of which is
the compliance record `DpaStep.tsx` says it cannot persist.

**FOR THE TEACHER SESSION:** `PATCH` and `DELETE /api/v1/assignments/{id}` are both
unused, so an assignment can be created and never edited or cancelled. And
`POST /api/content/lessons/{lesson_id}/regenerate` — the only endpoint in the spec
carrying its own description — would turn a failed lesson parse from a dead end into a
retry.

### 17 markers to simply delete

Cheap and worth doing: the comment is the only thing left. Notably every `lib/mocks/teacher*.ts`
marker (the C16 intelligence surfaces, C09 insights, teacher home flags and the C01
onboarding round trip all shipped), `lessonCatalog.ts`, `lesson.ts`, `session.ts:137`,
`connectData.ts`, `ProfileSettings.tsx:40` (already implemented in that same file), and
both `TeacherJoin.tsx` QR markers — QR capture is `getUserMedia` plus a client-side
decoder, never an API gap.

---

## HANDOFF — the teacher session changed files in YOUR consoles. 8 Sep.

**Read this if you own the admin or student console.** I crossed into both while acting on
design's SCRUM-80 ruling, and the changes are already merged. Nothing here needs undoing —
it is green and tested — but you should hear it from this doc rather than from a conflict.

**It already cost us once.** While I was typing a consent seam into `lib/api/students.ts`,
the admin session was independently building D07's consent column with the same four
values under a different name. That surfaced as a rebase conflict where both halves were
the same idea. I took theirs and deleted mine. That duplication is exactly what the
console split exists to prevent, and it happened because I followed a contract change
outward into whoever's screens it touched instead of stopping at the boundary.

### FOR THE ADMIN SESSION — three of your files, and two breaking signatures

Merged in PR #285 and PR #283.

| file                                           | what changed                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `components/admin/Teachers/status.tsx`         | rewritten — see the breaking change below                                                               |
| `components/admin/Teachers/status.test.tsx`    | NEW, 7 tests                                                                                            |
| `components/admin/Classes/ClassesView.tsx`     | `c.source === "sso"` → `"roster_sync"`                                                                  |
| `components/admin/Classes/ClassDetailView.tsx` | same fix, same line number                                                                              |
| `lib/api/teachers.ts`                          | added `UserStatus`; `status` narrowed from `string`                                                     |
| `lib/api/classes.ts`                           | added `ClassSource`; `source` narrowed from `string \| null`                                            |
| `lib/api/students.ts`                          | your `ConsentState` now ALIASES `ConsentStatus` — one definition, same four values, no behaviour change |

**Breaking signature 1.** `isInvited`, `isActive` and `StatusPill` now take `UserStatus`,
not `string`. Passing a bare string no longer typechecks.

**Breaking signature 2.** `AdminClass.source` is `ClassSource | null`. A literal `"sso"`
is now a compile error — deliberately, see below.

**The two bugs behind those changes**, in case you would rather re-do the fixes your own way:

- `ClassSource` has no `"sso"` member; it is `manual | roster_sync`. Both files compared
  against `"sso"`, so `ssoSourced` was permanently false and a provider-owned class was
  offered Create and archive actions the school must not have.
- `isInvited` was `status !== "active"`, so a **deactivated** teacher rendered as
  **"Invited"** — telling an admin an invitation was outstanding for someone whose access
  they had just revoked. `GET /teachers` has no include-inactive filter, so it is
  reachable in ordinary use.

**Design ruled on the pill (8 Sep):** keep the third pill, keep the word "Deactivated",
do NOT filter deactivated teachers out of the list — an admin should see who was removed.
D6 goes from two labels to three. The tint and flat treatment as shipped are approved.

### FOR THE STUDENT SESSION — two files, and a screen that was renamed

Merged in PR #283.

- **`components/student/Onboarding/ConsentGate.tsx` is now `LearningNotice.tsx`.**
  The gating is gone; the SCREEN is unchanged. Design ruled that Nevo never blocks on
  consent — the school warrants it through the DSA — so the old
  `GET /students/me/consent-gate` call had nothing to decide and only dev-logged. Design
  asked for the file to be deleted; it also held frame 14's explanation screen, so the
  gate was removed and the screen kept, renamed so nothing reads as a gate again.
- **`components/student/Onboarding/ObservedInteractionSequence.tsx`** — import and usage
  updated to match. Still step 1 of the sequence, between profiling and PIN creation.

**The rule to carry forward, because it is easy to get backwards:** three of the four
`ConsentStatus` values report `granted: false`. Reading `granted` blocks children whose
school merely has not filed paperwork. Read `status`, or use `processingWithdrawn()` in
`lib/api/consents.ts` — one definition, six tests, mutation-checked.

### The Account-on-Pause work is YOURS, not mine

It is student auth and I should not have carried it as far as I did. Everything known is
in the section below: design's ruling, the pushed frame, the six mapped auth surfaces
with hook points, and the measurement showing a paused account is currently
indistinguishable from a wrong PIN. **It is blocked on backend returning a
distinguishable code** — when that lands, it is the student session's to build, not mine.

## Account on Pause — designed, enforced, and NOT WIREABLE. 8 Sep.

Design ruled that a child whose parent withdrew consent is stopped at sign-in with a
calm screen ("Your Nevo account is on pause. If you have questions, talk to your
teacher."). The frame is pushed. Backend enforces it: withdrawal deactivates the
learner, the session dies on the next request, and they cannot log back in.

**It still cannot be built, and the reason is measured, not inferred.** I made a real
student on the E2E tenant, deactivated it, and compared responses:

| case                                | response                               |
| ----------------------------------- | -------------------------------------- |
| active account, **wrong** PIN       | `401 {"code":"authentication_failed"}` |
| **paused** account, **correct** PIN | `401 {"code":"authentication_failed"}` |
| identifier that never existed       | `401 {"code":"authentication_failed"}` |

Byte-identical, message included. Mid-flight a revoked token gets `401 invalid_session`,
which is also what an ordinary expiry returns. `user_unavailable` never reaches the
client and appears nowhere in the deployed spec.

**Do not guess at it.** A wrong guess tells a child who mistyped their PIN that their
account is on pause, which is precisely the harm the copy exists to prevent. Raised with
backend: distinguish only AFTER credentials verify, so nothing leaks to someone who does
not already hold a valid PIN. Our own code already takes that posture deliberately —
`authApi.requestPasswordReset` documents that it "always resolves the same way for any
address".

### What a withdrawn child sees TODAY — every path blames her

Mapped across all six auth surfaces. Five are reachable; student SSO is not (still
`resolveMockSso`).

- **Mid-lesson.** A background read 401s → `client.ts:212` `handleAuthFailure` →
  `/auth/session-expired`, which hardcodes `variant="expired"`: **"You've been away for
  a while."** She was not away. The route's own comment calls it the "idle timeout
  landing", and it is now the catch-all for every 401.
- **Next morning.** The remembered profile is untouched, so the device greets her
  **"Welcome back, <name>"**. She types her correct PIN. `page.tsx:104` collapses 401
  and 403 into one boolean, so she gets **"That PIN didn't match. Try again, or ask your
  teacher."** Forgot PIN → informational → back to sign-in → same loop, blamed each time.
- **A revoked TEACHER** gets the identical wrong-password treatment
  (`TeacherSignIn.tsx:124`).

**The plumbing is already there.** `ApiError.detail` carries the parsed error body
(`client.ts:195-201`, `:214`) and is in scope at every hook point — it is simply never
read. `tosseErrorMessage` (`tosse.ts:155-161`) already narrows `{detail:{code,message}}`,
so there is a precedent to copy. The only missing thing is knowing which code to look for.

**Hook points, when a code exists:** `src/app/auth/login/page.tsx:104` (student PIN),
`src/lib/api/client.ts:211-212` (mid-flight, covers session refresh too),
`src/components/teacher/Auth/TeacherSignIn.tsx:124` (staff).

**FOR DESIGN:** `SessionEndScreen` has two variants and both assert a CAUSE — "You've
been away for a while" / "You logged in on another device". Neither is true for a revoked
session, and there is no neutral variant. Worth a third, or softer wording on `expired`,
independently of the pause work.

## `POST /api/v1/students` returns 500 — raised 8 Sep

Enrolment is broken. Valid payload, healthy tenant:

- fails identically with the three required fields, with `ageBand`, and with `email`
- **validation and lookup are fine** — bad `classId` → `404 Class not found`, missing
  `lastName` → proper `422`. It fails after both, during creation.
- **not the tenant** — `GET /school` and `/permissions/me` read fine, and
  `POST /api/v1/invites` works on the same tenant (201)
- **not the DPA** — accepted `version: "1.0"` (201, reads back) and retried; still 500

`rndr-id`s given to backend: `bb72a09b-7fa7-423b`, `22ca2b26-70b5-4b55`,
`75bde606-1e2e-4e39`, `1ece64bb-d0ac-465c`.

**Workaround for anyone who needs a student:** `POST /api/v1/invites` →
`POST /api/v1/join/{token}/accept` with `{pin, firstName, lastName}` creates one and
returns `loginIdentifier`. That is how the tenant below was seeded.

### The E2E tenant is no longer empty

School `E2E DO NOT USE - automated tests`, code **`751A1136`**. It now holds one class
and two students — one **active**, one **deactivated** — so the console renders populated
states, and the `Deactivated` pill has a real row behind it. DPA acceptance is recorded.
Credentials stay in CI secrets, not here.

---

## D15d Parent Growth View — NOT BUILDABLE. Measured 8 Sep.

The last unbuilt parent frame, and the blocker is bigger than a missing endpoint:
**a parent cannot get a Nevo account at all.**

### 1. `parent_guardian` is invite-refused

`POST /api/v1/invites` declares `role: UserRole` — all five values, `parent_guardian`
included. The deployed endpoint runs TWO validations and the second one is narrower:

```
role: "parent_guardian"   -> 422  String should match pattern '^(teacher|student)$'
role: "not_a_real_role"   -> 422  Input should be 'student', 'teacher', 'senco_admin',
                                  'other_admin' or 'parent_guardian'
```

The enum lets `parent_guardian` through; the pattern then rejects it. **This is also a
contract bug in its own right** — the spec advertises a five-value field that the
implementation accepts two of, so a generated client would 422 at runtime. Raised.

Nothing else mints parent credentials: `/auth/password-reset/*` needs an existing
account, and `POST /consents/parent/complete` returns a `parent_id` for a record that
has no way to sign in. That is the same wall that stops D01b's "Set up my parent
account" button, which is why that button is deliberately unbuilt.

### 2. Nothing in the API is scoped to a parent

`parent_guardian` appears **exactly once** in the whole deployed spec — inside the
`UserRole` enum that defines it. No endpoint references it. There is no
"which children am I the parent of" read; `GET /students/{id}/parent-links` runs the
other way and is admin-scoped. Every progress read (`/api/students/{id}/progress`,
`/api/mastery/student/{id}`) requires `HTTPBearer` and is keyed by student id.

### 3. The data the frame needs does not exist in any shape

D15d is four plain-language statements about how one child is growing this term:

| the frame's four           |                                                          |
| -------------------------- | -------------------------------------------------------- |
| Staying with hard problems | "working through tricky questions on her own for longer" |
| Knowing what she knows     | "a clearer sense of what she has understood"             |
| Connecting ideas           | "carrying what she learns in one subject into another"   |
| Learning new things faster | "new ideas are landing more quickly than last term"      |

**Prose, and the frame is emphatic about it: no scores, no percentages, no labels, no
clinical terms.** So this cannot be derived client-side from numbers — deriving it would
be inventing a judgement about a child.

What exists is close in shape and wrong in scope:

- `GET /api/transformation-metrics` → `TransformationMetricsResponse` is entirely
  counts (`lessonsTransformed`, `adaptationsPerSession`, …). That is D15a-c, and it is
  precisely what D15d must not show a parent.
- `GET /api/v1/school/narrative` → `SchoolNarrativeResponse` `{headline, summary,
highlights, generatedAt, source}` is the RIGHT shape — generated prose with a
  provenance field — at the wrong scope. **It is the model to copy for a per-child
  version.**
- `LearnerObservationResponse` `{pattern, count}` and `LearnerProfileSummaryResponse`
  are declared in the spec and **served by no endpoint at all**. Orphaned.

### What would unblock it, in order

1. Let `POST /api/v1/invites` actually accept `parent_guardian` (or any route that gives
   a parent credentials), and fix the enum/pattern mismatch either way.
2. A parent-scoped read of their own children — the parent equivalent of
   `students/me`.
3. A per-child growth narrative shaped like `SchoolNarrativeResponse`, carrying the four
   dimensions as prose with a `generatedAt` and a `source`, so the screen can say when it
   was written and never has to compute a judgement itself.

Until 1 and 2 exist there is no signed-in parent to show anything to, so this is not a
"nearly there" item. **Parent is 2 of 3 frames: D01b and D01c are built and merged.**

---

## Signed-in E2E — LIVE as of 11 Sep. 9 specs, and how to run them.

The suite is no longer signed-out only. `e2e/teacher-signed-in.spec.ts` holds a
real session against the E2E school and asserts the one property no unit test
can reach: **a signed-in teacher is never shown invented data.**

**Why that is the assertion, and not "the class list appears".** Every console is
live-first with a fixture fallback. "The teacher signs in and sees their class
list" PASSES when the read 401s, because the fallback renders a class list. So
the test asks the question the failure mode cannot satisfy: is anything on this
page carrying `data-nevo-sample`. As of 11 Sep the answer across dashboard,
classes, lessons, insights and students is **no marks at all**.

### Running it

```
E2E_TEACHER_EMAIL=... E2E_TEACHER_PASSWORD=... npm run e2e
```

Unset, the signed-in specs **skip** and the rest still run - a fork without the
secrets gets a green, meaningful run rather than a red one for a sign-in it was
never going to reach. CI passes them from repository secrets of the same names.

**The account:** a teacher on the E2E school (`751A1136`), assigned to
`E2E Probe Class`. Password is in CI secrets and nowhere else.

### Three traps, each of which cost real time

1. **`storageState` cannot carry this session.** The token is in localStorage,
   but the ROLE COOKIE is written by the client at sign-in and `proxy.ts` reads
   it ON THE SERVER to decide whether to serve console markup. Restore one
   without the other and the guard bounces you to the door. Sign in through the
   API, set the cookie on the context, and plant localStorage with
   `addInitScript` - not `evaluate` after navigating, or the console mounts as a
   guest and renders the fixtures you are testing for.
2. **`waitForLoadState("networkidle")` never settles** in this app. The first
   version used it and timed out; the failure looked like a fixture bug and was
   not one. Wait for a real element instead.
3. **ONE ACCOUNT MEANS SERIAL, and short tests.** `SessionResponse` carries
   `replaced_session`: a second sign-in as the same user kills the first. Under
   `fullyParallel`, a sibling test's login killed this one's session mid-walk.
   The file is `mode: "serial"`, and the five-page sweep is five short tests
   that each sign in fresh rather than one long one holding a session across
   five navigations.

### What it does NOT cover yet

No write path is exercised - no assign, no upload, no cancel. The E2E class
holds **no students**, because `POST /api/v1/students` and
`PATCH /students/{id}/class` both return 500 (raised). An empty tenant is
actually the sharpest setting for the fixture assertion, but it means the roster,
profile and assign flows have nothing real to act on.

---

## Coordination — read this first

Three sessions build in this SAME worktree in parallel: **student**, **admin**, and
**teacher + cross-cutting**. One `.git`, one `package.json`, one lockfile.

**THIS FILE IS HOW THE SESSIONS TALK TO EACH OTHER.** Agreed 6 Sep and in force from
now on. A chat message reaches one session and dies when its context compacts; a note
here survives, and every session already reads the repo. So:

- Found something that belongs to another console? **Write it under Handoffs** rather
  than fixing it in their files or mentioning it only in chat.
- About to do something the others would trip over — a dependency, a shared-file
  change, a rename? **Say so here before you push.**
- Starting work? **Read this file first.** It is the current state of all three
  consoles, and it is kept accurate deliberately.
- Finished something another session was waiting on? **Move it out of Handoffs** so
  nobody does it twice.

Re-read before you edit: two other sessions may have written to it since you last
looked.

### The shared lockfile

`package.json` and `package-lock.json` are the worst files to conflict on, because
resolving them by hand produces a tree that installs differently from everyone
else's. So:

- **Announce any dependency change before pushing it**, and keep it to ONE commit on
  its own branch. Do not fold a dependency into a feature commit.
- **After someone lands one: `git pull`, then `npm ci` — not `npm install`.** `npm ci`
  installs exactly what the lockfile says. `npm install` may rewrite it and start the
  fight again.
- **STOP YOUR DEV SERVER FIRST.** `npm ci` deletes `node_modules` wholesale, and Windows
  locks a native `.node` addon for the lifetime of the process that loaded it. With a dev
  server up, the delete fails PART WAY: the tree is left broken for every session, and a
  retry cannot repair it either. This happened on 6 Sep — `npm ci` after the vitest commit
  died on `EPERM … unlink lightningcss.win32-x64-msvc.node` with six Next dev workers
  alive, taking `next` and `vitest` with it until those were killed and `npm ci` re-run.
  **If you see `EPERM` on a `.node` file, that is what it means — find the process, do not
  retry.**
- **If you do hit a lockfile conflict, take the incoming file wholesale** and re-run
  the install. Never hand-merge a lockfile.

**DONE 6 Sep — pull and run `npm ci`.** The test dependencies landed in one commit:
`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`,
`@testing-library/jest-dom`, `@vitejs/plugin-react`. `@types/node` moved `^20 -> ^22`
because vitest 5 requires it and the runtime here is already Node 22 — the types were
older than the thing they described. The whole project still typechecks.

No further dependency change is planned by any session.

### The shared `nevo.role` cookie — new consequence as of 7 Sep

All three consoles are served from the same origin in development, so there is
**one `nevo.role` cookie between them**. Signing in as an admin in one tab makes
every tab in that browser an admin, including the ones you left on a student or
teacher screen.

That was merely confusing until #265. Now `/student/*` is guarded too, so it
BITES: with `nevo.role=senco_admin`, `/student/dashboard` redirects to
`/auth/login`, and it looks like the student app is broken rather than that you
are signed in as somebody else. The same is already true in the other direction
for `/teacher/*` and `/admin/*`.

If a console bounces you to a door you did not expect, read the cookie before
debugging the guard:

```js
document.cookie
  .split(";")
  .map((s) => s.trim())
  .find((c) => c.startsWith("nevo.role="));
```

Two browsers, or one profile per console, avoids it entirely. Worth knowing that
`useDisplayName` prefers the device-remembered name, so a signed-OUT student
screen can still greet you by name — the greeting is not evidence of a session.

### The backend proxy now has two timeouts, and a 504 — changed 8 Sep

`src/app/api/backend/[...path]/route.ts` is shared by all three consoles, so this
affects everyone. It used to abort **every** upstream call at 60s and report the abort
as `502 "The backend is unreachable right now."`

That is what made lesson regeneration look broken. Three attempts — as a student, as a
SENCo admin, as a teacher — all "failed" at exactly 60 seconds, and it was read as the
backend being down. It was our own clock. **The backend was never the thing that
failed, and this nearly went to Teslim as his bug.**

Two things changed (PR #291):

- **Generation routes get 240s**, the rest keep 60s: `api/content/parse`,
  `api/content/upload`, `api/content/lessons/{id}/regenerate`, `api/v1/uploads`,
  `.../uploads/batch`, `.../uploads/{id}/retry-pages`. **If you add an upstream route
  that generates or parses rather than reads, add it to `LONG_RUNNING`** — otherwise it
  gets the read budget and you will debug the wrong end.
- **A timeout is now `504`**, with the budget named in `detail`; `502` is kept for
  genuine unreachability. If you have error handling that assumes 502 means "backend
  down", it now also needs to expect 504 meaning "backend still working, we stopped
  waiting". Nothing branched on the old string when this landed (`TeacherPasswordReset`
  and `FeedbackPanel` both match on `err.status === 0`), so nothing needed changing —
  but check yours if you add any.

**ANSWERED 9 Sep, and it is now genuinely the backend's.** Retried as a teacher through
the fixed proxy: the call ran the **full 240s** and returned `504 "The backend did not
answer within 240s."` (283s client-side). Re-reading the lesson afterwards gives exactly
what it gave before — 2 segments, `bodyChars: [111, 111]`, 0 checkpoints, 0 variants,
`["text","visual"]` with a null `visualVariant`. Four minutes, nothing persisted.

The backend is healthy throughout: in the same window, same proxy, same token,
`GET /api/content/lessons/{id}` answered `200` in 4.9s and `/api/v1/teachers/me/home`
`200` in 6.6s. This is specific to `regenerate`.

Written up for Teslim (**not yet sent** — it is with Olayinka to forward), with three
questions: does it complete server-side; how
is a client meant to observe completion (the operation declares only `200`/`422`, no
`202`, yet `ContentParseStatus` has `pending`/`processing` and **nothing in the spec
accepts the `parseRunId` it returns**); and does it need the original source document,
since this lesson may have been seeded directly rather than parsed from an upload.

**Do not plan student content work around regeneration until that comes back.** The
after-lesson chain, four of five modalities, every checkpoint and the spaced-retrieval
loop are all built and all inert for one reason: the library is one 2-segment lesson.

### Before you push to main, check what you are actually pushing

One `.git`, three sessions, one working tree — so **your local `main` can contain
another session's commits**, and `git log -1` after a pull shows THEIR HEAD, not
what is on the remote.

This bit on 8 Sep. A doc commit was ready, `git pull` reported success, and
`git log -1` looked right — but the branch carried two unpushed commits from the
parent-portal session. Pushing would have merged their unreviewed branch into
`main` on their behalf. A rejected push was the only thing that surfaced it.

**So, every time, before pushing to `main`:**

```
git fetch origin
git log --oneline origin/main..HEAD
```

If that lists anything you did not write, stop. Do not `git pull --rebase` and
push — that publishes their work too. Instead:

```
git checkout -b <your-branch> origin/main
git cherry-pick <your commit>
```

**And check the file, not just the commits.** The same incident had a second
half: their commit also rewrote a section of THIS file, so the cherry-pick
conflicted and taking "mine" wholesale would have published their doc changes
along with it. Resolve a shared-file conflict hunk by hunk — keep yours, leave
theirs for them to land.

None of this loses work: their commits were already on their own pushed branch.
The risk is not deletion, it is publishing something on someone else's behalf
before they are ready.

### Whose files are whose

| area                                                               | owner                       |
| ------------------------------------------------------------------ | --------------------------- |
| `src/components/student/**`, `src/app/student/**`                  | student session             |
| `src/components/admin/**`, `src/app/admin/**`                      | admin session               |
| `src/components/teacher/**`, `src/app/teacher/**`                  | teacher session             |
| `src/lib/api/**`, `src/hooks/**`, `src/proxy.ts`, `scripts/**`, CI | **shared — collision zone** |

In the shared zone, run `git log -1 -- <file>` before editing to see who last moved
it, and keep the diff minimal. Stage with explicit paths — never `git add -A`, which
sweeps up whatever another session has in flight.

### Handoffs currently waiting

**For the student session — ALL FIVE ARE DONE, 7 Sep.** Left here as a record of
what closed, because two of them were wrong about _why_ they mattered:

- ~~`fromContent.ts` chokepoint~~ — **#253**. The seam was one file up from where
  this said: the variants were typed on 3 Sep but only on `content.ts`'s PARSE
  response, whose sole consumer is the teacher upload wizard. The player reads
  `LessonSegment` in `lessons.ts`, which declared none of them, so the bytes
  arrived and the TYPE erased them.
- ~~`/student` 404s~~ — **#255**.
- ~~`/student/*` unguarded~~ — **#265**. Not for the reason assumed; see the
  trap below.
- ~~`intelligence/adapt` may be the student-facing plan~~ — **#260 / #262**. It is.
  Bearer with no role restriction; a student's own token returns 200, checked
  against the deployed API.
- ~~`messagesApi.reply` unused~~ — **#250**.

**Still open for the student session:** wrap the student lane's fixture fallbacks
in `<SampleRegion>` (see ACTION NEEDED at the top). Note the guard from #265 does
NOT make this unnecessary — the fallbacks still fire when a live read fails while
signed in, which is exactly the case that makes an E2E lie.

**For any session:** `npm run contract` now fails the build when the client and the
deployed spec disagree. It runs in CI on every push and PR. If it fails on your
branch, the client is wrong about the API — read the finding before assuming the gate
is.

---

## Blockers that are DEAD — verified 6 Sep, do not plan around these

Re-verified against the deployed spec (168 paths / 182 operations / 132 consumed) by a
six-dimension audit, each claim adversarially re-checked. **The biggest risk on this
project right now is not the open gaps — it is quoting a closed one.** Fourteen recorded
blockers are dead; these are the ones most likely to be repeated:

- **The whole pre-auth student onboarding chain exists.** `POST /api/v1/auth/pin` and
  `POST /api/v1/connections/class-code` BOTH carry `security: []` in the document — they
  are explicitly unauthenticated. The recorded blocker "a child cannot store a PIN or join
  a class during onboarding" is wrong, and `TeacherJoin.tsx` still validates against a
  hard-coded `VALID_CODE` for no reason.
- **All five lesson variants are typed** (`TextVariant`, `VisualVariant`, `AudioVariant`,
  `InteractiveVariant`, `CalculationVariant`) and carried on both lesson reads. Teacher
  variant review was never blocked; PR #253 is taking the student half.
- **Message threads carry `unread` and `unreadCount`** (since 31 Aug), and a student CAN
  reply to a thread. Shipped in PR #250.
- **`availableFrom` landed on assignment 31 Aug** — SCRUM-114 is not waiting on backend.
- **Adaptive scaffolding is fully deployed**: attempt, history and state endpoints, with a
  ready-to-render `studentMessage` and a four-value intensity ladder. Zero consumers.
- **`GET /api/v1/permissions/me` returns a `navigation` array**, typed in this repo and
  then discarded by `PermissionContext`.
- **The child's own consent gate is live and wired.** The broad claim "nothing carries
  per-student consent" is wrong — what is missing is reading consent for _another_
  student, which is a narrower and different ask.
- **`docs/blocked-items-handoff.md` has been DELETED** (7 Sep). It was six weeks stale,
  every backend contract in it had since shipped, and it was the single most likely
  source of a wrong blocker quote. This file replaces it.
- **Nine Jira tickets describe work already on main.** The board is desynchronised in both
  directions — SCRUM-117 sits in Idea while the TOSSE page shipped 2 Sep.

Seventeen further items believed blocked are pure wiring against endpoints that already
exist and are already typed in `src/lib/api`.

**Two honest unknowns**, neither closed by that audit: whether the backend enforces
`PermissionScope` server-side (needs a two-account probe), and outbound email/SMS delivery
— `InvitationDeliveryStatus` reports `email_not_configured`, which means **nobody can
receive anything we send**, and that sits upstream of every invite and consent flow.

---

## The three piles

| pile              | meaning                                                      |
| ----------------- | ------------------------------------------------------------ |
| **BUILDABLE**     | The contract and the design both exist. Ours to do.          |
| **NEEDS BACKEND** | No endpoint, or an endpoint that cannot answer the question. |
| **NEEDS DESIGN**  | No frame, or a frame that contradicts another.               |

---

## Student app

### The entrance is open, and the lesson plays real content — 10/11 Sep

**A child can now get in.** That was not true two days ago, and it was the whole
problem: `SchoolCodeInput` drew four boxes behind a hardcoded `NEVO–` prefix
when real codes are `751A1136` and `BGA-4827`, so no code a school actually has
could be typed — and every entrance funnels through that screen.

Landed since: real school codes (#325, free-length, bounded from the contract),
a real class-code join (#330 — Teacher Join compared against a literal
`"MAP4KZ"` and called no API; the endpoint is `security: []`, public, and the
comment claiming otherwise was wrong), routing so a code- or invite-joined child
skips steps they have no answers for (#330), and the name prefilled when they
come back to it (#332).

**The player renders generated content.** Visual (#320) and audio (#321) are on;
`AudioSegment` used to animate a waveform over silence on a hardcoded 40-second
timer, so real playback had to come first. Checkpoints draw. The parse pipeline
is async now (#317: 202 + poll `finished`, never `status`).

**Honesty fixes, all invisible in review:** a signed-in child is never handed the
demo lesson when their own read fails (#327); Home no longer marks a real child's
dashboard as sample data (#299); SSO completes a real handshake instead of
inventing an account (#305); ScanMode no longer claims "You're in" having
contacted nothing (#330).

**Accessibility:** violet text measured 2.34:1 and carried the sentence a child
reads after getting an answer WRONG, while the correct note beside it was navy
at 8.8:1 — fixed with a text-only token, and High Contrast now covers violet at
all (#336). Segment advance destroyed focus, so keyboard and switch-access
children restarted from the top of the document every time; fixing it also reset
the scroll position, which nothing had ever done (#337).

**An adversarial sweep on 11 Sep found three things a diff cannot show** (#341,
#344, #345):

- The **baseline profiling submit is Bearer**, and the run is phase 0 while the
  account is created at phase 2. Every non-SSO child's cognitive profile 401'd
  and was purged — and on a shared tablet where the last child had not signed
  out, it SUCCEEDED against _their_ account. It is now parked and sent only once
  the session provably belongs to the child who sat it.
- **Offline progress was dropped by the button under "Your progress is saved".**
  The unsent buffer was a ref and the `online` listener lived in the same hook,
  so "Leave for now" unmounted both. Held outside the player now.
- **Every SSO child's band came from `MOCK_STUDENT`'s "Year 4"**, so a
  sixteen-year-old sat the P4-6 baseline and a seven-year-old was asked "What is
  15% of 200?". Nothing a signed-in child can read carries an age or year group,
  so the flow asks.

### Still open in the student lane

Nothing here is code we can write alone.

- **A returning child cannot get back in.** No remembered profile means a
  redirect into onboarding — a second account, new identifier, no history.
  `00 Student Login` designs only the remembered-device case. DESIGN.
- **A finished lesson ends in a bare "Done".** No assessment, summary or recap
  exists on any of the 183 paths. Nine built screens unreachable. BACKEND.
- **Interactive** is a question on the wire and tickable steps in the player —
  no honest mapping. **Calculation** needs `problem.answer`, and a ruling on
  whether `scaffoldImage` replaces the drawn bar model. DESIGN + BACKEND.
- **A paused child is told "That PIN didn't match."** `login/pin` declares only
  200/422 and no schema carries an account status. BACKEND.
- **`PinCreationScreen` prefers `authApi.setPin` when a token exists**, so a
  device with a stale token saves the PIN and silently never joins the class.
  Left alone only because another session has been mid-edit in that file.
- **`acceptJoin` stores no session**, so an invite-link child finishes onboarding
  with no token. Worth tracing what else that costs them.
- **`/student/onboarding` admits an already-signed-in child with no bounce** —
  the door the baseline misattribution came through. Closed for the baseline
  specifically; the door is still open.
- **Nothing shipped since 8 Sep has been seen in a browser.** All of the above is
  verified by tests and measurement, not by watching a child's screen.

### THE CHOKEPOINT IS OPEN. The gap is now CONTENT. — 7 Sep

`fromContent.ts` carries checkpoints through (#253) and `lessons.ts` declares the
five variants, so the wiring no longer stands in the way. What does:

```
GET /api/content/lessons  →  librarySize: 1
  Fractions Lesson 3      →  segments: 2
                             totalCheckpoints: 0
                             segmentsWithAnyVariant: 0
                             modalitiesClaimed: ["text", "visual"]
```

**The entire content library is one lesson, and it carries no checkpoint and no
variant of any kind.** `toQuickCheck` is wired and waiting for a checkpoint that
does not exist. Visual and audio map cleanly and could be written this afternoon —
against nothing to look at.

So the five pieces below are behind CONTENT as well as wiring, and that half needs
a producer, not a frontend change. **This is now the single largest gap in the
student app.**

**A live trap in that last line.** The segments CLAIM `visual` in
`availableModalities` while `visualVariant` is null. Anything that switches a
modality on from `availableModalities` alone draws an empty visual frame _today_.
`fromContent` and `lib/lessons/adaptation.ts` both gate on payload presence
instead — keep it that way.

### Typed, working, wired to nothing — BUILDABLE

Shipped 4–5 Sep as API-layer work. All have logic and no UI consumer:

| thing                                 | where                    | what it needs                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markCheckpoint` / `toQuickCheck`     | `lib/api/checkpoints.ts` | `fromContent` to carry checkpoints; the player already draws `QuickCheckSheet`                                                                                                                                                                                                                                                                                                                                                                            |
| `markInteractive` / `mediaUrlExpired` | `lib/api/variants.ts`    | `fromContent` to read the five variants                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `contentApi.mediaUrl`                 | `lib/api/content.ts`     | a caller — `mediaUrlExpired` decides when                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `useDueReviews().playable`            | `hooks/useDueReviews.ts` | `SubjectDetail` pills to become links into `/review-session`                                                                                                                                                                                                                                                                                                                                                                                              |
| ~~`reflection` / `highlights`~~       | `lib/api/students.ts`    | **DONE #247.** `reflection` renders on both Progress screens, read per-subject from the narrowed route — the two routes' `reflection` mean different things, so the tab's would be a claim about all of a child's learning under one subject's heading. `highlights` is carried and NOT placed: it is a student-level list and the only nearby slot is the per-subject card note, so mapping it by index would be fabrication. **Needs a designed slot.** |

Neither `checkpoints.ts` nor `variants.ts` is exported from `lib/api/index.ts`.

### Stale comments that now contradict the contract

Each asserted a gap backend closed on 3 Sep. **The student ones are all corrected**
(#247, #253, #260); one teacher-lane comment is still outstanding:

- ~~`lib/lessons/fromContent.ts:16-35`~~ — corrected #253.
- ~~`hooks/useStudentProgress.ts:19-22`~~ — corrected #247.
- ~~`components/student/Progress/ProgressTab.tsx:28-31`~~ — corrected #247.
- ~~`components/student/Progress/SubjectDetail.tsx:37-40`, `:241-243`~~ — corrected #247.
- `components/teacher/Library/VariantReviewRoute.tsx:14-15` — **still open**, still
  calls the variants "free-form". Teacher lane.

Also corrected: `useStudentLesson.ts` no longer says the adaptation plan has no
student-facing endpoint, and `useStudentThreads.ts` no longer says "READ ONLY".

### Routing and auth

- ~~**`/student` 404s**~~ — **DONE #255.**
- ~~**`/student/*` is unguarded**~~ — **DONE #265, and the reason was not the
  obvious one.** A signed-out student render leaks no real data at all: every
  screen already gates live reads behind `useHasSession`/`useHydrated`, and the
  server markup was checked rather than assumed. The teacher/admin argument
  (never serve someone else's roster) does not apply here.

  What it fixes is this: `getSession()` clears itself once `expiresAt` passes, so
  no token is sent, so nothing 401s, so `handleAuthFailure` never fires and never
  sends anyone to the door. **A child returning the next morning got the full
  designed walkthrough — another child's name, another child's lessons —
  presented as their own.** The role cookie expires with the session, so its
  absence is the signal that case needs.

  `/student/onboarding/*` stays open: it is the flow that CREATES the session
  (`completeAccount` → `setSession` → first lesson). Do not guard it.

- **`/student/lessons/[lessonId]/review-session` is an orphan** — nothing links
  to it. `playable` is its entry point.

### Stubs that 404 on a real lesson — NEEDS BACKEND

- `/student/lessons/[lessonId]/review` — `getMockLesson` + `notFound()`. No
  attempts endpoint; attempts live in `sessionStorage` (`reviewStore.ts`).
- `/student/lessons/[lessonId]/summary` — same shape. `lessonFromContent` never
  sets `lesson.summary`, so a live lesson silently loses the summary screen.

### Blocked — NEEDS BACKEND

| thing                           | why                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ~~Student → teacher messaging~~ | **DONE #250.** `POST /api/messages` still has no `teacher` recipient — but `POST /messages/threads/{id}/reply` (3 Sep) is the door, and deliberately a different shape: access IS the thread, so a child may write only where they can already read and still cannot start a conversation.                                     |
| Thread unread state             | No endpoint reports it; the dot stays off.                                                                                                                                                                                                                                                                                     |
| Student SSO sign-in             | Entirely mock (`resolveMockSso`). `authApi.ssoCallback` exists and the teacher side calls it.                                                                                                                                                                                                                                  |
| Teacher-join class code         | Pre-auth join still compares a hard-coded `VALID_CODE`. **Re-check:** `connections/class-code` went public on 3 Sep, so this may now be closable.                                                                                                                                                                              |
| Per-concept assessment result   | Questions carry no concept id, so the after-lesson result can only tell _all_ from _none_.                                                                                                                                                                                                                                     |
| ~~Adaptation plan~~             | **DONE #260. The "no student-facing endpoint" claim was wrong.** `POST /api/intelligence/adapt` is Bearer with no role restriction and returns 200 to a student's own token. Per-segment `scaffolding` now drives the indicator, which previously drew 2-of-4 support dots from a hardcoded `?? "light"` on every live lesson. |
| ~~Backend-triggered breaks~~    | **DONE #262.** `in_lesson` mode at segment boundaries. `useBreakMonitor`'s TODO is answered; the client timer stays as the priming fallback. Only OBSERVED facts are sent — see the Zero-Tag note below.                                                                                                                       |
| Boredom escalation              | The tap spends the offer and asks nothing.                                                                                                                                                                                                                                                                                     |
| Downloads / offline             | Endpoints exist; the device half is a Service Worker project. Hidden from signed-in children, honestly.                                                                                                                                                                                                                        |
| Baseline Module 4 items         | No IRT service; items are authored mocks.                                                                                                                                                                                                                                                                                      |
| Ask Nevo scoping                | The console holds no student or lesson UUID to send.                                                                                                                                                                                                                                                                           |
| Narration audio                 | 4 × `TODO(audio)` — the assets do not exist. Playback is a simulated progress bar with no `<audio>` element.                                                                                                                                                                                                                   |

### Traps in the adaptation engine — do not relearn these

**The segment-type enums are different, and a pass-through 422s on 100% of real
content.** `ContentSegmentRequest.segmentType` (`ContentSegmentType`) and a
lesson's `contentType` (`LessonContentType`) share only `worked_example`,
`definition` and `summary`. Both segments of the only lesson that exists are
`explanatory_text`, which the engine rejects. Translation lives in
`lib/lessons/adaptation.ts` — use it, do not inline another.

**`calculation` has no engine equivalent.** Mapped to `worked_example` as the
nearest honest neighbour, not a translation. **Question for backend.**

**Density does NOT map.** The engine's `DensityLevel` (low/medium/high) is how
dense the content should be; the player's `Density` (simplify/expand/slower) is
which authored RESHAPE to show. Parsed content has one body and no reshapes.
Carrying one into the other asks the player to render a variant that does not
exist.

**Zero-Tag applies to what we SEND, not only what we render.**
`RuntimeSignalsRequest` accepts `engagementScore`, `comprehensionScore`,
`consecutiveErrors`, `accuracyBelowBaseline` and more. None are sent: nothing
defines engagement client-side, there is no baseline, and comprehension needs
marked checkpoints that no lesson carries. Measured against the live engine —
observable facts alone (`continuousMinutes: 25`) earn `mild` / `movement` /
`["time_threshold"]`; adding invented scores escalates to `high` / `full`. A
child would get a longer break on the strength of a number we made up.

**`modality_suggestion` returned `null` under every combination tried,** including
deliberately extreme ones. Nothing is wired to it. **Question for backend: what
triggers it?**

### NEEDS DESIGN

- **`InteractiveVariant` does not map to `InteractiveContent`.** The wire is a
  QUESTION (`prompt`, `options`, `answerKey`); the player's is tickable STEPS
  with an outcome. Two different things sharing a name — a design decision, not
  wiring.
- **`CalculationVariant` is partial** — `CalculationSegment` needs `scaffold`
  (kind/parts/rows) and `problem.answer`; the wire carries neither. Note
  `CalculationVariant` and `CalculationStep` exist in BOTH `types/lesson.ts` and
  `api/variants.ts` with different meanings — alias on import.
- **`highlights` has no slot.** Backend-authored and required; carried by
  `useStudentProgress` and rendered nowhere.
- After-lesson "nothing landed" heading — ours, built from the frame's own
  wording. Needs sign-off.
- Forgot-PIN — `POST /api/v1/auth/pin/reset` exists and is deliberately not
  called; the frame draws the screen as informational.
- Home encouragement line — the designed copy claims something about the child
  that nothing verifies.
- Consent gate holding state — the gate never blocks.

---

## Teacher console

### Done 5 Sep

- `/teacher` root redirects to `/teacher/dashboard` (was a 404).
- `/teacher/students` redirects to `/teacher/classes` (was a placeholder string).
- Bulk ingestion shows the parse's `lessonTitle` with the filename beneath.
- Split a staged unit into lessons; named segment rows under each section.

### UNBLOCKED 7 Sep — per-student consent. FOR THE ADMIN SESSION.

**This was in NEEDS BACKEND and is now buildable.** The old entry said "no GET returns
consent for any student but the child themselves". That is no longer true. `consent` is
a **required** field on three responses plus the invite list:

| endpoint                                  | field                              |
| ----------------------------------------- | ---------------------------------- |
| `GET /api/v1/students`                    | `StudentSummaryResponse.consent`   |
| `GET /api/v1/students/{student_id}`       | `StudentDetailResponse.consent`    |
| `GET /api/v1/classes/{class_id}/students` | `ClassStudentResponse.consent`     |
| `GET /api/v1/invites`                     | `InvitationResponse.consentStatus` |

`StudentConsentSummary` carries `status` (the four values above), `actorName`,
`timestamp` and `channel` — who recorded it, when, and how. D07b's card was drawn for
exactly this; nothing needs deriving.

**The seam is already landed** — `StudentConsentSummary` is typed in
`lib/api/students.ts` and hung on `AdminStudentRow` and `AdminStudentDetail`, both
required, matching the spec. The stale comments saying consent "cannot be built" are
corrected. What remains is rendering: **D07's column, count and row action, D07b's
consent card, and the D5b roster pill.**

One caution carried over: **do not derive consent from the student's `status` field.**
An account being active is a different fact from a parent having agreed.

### NEEDS BACKEND

| screen                  | why                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C08c Recommend a lesson | Recommendations are **read-only** — `GET /api/intelligence/recommendations/{id}` only, returning prose (`recommendationText`), not selectable lesson options. No POST exists to send one. |
| C08d Session detail     | Needs a section-by-section breakdown nothing serves.                                                                                                                                      |
| C16d Variant Review     | No lesson read carries the variant objects.                                                                                                                                               |
| Escalate to SENCo       | No transport for a teacher-to-SENCo note. The button is disabled rather than lying.                                                                                                       |
| Teacher SSO connect     | **Not the slug problem.** Nothing in the API enrols a school; all ten SSO operations presuppose a connection that exists. The two `start` endpoints are pre-login user handovers.         |
| Profile photo upload    | The frame draws the affordance only.                                                                                                                                                      |
| Drive / OneDrive import | Blocked on per-school credentials.                                                                                                                                                        |

### NEEDS DESIGN

- Help & support — a sidebar item with nowhere to go; no frame draws it.
- Pulse banding — the Strong/Steady/Building cutoffs are a frontend invention.
- ~12 undrawn sections: C09's written summary, C06b's stat cards, the C03 flag
  sparkline (deferred to v1.5), the noticing banner, subject filter pills.
- "Specific students" in the assign wizard has no frame; the wizard errors.

---

## The contract gate now checks RESPONSE SHAPES — 10 Sep

`npm run contract` compared paths and request bodies. It never compared what an
endpoint ANSWERS with, which is the half that had already broken the console
twice. **Check 3 closes it, and it found three live drifts on its first run.**

Self-tested: reintroduce the flat `Subscription` and the gate names the exact
fields and exits 1; restore it and it exits 0.

**1. `RosterSyncHistory` was snake_case; the endpoint answers camelCase.**
`{windowDays, successfulRuns, failedRuns, runs}`, all required. The client had
`window_days`, `successful_runs`, `failed_runs` — so every one read `undefined`,
and `SsoView`'s `(history?.failed_runs ?? 0) > 0` coalesced to 0 and fell into
the **HEALTHY** branch.

So **the defect PR #269 existed to fix was still live afterwards.** #269 fixed
the failed-READ path; the field names were wrong on the successful path all
along. The tests in #293 passed because the fixtures were copied from the client
interface rather than the spec — a fixture copied from the type under test can
only prove the code agrees with itself.

**2. `POST /admin/sso/roster-sync` returns 202 `{runId, status, pollUrl}`.** The
client typed it as a finished result with counts, so "Sync now" rendered
**"Synced. undefined students and undefined staff imported."** The sync went
asynchronous on the backend and the frontend never absorbed it — which is also
why `GET /admin/sso/roster-sync/{run_id}` sat unconsumed: it is the poll target.
The screen now says a sync has started and claims no numbers it does not have;
`ssoApi.runDetail` is typed and waiting for the poll to be built.

**3. `PUT /notification-preferences` answers `{preferences, savedCount,
rejected}`,** not the rows back. Latent — nothing consumes the return — but a
caller that started to would have read `undefined`.

**What the check gates on, and what it deliberately does not.** It fails the
build on ONE thing: a property the client DECLARES that the response does not
have. That is drift with no innocent reading — the field is `undefined` at
runtime and the code believes otherwise. The converse, a response field the
interface omits, is NOT an error: a screen may read a subset, and check 2
already lists fields nothing reads. Being strict there would produce the false
positives this file's own header warns get a gate switched off.

**Known limits, so nobody over-trusts it:** it compares TOP-LEVEL response types
only — a wrong shape nested inside (`RosterSyncRun` inside `history.runs`) is
invisible to it. It skips unions, intersections, inline object literals and
generics rather than guessing. It reads any 2xx, not just 200/201, which is what
caught the 202 above.

---

## All 45 TODO(api) markers re-checked, 10 Sep

Every marker in the admin console was written against an older spec and none had
been re-checked. **45 markers, judged against one pinned copy of the deployed
document** (2.0.0, 183 paths, 335 schemas) so every verdict is comparable:

|                            |                                       |
| -------------------------- | ------------------------------------- |
| **20 actively misleading** | assert something the spec contradicts |
| 4 stale                    | true-ish, wrong details               |
| 21 accurate                | leave them alone                      |

**The pattern is not 45 independent drifts.** Roughly a third fall to ONE
BACKEND DEPLOY, 7 Sep, when consent became a first-class field on
`StudentSummaryResponse`, `StudentDetailResponse`, `ClassStudentResponse` and
`InvitationResponse`, the school narrative landed, and DPA acceptance became a
typed record. Renaming accounts for only three. So the markers did not rot
individually — they were invalidated in batches, which is the argument for
re-checking them in batches rather than one at a time when a marker is touched.

**The worst one is not a `TODO(api)` at all.** `BandStep`'s docblock cited the
deployed billing API as the tie-break for shipping enrolment bands: "`GET
/api/billing/subscription` returns `subscriptionTier` and `studentCountBand`...
Two of three say bands, and one of those two is the backend, so bands ship."
Neither field exists on `SubscriptionResponse`, and `PricingResponse` carries
`pricingModel` as a const `"per_student"` — so the backend is a vote AGAINST
bands, not for them. **Bands still ship** (SCRUM-39 asks for them and they are
built), but on one source rather than two, and the D11-vs-SCRUM-98 question that
docblock claimed to settle is still open.

**A real defect fell out of it.** `ClassStudentResponse.consent` is REQUIRED and
the client's `ClassStudent` interface did not declare it — so every class roster
read carried consent for every child and discarded it, while `ClassDetailView`'s
own marker called the missing consent column "the single biggest gap" on that
screen. Declared and rendered now, with the same `ConsentPill` the roster uses.

Note the response-shape check **cannot** catch that direction: it gates on
properties the CLIENT declares that the response lacks, deliberately, because a
screen may read a subset. A required field the client ignores only reaches
check 2's advisory list when NOTHING in the client names it — and `consent` is
named all over the students lane.

**All twenty corrected in place**, each stating what it used to say and what the
document holds rather than quietly changing its mind. Four landed with the audit
(`AdminSidebar`, `JoinLanding`, `ClassesView`, `StudentDetailView`) alongside
`BandStep` and the two Settings docblocks; the remaining sixteen landed 11 Sep.

_(The PR that closed the first four said "fourteen remain". The real number was
sixteen — that count was taken before `BandStep` was reclassified. Corrected
here rather than left to be rediscovered.)_

## The three things the audit itself got wrong, 11 Sep

Correcting the sixteen meant re-verifying each against the pinned spec first,
and that surfaced three problems with the audit, not just with the markers.

**1. It missed a sibling.** `ClassDetailView`'s SECOND marker said an assignment
history "No endpoint returns it" — the identical claim to the one being
corrected on `TeacherDetailView`, in a file the audit had already opened.
`AssignedTeacherResponse` carries `role` and `assigned_at`, both required, and
`ClassDetailView` already holds them in `teachers`. Three of SCRUM-40's five
fields are on a call the screen makes; what is missing is WHO CHANGED IT and
ENDED assignments. Corrected. The lesson is the one already in the recurring-
defect list: when a marker is wrong, grep for the same sentence elsewhere.

**2. It never swept `src/lib/api/**`.** The audit covered
`src/components/admin/**` and reported "every marker in the admin console",
which read as complete. Eight API-client files carrying `TODO(api)` were never
examined — and those files are where contract claims are densest. Sweeping them
by hand found two more:

- `school.ts` had **two docblocks stacked on the same function saying opposite
  things**: "the schema declares a 201 with NO PROPERTIES" sitting directly
  above "IT RETURNS A BODY, and this was typed `void`". A correction was written
  and the thing it corrected was never deleted. Merged, keeping the one claim
  that survives (still no session on the 201).
- `sso.ts:114` asked backend to "poll the run and report the real counts" two
  lines below its own paragraph naming the poll route and its client wrapper.

The other six check out: `invites.ts` (no delivery field on `InvitationRequest`
— true), `students.ts` (`StudentMove` is `{classId}` only — true), `billing.ts`
(`vatRate` is a bare `string` with a numeric pattern and no example, so
percent-vs-fraction really is unresolved — true), `team.ts` (a question, not a
claim), and `askNevo.ts`/`signals.ts`, which belong to the student lane and are
left to it.

**3. A NEW defect shape, which the audit's categories had no name for.** Several
markers were not stale at all — they were **addressed to the wrong party**.
`TODO(api)` on work that needs no backend: SsoView's sync log (the structured
`issues[]` is already on the response), sso.ts's polling loop, the class filter
on AdaptationLogView (`classId` is already a declared query param). A marker
tagged `TODO(api)` is invisible as client work; it reads as blocked. These are
retagged `TODO (client, not api)` so the distinction survives a grep.

## The buildable-today list, worked through — 11 Sep

Nine items, each planned against the pinned spec and then handed to a second
agent told to REFUTE it. **Six survived and are built. Three were refuted**, and
two of those refutations found things that mattered more than the item.

### Built

|                               |                                                                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adaptation log class filter   | `classId` was a declared query param all along. Omitted rather than blanked (it is a uuid; `""` is a 422), resets the growing-limit pagination, names the class in the count, and the class list owns its own failure. |
| Getting-started TEACHERS tick | From `counts.teachers`, already in state. `SchoolRosterCounts` has NO `required` array, so `teachersOnRoster` tests `typeof === "number"` rather than `?? 0` — an absent count is unknown and leaves the row open.     |
| SSO "View technical details"  | `RosterSyncRunResponse.issues[]` was typed `unknown[]` and discarded. Now `RosterSyncIssue[]`, rendered per row. `RosterSyncStatus` also gained `running`, which the union had been missing.                           |
| Two NDPA rows                 | Consent coverage and the retention position now carry real figures under a new `school` verification. Any row that came back without a consent record sends the whole claim back to `unverified`.                      |
| Learner engagement patterns   | The five `observations` patterns phrased once, in `lib/constants/observations.ts`, with the Zero-Tag reasoning per pattern and a test that fails on trait vocabulary.                                                  |
| Assignment dates              | On the ROWS, with no history section — see below.                                                                                                                                                                      |

### Refuted, and why that was worth more than the item

**The invite consent line.** The refuter found the planned `not_sent` copy would
promise an action the product cannot perform — nothing creates a `ParentLink`
from an invite's `parentContact`, so "you can send one from their record" is a
promise D07 then denies. Chasing that turned up something much larger, below.

**The Overview roll-up.** `GET /api/intelligence/flags` returns a BARE ARRAY
capped at `limit` (default 50, max 200) with the real total in `X-Total-Count` —
a header the client's `buildUrl`/`api.get` path never exposes. Worse, that
header counts FLAGS while the row's copy claims STUDENTS, and they differ
whenever one child has two. Not built.

**The SENCo list figures.** My own marker correction called "adaptations this
week" _one windowed call_. It is not: `limit` maxes at 100, and
`AdaptationEventLogResponse.total` carries **no description in the spec**, so it
is not known to be window-scoped or uncapped. A completeness gate resting on it
could silently under-report every per-learner tally — the exact failure the item
named as the thing to get right. The only exhaustion signal the contract
actually supports is `events.length < limit`. Not built.

### The defect that came out of it, which is bigger than the list

**NEVO IS NOT THE CONSENT GATE, AND THE ADMIN CONSOLE SAID IT WAS.**

SCRUM-80 (7 Sep) ruled that the school warrants consent through the DSA, so
`not_sent` and `pending` are the school's administrative task and the child
proceeds; only a WITHDRAWAL stops processing. `lib/api/consents.ts` has encoded
that ruling since, naming `processingWithdrawn` "the only consent question the
frontend is entitled to act on". The deployed contract agrees — `ConsentGateResponse`
carries `granted` and `blocked` as two separate required booleans.

The admin console answered the wrong one in **eight places**, including
`blockedByConsent()`, whose count fed D07's header and whose name encoded the
error. A school that had asked every parent and heard back from none was told
its entire roster could not begin lessons. `StudentDetailView` said it about a
named child.

Fixed across all eight. The count survives — "who have we not recorded consent
for" is a real question a school must answer for its own DSA — but it is now
`withoutRecordedConsent`, paired with a separate `withdrawnCount`, and every
sentence describes the SCHOOL'S RECORD rather than a consequence for the learner.

**This is the fourth instance of the same shape** and the most consequential:
the console asserting something the API never said. The previous three were
markers; this one was shipping copy about a legal position, on children.

### The cross-lane consent sweep — 11 Sep

After fixing the admin console's eight sites, I swept every lane, because a fix
applied in one place and not its neighbour is how this pattern keeps recurring.

| lane           | verdict                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Student**    | Already correct. `LearningNotice` was explicitly de-gated for SCRUM-80 by that session — "WAS `ConsentGate`, AND IS NO LONGER A GATE" — and the `consent-gate` call was removed.     |
| **Parent**     | Withdrawal copy in `ParentDataManagement` is CORRECT and was left alone: withdrawal is the one state that genuinely stops processing.                                                |
| **Teacher**    | No consent-gating copy at all.                                                                                                                                                       |
| **Shared lib** | `lib/api/students.ts` carried the seed framing — 'D7 exists to answer "which students cannot yet begin lessons"'. Corrected; that sentence is where the eight admin sites came from. |
| **Admin**      | The offender. Eight sites, fixed.                                                                                                                                                    |

**Two things found that are NOT mine to fix, both flagged in place:**

**1. DPA clause 5 contradicts SCRUM-80, and the school formally accepts it.**
`lib/mocks/dpa.ts` warrants that Nevo "will not activate a learner whose consent
has not been confirmed". SCRUM-80 says the learner proceeds. This is not copy
drift: `POST /school/dpa-acceptance` records the version, the accepting
administrator and the timestamp, and D22 then cites that acceptance as evidence
— so it is a contractual term that may not describe the product. Unlike clauses
6 and 7 it carries no `[Placeholder]` marker, so it reads as settled. **The text
is deliberately unchanged** — silently rewording a term a school has already
accepted would be the worse error. Either the clause changes or the product
gates, and that is counsel's call. A conflict block sits above it in the file.

**2. Nothing enforces withdrawal client-side.** `processingWithdrawn` and
`myConsentGate` have no production callers anywhere — only tests. Meanwhile the
parent is told withdrawal "will immediately suspend {child}'s access". That
promise currently rests entirely on backend enforcement we have not verified;
`ConsentGateResponse.blocked` suggests the backend does gate, but nothing on our
side checks. Worth confirming with backend before a parent relies on it.

**Also worth a second look:** `ParentConsent.tsx` tells a parent "your consent is
all we need before she begins", which overstates their role as the gate. It is
the parent lane's copy and a defensible framing of a genuine request, so it is
left to that session rather than changed from here.

### Assignment history: deliberately still not built

SCRUM-40's own words are "date, teacher, class, role, and who made the change",
its data note asks for `GET assignments/history?class_id=`, and its "done when"
requires the log to be **append-only and to show who made each change**. None of
that exists: no schema carries an actor, the DELETE returns no body, and nothing
has an `ended_at`. A collapsed second list of the same rows differing only by a
date would be a duplicate under the one heading it cannot honestly carry. So the
date sits on the row and a plain sentence states the limit. The section stays
unbuilt on purpose, not for want of an endpoint.

### Still buildable, not built

|                            |                                                                                                                                                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Invitation consent line    | `consentStatus` is declared on `Invitation` now and still unread. The copy must be written AFTER the SCRUM-80 correction above, not against the old "can't begin lessons" wording, and the `not_sent` branch must promise no action — nothing creates a `ParentLink` from an invite's `parentContact`. |
| Overview roll-up rows 1-2  | Row 1 (pending consent) is exact from the unpaginated `GET /api/v1/students`. Row 2 needs paging `/api/intelligence/flags` at `limit=200` and deduping by `studentId`; the `X-Total-Count` header counts flags, not students, and the api client does not expose headers.                              |
| SENCo per-learner figures  | Lessons-completed is cheap (the roster read this screen already makes, per class). Adaptations-this-week needs a paging loop terminating on `events.length < limit` — NOT on `total`, whose semantics the spec does not document.                                                                      |
| Adaptation log TYPE filter | Genuinely blocked. `eventType` is a response field with no query param and no enum.                                                                                                                                                                                                                    |
| Assignment history proper  | Blocked on an actor field and on ended assignments. See above — the dates shipped, the history did not.                                                                                                                                                                                                |

If the Overview roll-up rows go live, the `SampleRegion` wrapper must narrow to
the one surviving fixture row and the "These three are a sample" note must
change with it, or the e2e suite is trained to accept a real roll-up as an
invented one.

### The vitest worker flake

`Failed to start forks worker ... Timeout waiting for worker to respond` hit
five separate runs today, reporting "no tests" or a short count with exit 1 —
including a run that showed 398 of 466 passing and looked like a real
regression. It is worker-spawn contention between the parallel sessions, not
code. **`npx vitest run --no-file-parallelism <file>` is a reliable workaround**
and settled it every time.

### Every marker, with its verdict

| marker                         | verdict        | severity   | asks for                                                                                   |
| ------------------------------ | -------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `CostSheet.tsx:38`             | still_true     | accurate   | Whether PricingResponse.vatRate is a percentage ("7.5") or a fraction ("0.075") - the cont |
| `ClassDetailView.tsx:52`       | partially_true | accurate   |                                                                                            |
| `ClassesView.tsx:37`           | still_true     | accurate   |                                                                                            |
| `InvitationsView.tsx:29`       | still_true     | accurate   |                                                                                            |
| `InvitationsView.tsx:34`       | still_true     | accurate   |                                                                                            |
| `JoinLanding.tsx:28`           | still_true     | accurate   | A name (or first name) on the public join-link lookup, so D19's "Welcome, Amara" greeting  |
| `inviteStatus.tsx:11`          | still_true     | accurate   | An enum on the invitation `status` field, so the four lifecycle values the frame draws are |
| `NotificationsView.tsx:32`     | still_true     | accurate   |                                                                                            |
| `NotificationsView.tsx:50`     | partially_true | accurate   |                                                                                            |
| `DpaStep.tsx:36`               | still_true     | accurate   | A GET endpoint that serves the DPA document TEXT (`{version, html}`) so the agreement word |
| `SignUpStep.tsx:57`            | still_true     | accurate   | A session (access token) returned by the school-registration call, so the wizard need not  |
| `ReportsView.tsx:60`           | still_true     | accurate   | A list of named school reports, each exportable as PDF or CSV, for the D09 Reports screen  |
| `IepExporterView.tsx:56`       | still_true     | accurate   | A read endpoint returning the share records for an IEP export, so share state survives a p |
| `LearnerProfileView.tsx:41`    | still_true     | accurate   | A PDF (or any document) route on a learner read, so D8b's "Export Profile as PDF" action c |
| `MoveStudentSheet.tsx:23`      | still_true     | accurate   | A way to schedule a class move for a future date (start of next term) rather than executin |
| `StudentDetailView.tsx:57`     | still_true     | accurate   | An enrolment date, a hand-enrolled-vs-roster-sync provenance line, and three per-guardian  |
| `TeachersView.tsx:38`          | still_true     | accurate   |                                                                                            |
| `TeachersView.tsx:43`          | still_true     | accurate   |                                                                                            |
| `AdminTeamView.tsx:44`         | still_true     | accurate   | Nothing from the API. It records that the scope-write endpoint exists and is typed, and th |
| `AdminTeamView.tsx:303`        | still_true     | accurate   | An endpoint the "Request another account" button could call to ask Nevo for an admin seat  |
| `adminScopes.ts:100`           | still_true     | accurate   |                                                                                            |
| `AdaptationLogView.tsx:33`     | partially_true | misleading | Three things: (1) a before/after pair on each adaptation event, (2) an eventType filter, ( |
| `AdminSignIn.tsx:34`           | partially_true | misleading | Two API gaps: (a) nothing resolves a school before authentication, so the D02 school eyebr |
| `AssignTeacherSheet.tsx:38`    | partially_true | misleading | A backend guarantee that assigning a new primary demotes the incumbent in one transaction, |
| `ClassDetailView.tsx:44`       | now_false      | misleading |                                                                                            |
| `ClassesView.tsx:46`           | now_false      | misleading |                                                                                            |
| `ndpaClaims.ts:53`             | partially_true | misleading | Four school-level figures the screen says it cannot verify: a consent coverage count, eras |
| `JoinLanding.tsx:33`           | partially_true | misleading | A student-side route that reads the join token off the query string and redeems it, matchi |
| `deliveryCopy.ts:30`           | partially_true | misleading | Either a consent state carried on the invitation itself, or an endpoint that queues a pare |
| `AuthMethodStep.tsx:26`        | partially_true | misleading | A real field to write the D1.2 sign-in choice into, instead of parking it in the untyped ` |
| `OverviewView.tsx:53`          | partially_true | misleading | Three things: (1) a narrative/summary endpoint, (2) a roll-up of items needing an admin de |
| `overviewGettingStarted.ts:28` | partially_true | misleading | A data signal for each of the three open checklist steps (teachers invited, sign-in config |
| `overviewSample.ts:14`         | partially_true | misleading | A single endpoint that rolls up the items at this school that need an admin's decision, to |
| `ReportsView.tsx:52`           | partially_true | misleading | Adaptation sequences keyed to a shared objective, so three anonymised learners' different  |
| `LearnerProfileView.tsx:46`    | partially_true | misleading | A dedicated source of titled per-learner observations for D8b's ENGAGEMENT PATTERNS, inste |
| `SencoView.tsx:56`             | partially_true | misleading | A bulk route that returns active support, lessons completed and adaptations-this-week for  |
| `AdminSidebar.tsx:29`          | partially_true | misleading | A profile endpoint that would supply the signed-in admin's real name and job title in plac |
| `SsoView.tsx:50`               | partially_true | misleading | A raw server-rendered sync log text blob to render verbatim in a <pre> behind "View techni |
| `EraseRecordModal.tsx:27`      | partially_true | misleading | A real retention deadline date to quote in the erase copy, in place of the frame's hardcod |
| `StudentDetailView.tsx:50`     | now_false      | misleading | A consent card, on the grounds that the student read carries no consent state, giver, date |
| `TeacherDetailView.tsx:42`     | partially_true | misleading | A last-active timestamp for an arbitrary teacher, an assignment-history endpoint, and a se |
| `NotificationRow.tsx:139`      | partially_true | stale      | A category field on each notification row, so the label can read as one of SCRUM-100's six |
| `BandStep.tsx:42`              | partially_true | stale      | A first-class enrolment-band field on the school resource, so the band is not stored as an |
| `IepExporterView.tsx:59`       | partially_true | stale      | A PDF rendering route for a finalised IEP export, so the screen can offer Download PDF.    |
| `SsoView.tsx:194`              | still_true     | stale      | Nothing itself - it is a cross-reference pointing at the marker on the RosterSyncAccepted  |

---

## Admin password recovery, 10 Sep

`AdminSignIn`'s own failure copy told a locked-out proprietor to "reset your
password" and gave them **nothing to press**. `/auth/forgot-password` was a
nine-line placeholder. A proprietor locked out of their own school had no way
back in.

**Its docblock said "No reset endpoint exists anywhere in the spec."** Two do —
`POST /auth/forgot-password` and `POST /auth/password-reset/complete` — and the
TEACHER console has consumed both since 1 Sep. One of the four stale docblocks
the 10 Sep handoff flagged, and it had "a password reset endpoint" sitting in a
TODO(api) list for something already live.

**The screen is shared, not copied.** Both endpoints are role-agnostic, so the
only thing teacher-specific about `TeacherPasswordReset` was where its links
point; those are props now, defaulting to the teacher paths so that route is
untouched. A second copy would drift, and the existing one already carries the
reasoning that matters — the request shows the same confirmation whether or not
the address is known, so the screen cannot be used to discover who has an
account.

Three routes now: `/auth/admin/reset` (linked from sign-in),
`/auth/teacher/reset` (unchanged), and `/auth/forgot-password`, which is real
rather than a placeholder because **the backend composes the emailed link** and
this side cannot know which URL it points at. Its sign-in link goes to the
landing page, which carries both console doors — nothing at that URL knows
whether the person is a teacher or an admin, so picking one would be a guess.

2 e2e tests in a real browser, one mutation-verified: remove the link from
sign-in and the path test dies.

---

## Admin team invite — the 8 Sep defect in its sibling, 10 Sep

`AdminTeamView` rendered **"They'll get an email to set a password and join."**
Nothing supported it. The 201 carries `invitation_id`, `user_id`, `email`,
`role`, `scopes`, `invitation_token` and `expires_at` — and **no delivery state
of any kind**, unlike the student invites, which carry `deliveryStatus`
precisely so a screen can tell. So the console could no more promise an email
than deny one, and it now does neither.

**Worse, the response was discarded.** `.then(() => ...)` threw away
`invitation_token` — the only way to build an activation link — and then
`setTimeout(onSent, 1400)` navigated away, so the single copy was gone before
anybody could act on it. The same shape as the bulk import's dropped join
tokens, in its sibling surface, three days later.

The screen now holds the invitation on screen until the admin presses Done, and
hands over the link.

**The link had nowhere to land, which the handoff did not mention.**
`SetPasswordForm` in activation mode has been live against
`POST /admin/team/invitations/accept` — the ADMIN TEAM endpoint — all along, but
the only route rendering it was `/auth/teacher/activate`. So the one flow that
accepts an admin invitation was reachable only at an address reading "teacher".
`/auth/admin/activate` now exists and shares the component rather than copying
it. It is public by the same mechanism the teacher route relies on: the proxy
matcher lists `/auth/admin` exactly, not `/auth/admin/:path*`.

**Resend and revoke are absent, and said so.** There is no endpoint for either
on an admin invitation — unlike student invites, which have both — so the panel
states it plainly instead of offering a control that cannot work.

4 tests, three mutation-verified guards.

---

## Consent requests — the trigger nothing had, 10 Sep

`consentsApi.requestParentConsent` was typed with **zero callers**, and the
whole parent surface sat behind it: three finished, merged screens that no
family could reach, because nothing in Nevo could send anybody a link.

**Three of the four surfaces are live now.** D07's row action ("Send request",
the frame's own words), D07b's card action ("Send a gentle reminder" on a
pending request, "Sending…" in flight), and the Overview checklist's dead row,
which now links to `/admin/students` instead of reading `cta: "When ready"`.

**The parent's details come from the record, not a form.** The endpoint needs
`{parent_name, parent_contact, contact_method}` and `ParentLink` carries all
three, so the admin presses one thing — D07 is explicit that "sending a request
is deliberate and per-student". The roster row does not carry the link, so it is
fetched on the press.

**The receipt is READ, not assumed.** The endpoint answers 202 with
`delivery_status`, and only `sent` means a parent was written to. `queued` and
`processing` say queued. This is the same distinction the invite surfaces got
wrong until 8 Sep and it is not being repeated.

**A child with no guardian contact is not an error** — it is the ordinary state
of a child enrolled before anyone recorded one, and it gets its own outcome
rather than a failure. Nothing is posted on its behalf.

**Two drifts fixed on the way.** `ConsentDeliveryStatus` was narrowed to three
values in the client; the spec has four (`processing` was missing), so a real
value would have fallen through every branch. The response-shape check compares
property NAMES, not enum members, so it cannot see this class — worth knowing
about the tool. And `ParentLink.contact_method` is a bare `string` on our side
against an `email | sms` enum, so an unrecognised value is now decided by the
contact itself rather than passed through and 422'd.

**A stale docblock corrected, one of the four the handoff flagged.**
`overviewGettingStarted.ts` claimed "No endpoint reads consent for a roster, so
there is nothing to link to". `AdminStudentRow` carries `consent` — it is what
`blockedByConsent` counts on the roster header. Left in place as a struck-
through caution rather than deleted, because a docblock that stops being true is
the most expensive comment in a codebase.

9 tests, four mutation-verified guards.

**The fourth surface is not done:** the roster header's "N can't begin lessons
yet" clause still only counts. Settling the Overview checklist row from data
(rather than just linking it) also remains — it needs the Overview to fetch the
roster, which is a call that screen does not make today.

---

## Admin console — dialog dismissal, 10 Sep

**Every admin dialog could be dismissed while its own write was in flight**, and
none of the three routes could see the write. `Sheet` and `Modal` gated Escape,
the backdrop press and the X on nothing at all.

Nothing in `lib/api` carries an AbortController, so a dismissed request always
completes. The `.then` then sets state on an unmounted tree, React discards it
in silence, and the dialog's own honest copy is never shown to anybody: "the
class was created, but the teacher wasn't assigned", the half-applied count on
a bulk revoke, the erase confirmation. **That is the inverse of the law this
console has fixed fifteen times** - a write that DID happen, reading as one
that did not - and `WriteFailed`'s own header states the assumption every one
of those fixes rested on: "the dialog stays open and the button stays
pressable".

**THE RULE: reflex dismissal is inert while `busy`; deliberate dismissal is not.**

- **Escape** - inert. No target, no confirmation, and it is the gesture most
  likely to be fired BECAUSE a write is slow.
- **Backdrop** - inert. It fires on mousedown, before a release could be
  redirected, so it already catches a click meant to refocus the window.
- **The X** - stays live. It is the only route that must be acquired and
  clicked, the only one named in the accessibility tree, and the only one a
  keyboard reaches by decision. Every dialog already withdraws its own Cancel
  mid-write, so deadening the X too would leave a browser reload as the only
  exit - which loses strictly more than the dismissal does.

Three overlays already worked this way by hand and were the precedent:
`AdminSignOutModal` gates Escape on `!busy`, `BillingContactSheet` and
`SsoView` gate their backdrops. None has an X, which is why they were silent
on it. `AuthMethodStep` was already inert on all three and needed no change.

**THE TRAP, and it is the whole reason this could have shipped broken.** The
keydown effect's deps were `[onClose]`, and callers pass a stable handler - so a
`busy` read inside the listener is captured on the first run and keeps its
MOUNT-TIME value for the life of the dialog. The guard reads correctly in the
source and does nothing. A ref is the usual dodge and `react-hooks/refs`
forbids writing one during render, so `busy` is in the deps; re-registering a
document keydown twice per dialog is cheap. **There is a test for exactly this**,
and the mutation that drops `busy` from the deps kills it.

Nine dialogs wired, `aria-busy` on both panels, 14 tests, three
mutation-verified guards.

**Still open, logged rather than folded in:** the teacher-removal confirm strip
in `ClassDetailView` is inline, not an overlay, so the prop cannot reach it - it
has no in-flight state at all, its confirm double-fires, and "Keep them" stays
live mid-DELETE. `StudentDetailView`'s "Restore this student" fails the same law
by a different door (`.catch(() => undefined)`). Both are their own tickets.

---

## Admin console — Settings, 10 Sep

**`/admin/settings` was a nine-line placeholder, and the rail linked every admin
to it.** Twelve audit lenses never found it, because a screen with no logic in
it gives a logic lens nothing to indict. It only surfaced when the design
reference was checked against the routes rather than the routes against
themselves.

**The work already existed.** PR #210 built D12/D12b/D12c on 1 Sep and was
closed on 8 Sep **as stale, not rejected** - "admin settings now belong to the
admin session rather than this one... the branch is left in place, so the work
is recoverable if the admin session wants to pick it up". It is picked up:
cherry-picked onto main with two conflicts (`auth.ts`, `school.ts`, both
additive on each side and both resolved by keeping both).

**Two spec deviations fixed on the way in.** SCRUM-99 says "not tabs" twice -
in rule 1 and again in D12.1 - and it shipped as a `role="tablist"`. It also
rendered the school half for every admin, where D12.1 requires it "absent
entirely, not greyed" for a non-oversight admin, with a done-when of "a
billing-only admin sees a coherent page with no empty school section". Both are
now two stacks under super-headings, scope-gated, with the section index.

**What is genuinely absent, and stays absent rather than mocked:**

| section                     | why                                                                                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D12.4b Promotion            | No endpoint. Needs a bulk year-group advance, a leavers pass and a 7-day undo; `PATCH /students/{id}/class` is a different operation. A control that appeared to move 287 children and silently did nothing would be dangerous. |
| D12.8 Two-step sign-in      | No endpoint anywhere - no enrolment, no secret, no verify, no recovery codes.                                                                                                                                                   |
| D12.6 Profile editing       | `GET /api/v1/users/me` is the only route on that resource. No write, so name, role title and email are shown as the record has them.                                                                                            |
| D12.2 address / logo / band | `PATCH /school` takes `{name, profile, academicConfig, retentionPolicy}` only, and there is no logo upload endpoint.                                                                                                            |

**Three settings still live in an untyped blob.** `academicConfig` is
`additionalProperties: true`, so the term dates and the year-group label map are
a provisional contract - the third in this codebase after the onboarding block
and the school contact. The labels are the load-bearing one: every screen reads
them through `yearGroupLabel`, and nothing validates the shape. **This wants a
typed home before launch.**

Retention, by contrast, is a real enum and matches the spec exactly:
`contract | contract_plus_3_years | contract_plus_7_years`, with no indefinite
value - D12's "12 months" option is not offered because no enum value exists
for it.

---

## Admin console

**That sentence used to read "every frontend-fixable launch blocker is shipped,
and nothing in this console is frontend-blocked any more". It was wrong.** On
8 Sep the billing screen turned out to have five, and they had been live the
whole time — see **Billing was broken against the deployed contract** below.
What is true is narrower: every blocker anyone had LOOKED FOR was shipped. The
console had never been checked against the deployed contract field by field,
because the tool for that only checked half of it.

Surveyed in depth 6 Sep (eight-dimension audit at `87192e8`, every blocker
adversarially re-verified; the quality and ops dimensions did not report, so test
debt and deploy/monitoring remain unassessed). That audit found nine launch
blockers; all nine are closed, seven by PRs #251, #257, #258, #264, #267, #269
and #281, and two by the 7 Sep backend deploy.

### Audited again, 8 Sep — 15 more, and they are NOT all fixed

A second sweep ran twelve independent lenses over the console against a clean
checkout, and put every candidate through three adversarial skeptics (does the
code do this; is it actually launch-blocking; is it already known or shipped).
**85 candidates, 15 survived.** Ten of the fifteen are ONE defect wearing ten
faces, which is why they were invisible one screen at a time:

> **A write that failed looked exactly like a write that succeeded.**
> `.catch(() => setConfirming(false))` closes the dialog, drops the spinner and
> returns the screen to rest — which is byte-for-byte what the admin saw the
> last time it worked.

**Shipped (this PR):** the five where the fix is "say it, keep the affordance,
and put the message where they are looking" — `WriteFailed` is the shared
primitive, the mirror of `ReadFailed`:

| screen                 | what a refusal used to do                                                     |
| ---------------------- | ----------------------------------------------------------------------------- |
| Notifications          | cleared every unread dot anyway; "Unread only" then said "You're up to date." |
| Class detail — archive | closed the dialog; the class stayed live on every list                        |
| Class detail — restore | nothing at all, and the button stayed double-clickable                        |
| SSO disconnect         | painted its only message _behind_ the modal still covering the screen         |
| Student deactivate     | swallowed entirely, under the words "their seat frees up"                     |

All five are pinned by tests and mutation-verified: each guard was collapsed
back to its pre-fix catch and the right test failed.

**ALL FIFTEEN ARE SHIPPED**, across PRs #301, #303, #306, #310, #312 and #314.

**CORRECTION (9 Sep).** Four PR bodies and this section said a "minor
notification-row item" was still open. It never was. That came from reading
`reproduce:NotificationRow.tsx` in the labels of agents that DIED on a session
limit during the audit - an unverified candidate, not a confirmed finding - and
repeating it without checking it against the confirmed fifteen. Nothing about
`NotificationRow` was ever confirmed. If you went looking for it, that is why
you found nothing.

### Closed out and re-audited, 9 Sep — READ THIS BEFORE TRUSTING THE FIFTEEN

The fifteen were re-verified against a clean checkout of main, one skeptic per
finding, asking whether each fix was actually closed rather than whether the
original finding was real. **Five were not** (3, 4, 5, 9, 15), one had shipped
with no test that could fail (12), and two of the fixes had introduced new
defects. All of that is now fixed in a seventh PR; the numbers below are after
that.

**The pattern, and it is worth carrying to the other consoles:**

> The six PRs taught the console to tell FAILED from FINE. They did not teach it
> to tell IN FLIGHT from ANSWERED.

`AssignTeacherSheet`, `SencoView`'s per-class fan-out and the IEP exporter each
had two read states where they needed three, and `[]` plus `failed: false` are
also the values on first render. So each printed a signed statement about a
school's staff, a class's children or a roster during the window when nothing
had answered - and `AssignTeacherSheet` had been made WORSE, because the new
copy ("No staff to assign yet. Invite a teacher first") is an instruction where
the old wrong sentence was merely inert.

**The tests could not see any of it**: every mock in the admin suite settled
synchronously, so a test asserting the empty-state copy passed against a promise
that never resolved. The pending-window tests now hold a request open with
`new Promise(() => {})`, which is the only way that state is reachable.

**Two regressions the fixes introduced, both now closed:**

- `ClassesView` — narrowing `ssoSourced` to active classes while the Create gate
  still read the raw list made it fail OPEN: an SSO school whose last live class
  was archived got "Create a class" back, which SCRUM-97 says must be absent.
- `SignUpStep` — the never-register-twice guard was local state, and the wizard
  unmounts the step whenever it moves on. Step 1's Back remounted it with the
  guard reset, so one press unlocked the fields on a school that already
  existed. `registration` lives on `WizardState` now.

**Three claims that were true in one direction and wrong in the other:**
`deliveryStatus` is nullable and the client casts JSON unchecked, so a null
took the confident arm in both invitation surfaces ("Invite resent to X", "N
invites sent") - the claim is asserted only on `sent` now, via `confirmedSent`.
`StudentDetailView` never cleared its failure flag on success. `LinkHandout`
told an admin on the invitations list to "resend from the invitations list".

What IS true, and is the real caveat on this audit: **the sweep never finished.**
Of 269 agents, 214 died on the session limit, so its own completeness critic,
second round and ranking never ran. 85 candidates were raised and only a
fraction reached a verdict. Fifteen confirmed and fixed is a floor, not a
ceiling.

~~_The invitation delivery family_~~ — **SHIPPED.** Both halves: the wording
now reads `deliveryStatus`, and the join links are handed over instead of
discarded. `needsManualDelivery` finally has callers. Details under
**The invitation family** below.

~~_The failed-read family_~~ — **SHIPPED.** All four, details below.

_Smaller:_

- ~~**`SignUpStep`**~~ — **SHIPPED.** See below.
- ~~**`SencoView` "Mark as seen"**~~ — **SHIPPED.** See below.
- ~~**`ClassesView`**~~ — **SHIPPED.** See below.

The full finding set, with the skeptics' reasoning, is in the audit output for
run `wf_107dccdc-839`.

### The invitation family — shipped 8 Sep

The console could create 200 staff invitations, email none of them, and report
"200 invites sent" over a navy tick. `InvitationDeliveryStatus` is
`not_requested | sent | email_not_configured`, and the contract's own words for
the last one are "the invitation exists and its link is valid, but nobody was
emailed, so the caller has to deliver it another way". Nothing read it.
`needsManualDelivery` was written for exactly this and had **no caller
anywhere**.

Wording alone would not have fixed it. The join `token` arrives on the create
response, `BulkImportModal` was the only thing holding it, and it was dropped
when the modal unmounted — while `NewInviteModal` was the ONLY place in the
entire admin surface that built a `/join/<token>` link. So a school whose import
emailed nobody had one recovery: revoke and reissue, one person at a time,
through a modal that rejects duplicates.

What shipped:

- **`joinLink.ts`** — the link, the invitee's display name, and a pasteable
  block, in one place instead of inline in one modal. Returns null on a missing
  token: `token` is nullable in the contract and only promised on create, and a
  button yielding `/join/null` is worse than an admitted gap.
- **`LinkHandout.tsx`** — the links for invitations nobody was emailed, with a
  per-row Copy and a Copy-all that produces a block a bursar can paste into
  WhatsApp. Rows without a token are counted and named, never faked. Scrolls, so
  a 200-row import does not push the modal's actions off screen.
- **`BulkImportModal`** — titles "N invitations created" rather than "N invites
  sent" whenever any row went undelivered, says how many, and hands over their
  links. A stale comment in that file asserted the bulk response "carries no
  delivery state at all"; it is wrong — `created` is an array of full
  `InvitationResponse` — and it had been justifying the false claim.
- **`InvitationsView`** — Resend reads the row it is handed instead of
  announcing "Invite resent to <name>" over an answer of `email_not_configured`.
  When nobody was emailed it opens the handout **in the row** rather than in a
  three-second toast, and every row that carries a token now offers Copy link.

14 tests, four mutation-verified guards.

### The failed-read family — shipped 9 Sep

The #269 shape again, in four screens that sweep never reached. All four now
distinguish a broken GET from an established fact, three of them through the
existing `ReadFailed` primitive.

- **`IepExporterView`** — the worst, because the empty list was also the
  disabled state. `.catch(() => setStudents([]))` left the picker with nothing
  to choose, so `studentId` stayed `""` and "Generate draft" was disabled
  forever with nothing on screen saying why: a SENCo sitting down to draft an
  IEP met a dead end. **The guardian read three lines below it in the same file
  got exactly this fix in #269** — its sibling was missed, which is the argument
  for grepping the whole file rather than the reported line.
- **`AssignTeacherSheet`** — one sentence covered three different situations and
  was true in one. A school that has invited no staff yet is the FIRST-RUN
  state — `ClassesView`'s own empty state tells them to "create your first
  class, then assign a teacher" — and it was told everyone on staff already
  taught the class. Now: a failed read says so, an empty roster says "invite a
  teacher first", and only a genuinely exhausted roster says everyone teaches
  it.
- **`SencoView`** — one roster request per class, each able to fail on its own.
  A class whose request failed contributed nothing to `classOf`, so filtering to
  it matched nobody and said "No profiles match", which reads as a fact about
  the records.
- **`TeacherDetailView`** — the mechanism was ARCHIVED classes, not a failed
  read: `classesApi.list()` excludes them, so a class archived at the end of
  last term went missing from the map, `?? 0`'d out of the headcount, and was
  still counted by the Classes card beside it. Now the list is fetched with
  `includeArchived`, archived classes are named rather than silently
  subtracted, and a class we genuinely cannot see makes the figure a stated
  floor ("in the classes we could read") instead of a total.

13 tests, six mutation-verified guards.

### The half-created school — shipped 9 Sep

The inverse of every other defect in this audit: a write that DID happen,
reported as one that never did.

Onboarding does two round trips — `POST /schools/register`, then a sign-in,
because the register response carries no session — and they sat in one promise
chain under one `.catch`. Register succeeds, the login times out, and the
proprietor reads _"That didn't go through, and nothing has been created yet"_
while their school and their own admin account both exist. Continue is still
armed, so they press it, register a SECOND time, and get "this email is already
set up with a school" — which reads as their mistake, on a school they
successfully made.

The two are separated now, and once the school exists this step will not
register again at any price: the fields lock and the only action left is to
retry the sign-in. The panel names the school, says nothing needs creating
again, and quotes the school code.

**`POST /schools/register` was typed `void` and returns a body.**
`SchoolRegistrationResponse` is `{schoolId, adminId, schoolCode}`, all required
— three facts the wizard was discarding, including the code the school signs in
with. The docblock asserting "declares a 201 with no body" was stale. It still
returns no SESSION, so the second round trip is still needed; that TODO stands.

### "Mark as seen" — shipped 9 Sep

The optimistic half of the #301 fix, now closed. The flag was flipped before the
POST returned and rolled back on failure — the usual trade, and the wrong one
here, because **the flag disappearing is what makes the card say "Nothing needs
your attention right now"**. Clearing the last open flag therefore stated the
SENCo's entire queue was empty on a write nobody had confirmed, and on a failure
the row returned with the reassurance already read.

It waits for the server now. The row stays, the button reads "Marking…" and
every row's control is held while one is in flight — two in-flight
acknowledgements would race each other's `setFlags`.

The rollback went with it: there is nothing to roll back if nothing moved. That
also removed a `setAckFailed` call from **inside** a `setFlags` updater, added
in #301 — a side effect in a function React is free to run twice.

4 tests. One of the two mutations survived and the guard is labelled as what it
is: `if (acking) return;` is a backstop, and the `disabled` on every row's
button is what actually enforces one-at-a-time and what the test reaches.

### The archived toggle — shipped 9 Sep

"Show archived" refetches with `includeArchived`, so the class list grows - and
the header summed straight across it. Pressing a filter to LOOK at last year's
groups changed the school's own figures underneath the proprietor: "14 classes ·
312 students" became "17 classes · 383 students", with nothing saying why, and
71 of those children in classes nobody teaches any more.

The header counts active classes now and states the archived ones separately
("· plus 3 archived"), so the toggle reveals rows rather than changing what the
school has.

**A second reader of the same list turned up while fixing it.** `ssoSourced` is
`classes.every(c => c.source === "roster_sync")`, and one archived
manually-created class from before the provider was connected would flip that
`every` the moment somebody pressed the toggle - putting "Create a class" back
on an SSO school, where SCRUM-97 says the control is ABSENT rather than
disabled. It reads active classes too now.

Same arithmetic as `TeacherDetailView` in #306: **`archivedAt` is the thing to
grep for.** Any figure summed across a list that an `includeArchived` fetch can
grow is suspect.

4 tests, two mutation-verified guards.

6 tests, three mutation-verified guards. **One of the three initially survived**,
and it was a fault in the design rather than the test: the never-register-twice
guard sat in `submit()` while the button's `onClick` already re-pointed to
`signIn` when registered, so nothing could reach it. Both actions route through
one entry point now, and the rule is provable by pressing the same button twice
— which is what a proprietor actually does.

The 7 Sep deploy changed the picture more than anything else this week - consent,
the school narrative, typed roster counts, per-student billing fields, a manual
transfer endpoint and a DPA acceptance record all landed together, and every
claim in it verified against the deployed spec first time, which had not happened
before on this project.

Still true: **43 `TODO(api)` in components**, spread across Students, Onboarding,
Teachers, Senco, Invitations and Classes.

### Billing was broken against the deployed contract — FIXED 8 Sep

Found by comparing `src/lib/api/**` to the live OpenAPI document field by field,
after `GET /api/billing/bank-transfer-details` turned up in `api-audit.mjs` as an
endpoint nothing consumed. Five faults, all shipped, all live:

1. **The cost sheet was blank for every school on earth.** `SubscriptionResponse`
   NESTED its pricing under `pricing` — `studentCount`, `perStudentRate`,
   `currency` — and the client still read `activeStudentCount`,
   `perStudentAnnualRate` and `currency` off the top level. All `undefined`, so
   `computeCost` returned null and the screen said _"Your per-student rate isn't
   set yet"_ to schools whose rate the backend was serving on that very response.
2. **Every figure was stamped with a naira sign.** `InvoiceResponse.currency` is
   REQUIRED and the client's `Invoice` never declared it. A GBP school read its
   own invoice history, its next charge, and its transfer instruction in naira.
3. **"How to pay" said the details were unavailable** while the account sat live
   on the API. The seam pointed at `/api/billing/receiving-account`, a path the
   spec has never had. Bank transfer is the ONLY payment route this console
   offers.
4. **A declined transfer read as a recorded one.** `PaymentOutcome.status` is
   `pending | success | failed | abandoned` and was never read: any 200 flipped
   the invoice row to "Pending verification".
5. **The invoice PDF was a plain `<a href>`** to a Bearer-protected route. Auth
   here is Bearer-only from localStorage, and a top-level navigation sends no
   Authorization header, so every PDF in the history 401'd.

Also: VAT was recomputed on the client at a hard-coded Nigerian 7.5% while the
contract carries the school's own `vatRate` and `vatAmount`; and money was
TRUNCATED rather than rounded, so the cost sheet's own working did not add up.

**Why nothing caught it, which matters more than the bugs.** `client.ts` ends in
`as T` — a cast the compiler never checks. `npm run contract` compared call-site
paths for `post`/`put`/`patch` ONLY, so 81 of 159 call sites, every read in the
client, were never compared to the spec at all. And the tests passed because the
fixtures were hand-written in the same wrong shape as the code: the fixture
agreed with the component, both disagreed with the server, and green meant
nothing. **A "contract green" claim made before 8 Sep covered writes only.**

### BUILDABLE — nothing blocks these

- ~~Sign out was absent entirely~~ — **shipped, PR #251.** The footer was a
  non-interactive `div` while the Bearer token survived a tab close in
  `localStorage`, so the next person on a shared staff machine was signed in as
  the proprietor.
- ~~Overview rendered D04's fixture "Worth a glance" counts to every school~~ —
  **shipped, PR #257.** A school with no lessons taught now gets D04's own
  "Getting started" checklist; a tick is only ever set from a signal we hold.
- ~~Both invite flows asserted a parent consent request was sent~~ — **shipped,
  PR #258**, and the gap behind it is now CLOSED. At the time nothing in the
  product requested consent at all: `requestParentConsent` was typed with no
  caller and could not be wired from the invite flow, because consent needs a
  STUDENT id that does not exist until an invite is accepted. The backend now
  queues parent consent automatically when an invited student with parent
  contact details joins, and invitations carry `consentStatus`. The copy still
  does not claim a request was sent - it says what is true either way.
- ~~`PermissionProvider` resolved once and never re-asked~~ — **shipped, PR #264.**
  It now separates an ANSWER from an ABSENCE: `ready` is final (including a real
  answer of no scopes), while `skipped` and `failed` are re-asked.
- ~~A 403 was treated as a dead session~~ — **shipped, PR #267.** 401 ends the
  session, 403 does not. Screens still show their generic "We couldn't load X" on
  a 403 rather than "you don't have access" — none surfaces the `ApiError`
  message, and threading it through ~15 screens is its own change.
- ~~Billing was a nine-line placeholder~~ — **shipped, PR #272.** Invoice history
  with real PDFs, next charge, renewal note and an editable billing contact, all
  against the live endpoints. The cost sheet and the "How to pay" panel are
  deliberately absent — see Standing asks 2 and 3; the screen tells the admin so
  rather than reading as unfinished.
- ~~Failed reads rendered as established absences~~ — **shipped, PR #269**, all
  five: Student detail, SSO ("Healthy" came from `history?.failed_runs ?? 0`
  coalescing a failed read into the healthy branch), Reports, and both
  notification surfaces. `components/admin/ReadFailed.tsx` carries the wording.
  **Now pinned by 13 component tests, added 8 Sep**, each mutation-verified by
  collapsing the guard and watching the right test fail. These shipped untested
  on a documented trap that turned out to be false — see the retraction under
  Testing.

- ~~The roster could not say who may begin lessons~~ — **shipped, PR #281.** D07's
  whole purpose. Consent column in four states, the "3 can't begin lessons yet"
  count clause, and D07b's card naming the actor and date. Two rules pinned by
  tests: an ABSENT consent renders "Unknown", never "Not sent", and consent is
  never derived from account status - a student can be Active and Withdrawn.
- ~~Billing had no cost sheet~~ — **shipped, PR #284.** `pricingModel` is a const
  `"per_student"` in the contract, so the dispute is settled there. Computed in
  integer minor units from the decimal string, from `activeStudentCount` - not
  `studentsProfiled`, not `invitedStudents`. VAT at 7.5% is Nigerian and is
  applied to NGN only; a USD or GBP school sees the subtotal and is told tax is
  not calculated here.
- ~~"I've made this transfer" was optimistic~~ — **shipped, PR #284.** It calls
  `manual-transfer` now. The bank reference is an IDEMPOTENCY KEY: a repeat
  returns the original transaction with a message saying so, and the panel shows
  the backend's own words rather than treating it as a failure.
- ~~The Overview disclaimed its own figures~~ — **shipped, PR #287.** The school's
  own narrative, plus the Classes and Teachers tiles that had no source at all.
  Active and invited are never summed - separate populations, per backend.
- ~~The DPA acceptance was an untyped blob~~ — **shipped, PR #288.** A typed record
  with the accepting admin. Client sends only the version.

### NEEDS BACKEND — all four closed on 7 Sep

| thing                     | outcome                                                                                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin notification events | **Delivered.** Six admin types now arrive. The inbox needed NO frontend change to show them - it was built to render whatever comes - so it is no longer empty on day one. Typed in PR #288.                                     |
| School narrative          | **Delivered.** `GET /api/v1/school/narrative`, with `source` a const `"live_school_data"`. The Overview shows the school's own summary and the sample note is deleted, not reworded (PR #287).                                   |
| DPA acceptance            | **Delivered.** A typed record carrying version, accepting admin and timestamp. The client sends only the version; the rest is stamped server-side so it cannot drift (PR #288).                                                  |
| Scope enforcement         | **ANSWERED: scopes ARE enforced.** An admin token without `oversight` gets 403 from `GET /api/v1/admin/team`. That also confirms the 401/403 split shipped in PR #267 - 401 ends the session, 403 does not - was the right call. |

Still open, and NOT frontend work:

| thing                                | why                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A `category` on the notification ROW | `NotificationCategory` exists for preferences, but `NotificationResponse` carries only `type`. So the category filter, the per-category label and "mark these as read" have no source. Deriving one from `type` would be an invented mapping, and three of SCRUM-100's six admin categories (roster, SSO, teacher) have no enum value to map onto - this needs design and backend together.    |
| Receiving bank account               | **DELIVERED and wired, 8 Sep.** `GET /api/billing/bank-transfer-details` serves `{bankName, accountNumber, accountName, currency}`, all required — its own description reads "so the panel stops hardcoding it". The seam had been asking for `/api/billing/receiving-account`, which never existed, so every school was told the details were unavailable. Nothing is hard-coded now or then. |

### NEEDS DESIGN — ruled on 7 Sep

- **Non-oversight admin landing: DEFERRED to v1.5.** At launch the admin users are
  proprietors and academic directors; no school signs in with billing-only or
  curriculum-only scope. Ship Overview for `oversight` admins, which is what the
  rail already does. D17 and D18 stay unbuilt.
- **Changing an existing admin's scopes: DEFERRED to v1.5.** The endpoint is live;
  the UI comes later.
- **NDPA non-zero state (D22b): DEFERRED, do not build.** Design withdrew it -
  D22b superseding item 5 was their error. The safeguarding concern stands and
  counsel is to weigh in on the data shape first: a finding is
  `{table, recordId, field, term}`, where `term` is the flagged TEXT and
  `recordId` identifies a record, so rendering it school-facing risks showing a
  diagnostic label about an identifiable child. Four of D22b's six elements have
  no source either - no category, no description, no flagged date, no resolve.
- **`curriculum` scope: not in use at launch.** Reserved. No nav item, no route,
  and an admin holding only it would get an empty rail - deferred deliberately.
- **Settings scope: `oversight` IS the senior-admin scope.** Teslim is holding the
  remap until design says which sub-pages are meant, because moving Settings out
  of `it_sso` would lock the IT admin out of `/admin/settings/sso`.
- **D11d Plan Options: not built.** It introduces a second plan (per-term) that the
  locked v1 model does not have, and D11 says "no tiers, no plan selection" - design
  flagged the conflict themselves and D11 needs a follow-up to reconcile.

---

## Testing

Strategy is **defect-targeted first, full end-to-end second** - decided 6 Sep after
researching how comparable consoles are tested and scoring each option against the
four defects that actually shipped this week.

The finding that set the order: **the fixture fallback makes E2E structurally
dishonest here until it can be switched off.** `useLiveQuery` sets `failed` on any
rejection, 70 component files branch on it, and 31 import 2,541 lines of fixtures -
so an E2E asserting "the teacher sees their class list" PASSES when the live read
401s, because the fallback renders a class list. A green suite would ship a console
showing sample children to a real teacher.

Scored against the four real defects:

| defect                                     | caught by                     | not caught by                                          |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------ |
| Child congratulated for every answer wrong | one component test (sad path) | contract checks, MSW, snapshots, happy-path E2E        |
| snake_case posted to a camelCase endpoint  | the contract gate, in seconds | unit/component/coverage - **MSW would have hidden it** |
| Signals dropped on 401                     | one hook test on `flush()`    | E2E cannot - the screen is pixel-identical             |
| Login identifier invented client-side      | the gate's unread-field check | everything else                                        |

0 of 4 caught by E2E-against-mocks; 1 of 4 by E2E-against-a-real-backend.

### Done

**`scripts/contract-check.mjs`** - `npm run contract`, exits 1 on a violation, and
runs in CI. Adds NO dependency: it parses the TypeScript AST with the compiler that
is already installed, so the shared lockfile is untouched.

It exists because `client.ts:197` is `return (await response.json()) as T` - a cast,
not a validation - so every hand-written interface in `lib/api` is an assertion the
compiler never checks. The deployed spec types 154 of 182 operations, so the drift is
machine-detectable and simply was not being detected.

Three checks: request keys against `requestBody.properties`, string literals against
the spec's enums, and response fields the spec declares that no client type names.
Calls carrying `baseUrl` are skipped - those target our own Next route handlers, and
checking them against the backend spec was the gate's first false positive.

**`.github/workflows/ci.yml`** - the repo had no CI at all, which is how a lint error
sat on `main` for a day. Two jobs: types + lint, and the contract gate.

### What the gate found on its first run

- **FIXED:** `POST /api/intelligence/adapt` requires `segments` and the client sent
  `{studentId, lessonId}` only - every call would have 422'd. Not noticed because its
  only caller, `useAdaptation`, has no consumers.
- **RESOLVED 7 Sep (#260 / #262):** that same endpoint RETURNS `modality_suggestion`,
  `break_suggestion` and `proactive_adjustment`, and it IS the missing plan — Bearer
  with no role restriction, 200 to a student's own token, checked against the deployed
  API rather than inferred. `useAdaptation` now has a consumer, and the cast it used
  to do (`res as AdaptationPlan`, snake_case wire onto a camelCase type) is replaced
  by a real translation. See the adaptation traps in the student section before
  touching it.
- Advisory, unread by any client type: `ask-nevo` returns `plainText` and
  `answerFormat`; `baseline/submit` returns `baselineProfile` and `engineConfig`.

### Step 2 done — 17 tests, `npm test`

Vitest with two projects: `node` for pure logic (fast, no DOM) and `dom` for
hooks and components. A `*.dom.test.ts` suffix opts a `lib/` file into jsdom —
the session store is `localStorage` and `document.cookie`, so it is not pure.

Covered so far:

| primitive              | why it is first                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useLiveQuery`         | exists because FOUR hooks independently grew the same race — treating a slow answer as a failed one, stranding a teacher on sample data while their real class list had already arrived |
| `useSignals`           | where the silent 401 data-loss lived                                                                                                                                                    |
| session store          | expiry is the only thing between a stale localStorage token and a rendered roster                                                                                                       |
| `client.ts` auth latch | concurrent 401s once cleared the session, lost the role, and sent a TEACHER to the child's sign-in screen                                                                               |

**The suite is mutation-tested, not just green.** Removing the pre-auth guard from
`useSignals` fails exactly the test written for it; restoring it passes. A test that
cannot fail is decoration.

Environment notes, each of which cost real time to find:

- **`window.location` cannot be observed under jsdom 30, at all.** Redefining it
  hangs the worker for 60s with a timeout naming no file near the cause — from the
  setup file AND from inside a test, so placement is not the issue. Spying instead
  fails outright: `Cannot redefine property: assign`. When a redirect destination
  needs testing, **extract the choice into a pure function** and test that; see
  `sessionExpiredDoor` in `client.ts`.
- jsdom lacks `matchMedia` and ADDING it is fine — it is replacing what jsdom
  already implements that breaks.
- **A 60s "Timeout waiting for worker to respond" is not always real.** The same
  message appears for a genuine hang AND for a cold-start flake on a loaded machine.
  Before debugging, just run it again: a `.tsx` suite that timed out at 60s passed in
  6s on the retry with nothing changed.
- `vite-tsconfig-paths` is unnecessary: Vite resolves the `@/*` alias from
  tsconfig.json natively via `resolve.tsconfigPaths`. One fewer shared dependency.

**All four primitives are covered, plus the marking logic and the first judgement
screen — 59 tests.** Each was chosen for having a defect history, and every suite is
mutation-tested: reintroducing the bug it was written for fails that test and only
that test.

Step 3 added:

| what                          | why                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `checkpoints.ts` — 18 tests   | the marking rules decide what a child is TOLD about their own work. `answerKey: null` must mean "cannot mark", never "wrong" |
| `variants.ts` — 10 tests      | `interactiveVariant.answerKey` has the same nullable union, so the same way of going wrong; also the media-URL expiry margin |
| `FlagCard` — 7 tests          | first component test. "Worth your attention" is a judgement about a child shown to their teacher                             |
| `MasteryDualTrack` — 11 tests | "Reading support needed" is a label a teacher may act on for months                                                          |
| `LiveFlagCard` — 12 tests     | the live card, where the tap IS the acknowledgement                                                                          |
| `HomeClasses` — 8 tests       | showed other teachers' classes during every load                                                                             |
| `LiveClassInsights` — 7 tests | "still gathering" over a failure is a false claim about real children                                                        |

`FlagCard` tests what a teacher can READ and ACT ON — the name, the note explaining
the flag, the evidence behind it, where each action goes. **Not styling**: the design
frames are the contract for that, and asserting Tailwind classes would duplicate an
existing check while breaking on every redesign. The one visual thing asserted is
sudden-vs-pattern, because it is semantic rather than decorative.

Two behaviours in these are worth knowing about, because both fail SILENTLY:

- **`LiveFlagCard`'s tap is the acknowledgement.** Design ruled a teacher never sees
  an acknowledge button — tapping opens the profile and marks the flag seen in one
  action, and `useTeacherFlags` filters acknowledged flags out. If that write stopped
  firing, flags would nag forever with nothing on screen to explain why. The write is
  deliberately unawaited and its failure deliberately swallowed, so only a test can
  see it happen at all.
- **`MasteryDualTrack` has a deliberate gap in its auto-flag rule**: one track under
  40 with the other 40–59 flags nothing. That reproduces the frame rather than
  "correcting" it, and is flagged to design. It is now pinned by a test, so closing
  the gap becomes a decision with a failing test attached rather than a silent change
  to who gets offered support.

**The hook-driven components mock the HOOK, not the network.** `useLiveQuery` is
tested directly, so what these assert is that a component reads the flags its hook
publishes — which is precisely what both of them once failed to do:

- **`HomeClasses`** rendered fixture classes for the whole in-flight window, because
  `data === null` covers "not back yet" as well as "never coming" and the component
  read neither flag. A signed-in teacher saw JSS 2A, JSS 2B and SSS 1 Sciences —
  with invented headcounts — for the 1.0–5.6s the backend takes to answer. Now
  pinned: `loading` wins even when fixture classes are in hand.
- **`LiveClassInsights`** must never say "Still gathering insights for Year 7 Maths"
  over three failed reads. That is an affirmative, false claim: it tells a teacher
  Nevo looked and found nothing worth raising, when Nevo never looked. `failed` is
  checked before `empty`, and a state that is both renders as failed.

## End-to-end testing — prerequisites

E2E was sequenced last for one reason: **the fixture fallback would make it
dishonest.** An E2E asserting "the teacher signs in and sees their class list"
PASSES when the live read 401s, because the fallback renders a class list, which is
exactly what the assertion looks for. The suite goes green while the console shows
sample children to a real teacher.

### Prerequisite 1 — sample data is now detectable. DONE 7 Sep.

Rather than removing the fallback (it is load-bearing for the signed-out demo), every
fixture render carries a mark:

- `lib/sampleData.ts` — `SAMPLE_ATTR`, `sampleMark(kind)`, `sampleRegions(root)`
- `components/shared/SampleRegion.tsx` — wraps a fallback render. `display: contents`,
  so it takes part in no layout and changes nothing about the design.

Applied at the teacher lane's three fixture handoffs: `ClassRoute`, `LessonRoute`,
`StudentRoute`. The detector has its own tests, because an E2E built on a broken
detector would pass while the thing it guards against was happening.

**The single most valuable E2E is therefore not a flow test.** It is:

> sign in, walk the console, assert `sampleRegions()` is empty everywhere.

That catches the failure this architecture actually has. Forty flow tests would not,
because the fallback satisfies them.

**FOR THE STUDENT AND ADMIN SESSIONS:** please wrap your own fixture handoffs in
`<SampleRegion kind="student:...">` / `kind="admin:..."`. The E2E is only as good as
the marks, and an unmarked fallback is invisible to it.

### Prerequisite 2 — a seeded tenant. DONE 7 Sep. The register bug is FIXED.

`scripts/shape-probe.mjs` records that the demo account holds **real school staff and
children**. A write-path E2E — assign a lesson, send a message, upload a unit —
mutates real people's records. So E2E needs its own school before it runs once.

**`POST /api/v1/schools/register` now works.** It was returning 500 on valid unique
input; re-checked 7 Sep and it returned **201 on four consecutive fresh registrations**
(3.4-8.0s). Backend fixed it. The blocker text that used to live here is gone because
it is no longer true.

**The E2E tenant exists:**

- school `E2E DO NOT USE - automated tests`, code **`751A1136`**,
  id `8afff4f0-1a7f-48c4-a99f-ab7d930fef01`
- the admin signs in via `POST /api/v1/auth/login/password` and gets role
  **`other_admin`** — which is correct, not a bug: `UserRole` is
  `student | teacher | senco_admin | other_admin | parent_guardian` and there is no
  `school_admin`. `isAdminRole` in `proxy.ts` already handles it.
- **every collection is empty** — `/students`, `/teachers`, `/classes`, `/invites` all
  return `[]`. That is the point: write-path tests cannot touch a real child here.
- `/api/v1/school` and `/api/v1/school/overview` both read 200. Note the path is
  `/api/v1/school` SINGULAR; there is no `/api/v1/schools/me`.

**Credentials are deliberately not in this file.** The password goes to CI secrets and
nowhere else. Ask Olayinka for it, or register a fresh one — it takes 5 seconds now.

Two caveats before writing against it:

- the admin address is on `example.com`, a reserved domain that **cannot receive mail**,
  so invite-delivery and password-reset flows cannot be tested end to end on this tenant.
  A tenant on a real inbox domain is needed for those.
- the school is empty, so a console will render its EMPTY states, not populated ones.
  Seeding one teacher, one class and two students is the next step if a test needs
  something to look at — and those writes are now safe to make.

### Signed-out E2E — DONE 7 Sep. 15 tests in 3 files, `npm run e2e`.

Playwright, chromium only, on port 3100 so it cannot collide with a dev server
another session is running. `webServer` does a PRODUCTION build rather than
`next dev` — dev overlays and slow compiles make timing assertions flaky, and the
build is what ships. Runs in CI with the report uploaded on failure.

**`e2e/route-guards.spec.ts`** is the one that genuinely needs a browser: the guard
lives in `proxy.ts`, which runs on the server between request and page, so nothing
below the browser can see it. Covers `/teacher/*` and `/admin/*` reaching the RIGHT
door, `?next=` surviving so signing in returns you where you were headed, and
`/student/onboarding` staying open — a child onboarding has no session by
definition.

**`e2e/public-pages.spec.ts`** leans on `/tosse`, the only surface that has been in
front of real schools and the one that broke there. Pins the three intent cards and
all five roles, including Teacher and Parent, which had no enum value until 6 Sep.
**Nothing submits** — a submission creates a real lead someone follows up.

Two things learned writing it:

- **Select by ARIA role, not by text.** The role dropdown assertion failed first
  time because it guessed a button name. The control is a real `combobox` with a
  `listbox` of `option`s, so `getByRole` asserts the accessibility markup and the
  contents at once — a text match would have passed just as well on a plain div.
- The landing page already asserts **no `data-nevo-sample` marks**. That is the same
  assertion the signed-in suite will make across the console, proven now on a
  surface where the answer is knowable.

### Prerequisite 3 — Playwright. INSTALLED and running.

`@playwright/test` `^1.63.0` is in devDependencies and `npm run e2e` works. The note
that used to sit here saying it was "deliberately NOT installed yet" was left behind
when the install actually landed; it is removed rather than corrected, because a
prerequisite that is met is not a prerequisite.

Auth will need the programmatic route: the token lives in **localStorage**, invisible
to the server, so `storageState` alone will not carry a session. Sign in via the API,
then seed localStorage before first paint.

### Next, in order

1. ~~Olayinka creates the E2E tenant~~ DONE — it exists, see above.
2. Playwright lands with the first spec — the no-samples assertion.
3. Then a small number of flow tests as deployment canaries, not defect detectors.
4. Then full E2E - which needs a fallback-disabled build mode and a seeded tenant
   first, because `shape-probe.mjs` records that the demo account holds real school
   staff and children.

### Traps found while scoping (do not relearn these)

- **A test file outside `src/lib`, `src/hooks` or `src/components` RUNS NOWHERE
  and reports nothing.** `vitest.config` includes `src/lib/**/*.test.ts` (node)
  and `src/{hooks,components}/**/*.test.{ts,tsx}` plus `src/**/*.dom.test.{ts,tsx}`
  (dom). Anything else is silently skipped - not an error, not a warning, and the
  suite still goes green. Five tests written at `src/context/PermissionContext.test.tsx`
  never executed once, and the run reported PASS with a higher total than before
  (another session's tests had landed the same afternoon), which is what made it
  look like they had run. If a file lives outside those three directories, name it
  `*.dom.test.tsx` so the `src/**` pattern catches it, and **check the reported
  test COUNT went up by the number you wrote**, not just that the suite is green.
- **A MOCK THAT NARROWS A SIGNATURE HIDES WHAT YOU ARE ASSERTING.** A spy wired
  as `acceptDpa: (v) => spy(v)` forwards only the first argument, so a test
  asserting "this call sends ONLY the version" could never fail - a second
  argument was swallowed before the spy saw it, and a deliberate mutation passed
  clean. Forward every argument (`(...args) => spy(...args)`). The tell was
  `tsc`, which separately flagged the mock as taking zero arguments; the test
  runner was perfectly happy.
- **MUTATE THE CODE TO PROVE A TEST MEANS SOMETHING.** Two tests written this week
  looked green while testing nothing at all - the one above, and five that were
  never collected because of the directory rule below. Breaking the behaviour on
  purpose and watching the RIGHT test fail is the only cheap check that a test is
  load-bearing, and it has caught a false green every time it has been run here.
- **Do not `grep | head` vitest's output.** It re-renders the summary line as
  files complete, so a truncated read catches an intermediate frame: this
  produced a confident "7 passed" mid-run on a 148-test suite, and a "no tests"
  on a file where 5 had passed. Read the tail, or the exit code.
- ~~**A component whose mocked API call REJECTS fails the file, even when the
  component catches it.**~~ **THIS ENTRY WAS WRONG. Retracted 8 Sep — ignore it,
  and do not plan around it.** Rejecting a mocked API call in a component test
  works exactly as you would expect. Three minimal reproductions (a direct
  rejection, a nested `.then(...).catch(...)` chain, and a `Promise.all`) all
  passed, and so did a reconstruction of the original failing test. Whatever the
  one stubborn failure on 7 Sep actually was, it was local to that file and not a
  property of the harness — and generalising it into a rule cost the five
  failed-read guards in #269 their tests for a day. **The lesson worth keeping is
  the meta one: one stubborn failure is a bug in one file until a minimal
  reproduction says otherwise.** All five guards now have tests, each
  mutation-verified: `SsoView`, `ReportsView`, `NotificationsView`,
  `NotificationsPanel`, `StudentDetailView`.
- **`container.textContent` runs elements together, so `` assertions silently
  cannot fail.** "Roster sync" followed by "Healthy" reads as `syncHealthy`, so
  `/Healthy/` never matches it — which means `expect(...).not.toMatch(/Healthy/)`
  PASSES on a screen that is shouting the word. This is the same class of false
  green as the two above and it is invisible: the assertion looks strict. Use
  `visibleText()` from `src/test/visibleText.ts`, which walks the text nodes and
  joins them with spaces (and folds curly quotes, so tests can be typed on a
  normal keyboard).
- **`npm run contract` only checked the paths of WRITES until 8 Sep.** The verb
  list was `["post", "put", "patch"]` and `api.del` was not in it under any name,
  so 81 of 159 call sites - every read - could name an endpoint that does not
  exist and the gate reported "No contract violations". It found the billing
  drift the moment reads were included, with zero false positives. If you are
  relying on a green contract run from before 8 Sep, it covered writes only.
- **The advisory "declared by the spec, named nowhere in the client" list is a
  real signal, not noise.** `GET /billing/subscription → pricing` sat in it while
  the cost sheet was blank for every school, because `pricing` was the key the
  whole response had moved under. Read that list.
- **A hand-written fixture proves nothing about the contract.** Every billing
  test passed for a week against a `Subscription` shape the API has never
  served. Copy fixtures from the deployed schema, not from the component you are
  testing.
- **Do not `git checkout --` a file to undo a mutation test unless the file is
  COMMITTED.** It restores from the index, not from your edit, and it took two
  files of finished work with it today. Commit first, then mutate.
- **Do not run the suite while a big workflow is running.** Under ~40 concurrent
  agents, `npm test` reported `23 files / 140 tests / 7 errors`; the same tree
  three times over, quiet, gives `30 files / 216 tests / 0 errors`. Worker
  startup times out under CPU contention and files silently do not run.
- `useLiveQuery`'s effect begins `if (!getToken()) return;` - a hook test with no
  token exercises zero network logic and passes having tested an early return.
- MSW handlers authored alongside the code inherit its bugs. A handler for the TOSSE
  form would have accepted `school_name`, because that is what the form sent.
- Coverage is misleading here: `src/lib/mocks` is 2,541 lines of trivially coverable
  static data, and defect #3's drop path WAS covered - it was simply wrong.
- Snapshots would have locked in defect #1: there was one snapshot, the success
  state, and it was correct. The bug was a state never rendered at all.

---

## Landing performance — measured properly, 7 Sep

**41 is the DEPLOYED number** (network + throttling). A local production build is
**73**, 3-run median `[72, 73, 74]`. An early single run said 65 — that was just a
slow run, and chasing it cost most of an afternoon.

**Shipped (#276):** the hero particle canvas animated at 60fps for the whole session,
long after the hero had scrolled away. Now gated on an IntersectionObserver. Correct
on the merits; the measured delta sits inside noise.

**Chased and abandoned — do not repeat.** The scroll driver is an always-on
`requestAnimationFrame` loop and looks like an obvious 2.5s win. It is not:

- The "2.5s" came from a **corrupt build**. Rebuilding while the old `next start`
  still held `.next` left a manifest pointing at chunks that no longer existed, so
  Lighthouse scored an **error page** 75.
- Rewritten event-driven (scroll + resize + ResizeObserver on the pinned sections +
  fonts + visibilitychange) and measured over 3 runs, it is **slightly worse**:
  median 72 vs 73, TBT 578ms vs 432ms, Style & Layout 2491ms vs 1585ms.
- The premise was wrong. `window.scrollY` does **not** force layout in a modern
  browser — it is cached — and the loop's `y !== _ls` guard means its body barely
  runs when idle. The loop is close to free.

**The pinned sections now have tests** (`e2e/landing-pinned.spec.ts`): panels advance
on scroll, the pin releases rather than sticking, classroom tiles reveal. Written to
catch the rewrite breaking them, kept because those sections are the most intricate
thing on the page and had no coverage.

**The client boundary is now split.** It ships less JavaScript; it does NOT move the Lighthouse score — see the numbers below before claiming otherwise. `LandingPage`
carried `"use client"` solely so it could call `useLandingMotion()`, and that single
directive pulled every section into the browser bundle: `ProofSections` and
`StorySections` have ZERO hooks between them and were shipping as client JS anyway.

`LandingMotion` is the boundary instead — a client component that calls the hook and
renders `{children}`. Children passed into a client component from a server component
stay server-rendered, so the sections became HTML. The hook needed nothing: it takes
no arguments and reaches the DOM through `document`.

|                 | before           | after                |
| --------------- | ---------------- | -------------------- |
| JS bytes on `/` | 808,881 (789 KB) | **774,524 (756 KB)** |
| chunks          | 16               | **15**               |
| HTML            | 62 KB            | 119 KB               |

**33 KB less JavaScript**, markup moved into HTML where it belongs. Verified with the
pinned-section tests plus a screenshot from a browser that actually paints.

**But the Lighthouse score did not improve.** 3-run medians: baseline **73**
`[72, 73, 74]`, after the split **70** `[54, 73, 70]`. TBT 432ms -> 514ms. LCP
unmoved at ~4.15s. The byte count is a deterministic measurement and is genuinely
lower; the score is not, and on this page it is dominated by an LCP the split does
not touch. The HTML also nearly doubled (62 -> 119 KB), which is the same content
moving across - cacheable and streamable rather than hydrated, but not free.

Ship it for the architecture, not for a number: a page of static marketing copy has
no business being a client component. Do not cite a score improvement, because there
is not one.

**Still on the table:** Style & Layout (~1.6s) and Script Evaluation (~1.3s) remain
the largest costs, and `ConversationSection` is still a client component - correctly,
since it is the conversion form.

### Two testing traps found the hard way

- **A hidden browser tab pauses `requestAnimationFrame` and stops painting.** Every
  screenshot returns blank and CDP reports "renderer may be frozen". I mistook that
  for a production bug across three surfaces before checking. **Check
  `document.visibilityState` before believing a blank screenshot.** Playwright is
  immune — headless browsers paint.
- `playwright.config.ts` used `??` for `E2E_BASE_URL`, so an empty string became the
  base URL instead of falling back. Now `||`.

---

## Cross-cutting

| item                    | state                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tests**               | 216 unit + 20 E2E, green as of 8 Sep. `npm test`, enforced by CI alongside types, lint and contract. Four shared primitives, the marking logic, the judgement screens, and the five admin failed-read guards. See **Testing**. |
| **Landing performance** | **41** deployed / **73** on a local production build (3-run median). Investigated 7 Sep — see below before repeating it.                                                                                                       |
| **Lint**                | Green as of 5 Sep (0 errors, 1 warning). Now enforced by CI.                                                                                                                                                                   |
| **Contract**            | Green as of 6 Sep. `npm run contract`, enforced by CI.                                                                                                                                                                         |
| **TOSSE**               | Working end to end and deployed. One test lead — `27ac8e8a-a46b-45e0-befe-50787d3b9eb9`, "DO NOT CONTACT" — still needs deleting from the booth list.                                                                          |

---

## Standing asks — where the four landed

All four were answered or delivered on 7 September. Kept here because the
answers matter more than the questions did.

**1. Per-student consent — DELIVERED.** `ConsentStatus` is now
`["not_sent","pending","confirmed","withdrawn"]`, and a typed `consent` object
(status, actorId, actorName, timestamp, channel) is on the student list, the
student detail and the class roster. Parent consent is queued automatically when
an invited student with parent contact joins. Built in PR #281.

_The second half of that gap is closed too:_ nothing used to request consent at
all - `requestParentConsent` was typed with no caller, and could not be wired
from the invite flow because consent needs a STUDENT id that does not exist until
an invite is accepted. The backend now queues it on join.

**2. The pricing model — RULED per-student.** ₦150,000/year or ₦55,000/term, no
tiers. `pricingModel` is a const `"per_student"` in the contract itself, and the
read carries `activeStudentCount`, `perStudentAnnualRate` and `currency`. Cost
sheet built in PR #284. The old `subscriptionTier` / `studentCountBand` /
`contractValue` are still returned and still never displayed.

**3. The receiving bank account — DELIVERED, and wired on 8 Sep.**
`GET /api/billing/bank-transfer-details`. It had been live since 7 Sep while the
client asked for a path that does not exist, so the panel told every school the
details were unavailable. Nothing was ever hard-coded, which was the point of the
seam; what was missing was anything watching for the endpoint to land.

**One question back to backend:** `PricingResponse.vatRate` is typed `string`.
Is it a PERCENTAGE ("7.5") or a FRACTION ("0.075")? They are the same rate and
differ a hundredfold on screen. Until it is settled the VAT line shows the
amount and no rate — a wrong tax rate on a school's invoice is not a rounding
error.

**4. Scope enforcement — ANSWERED: yes, enforced.** An admin token without
`oversight` receives 403 from `GET /api/v1/admin/team`. This was the one item
that was a question rather than work, and it settles two things: client-side
scope filtering is a convenience rather than the only guard, and the 401/403
split shipped in PR #267 matches how the backend actually behaves.

**One correction worth keeping.** `POST /billing/payments/{reference}/verify` must
NOT be wired for a bank transfer. It is a WRITE that asks Paystack about a
transaction and settles the invoice off the answer, so a bank reference 404s
there. Manual transfers go through `manual-transfer`.

---

## For backend

- The student-app handoff PDF diverged from the deployed spec on **every** item
  it described. Worth fixing at the source: people will type from it.
- `PartnerInquiryIntent`'s own description still says "PLACEHOLDER … confirm
  against SCRUM-117", though the values are now correct.
- The documented error envelope is `{detail: {code, message}}`; validation
  actually returns FastAPI's `{detail: [{type, loc, msg}]}`. A client that
  trusts the former shows a generic message instead of the real reason.
- Legacy lessons need reparsing before checkpoints can auto-mark: `toQuickCheck`
  skips every checkpoint whose `answerKey` is null.
