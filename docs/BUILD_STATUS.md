# Nevo frontend — what is left

Last updated **7 September 2026**. Written from a survey of the source and the
deployed OpenAPI document, not from tickets.

Keep this current. Two rules make it useful rather than decorative:

1. **The deployed OpenAPI document is the contract.** Handoff docs have diverged
   from it on every item checked so far — `options` as strings where the schema
   says objects, `position` as an integer where it is a string, "everything
   optional" where `required` lists all seven fields. Run `scripts/api-audit.mjs`
   before believing a summary.
2. **Say which pile a thing is in.** "Not done" hides the difference between work
   we can do today and work nobody can do yet.

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

**This is a launch blocker, not a feature.** SCRUM-80: *"Section 31 of the NDPA 2023
requires verifiable parental consent... Our legal review confirms this must be in
place before launch."*

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

| status | `granted` | means | child |
|---|---|---|---|
| `not_sent` | false | school has not asked yet | proceeds |
| `pending` | false | asked, parent has not replied | proceeds |
| `confirmed` | true | parent granted | proceeds |
| `withdrawn` | false | parent actively withdrew | **stops** |

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

| verdict | n | meaning |
|---|---|---|
| unblocked | 4 | build it today |
| **partially** unblocked | 26 | the READ landed, the WRITE (or 1 of 3 needs) did not |
| still blocked | 50 | genuinely absent |
| **stale** | 17 | **delete the comment — the need is already met or was never an API gap** |

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

| file | what changed |
|---|---|
| `components/admin/Teachers/status.tsx` | rewritten — see the breaking change below |
| `components/admin/Teachers/status.test.tsx` | NEW, 7 tests |
| `components/admin/Classes/ClassesView.tsx` | `c.source === "sso"` → `"roster_sync"` |
| `components/admin/Classes/ClassDetailView.tsx` | same fix, same line number |
| `lib/api/teachers.ts` | added `UserStatus`; `status` narrowed from `string` |
| `lib/api/classes.ts` | added `ClassSource`; `source` narrowed from `string \| null` |
| `lib/api/students.ts` | your `ConsentState` now ALIASES `ConsentStatus` — one definition, same four values, no behaviour change |

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

| case | response |
|---|---|
| active account, **wrong** PIN | `401 {"code":"authentication_failed"}` |
| **paused** account, **correct** PIN | `401 {"code":"authentication_failed"}` |
| identifier that never existed | `401 {"code":"authentication_failed"}` |

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

| the frame's four | |
|---|---|
| Staying with hard problems | "working through tricky questions on her own for longer" |
| Knowing what she knows | "a clearer sense of what she has understood" |
| Connecting ideas | "carrying what she learns in one subject into another" |
| Learning new things faster | "new ideas are landing more quickly than last term" |

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
document.cookie.split(';').map(s => s.trim()).find(c => c.startsWith('nevo.role='))
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

Still unanswered, and Teslim's to answer: whether regeneration actually completes
server-side when it is not abandoned, and whether it needs the original source document
— `Fractions Lesson 3` may have been seeded directly rather than parsed from an upload.
The re-read after the abandoned admin attempt showed the lesson **unchanged**, so
nothing was half-written.

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

| area | owner |
|---|---|
| `src/components/student/**`, `src/app/student/**` | student session |
| `src/components/admin/**`, `src/app/admin/**` | admin session |
| `src/components/teacher/**`, `src/app/teacher/**` | teacher session |
| `src/lib/api/**`, `src/hooks/**`, `src/proxy.ts`, `scripts/**`, CI | **shared — collision zone** |

In the shared zone, run `git log -1 -- <file>` before editing to see who last moved
it, and keep the diff minimal. Stage with explicit paths — never `git add -A`, which
sweeps up whatever another session has in flight.

### Handoffs currently waiting

**For the student session — ALL FIVE ARE DONE, 7 Sep.** Left here as a record of
what closed, because two of them were wrong about *why* they mattered:

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
  per-student consent" is wrong — what is missing is reading consent for *another*
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

| pile | meaning |
|---|---|
| **BUILDABLE** | The contract and the design both exist. Ours to do. |
| **NEEDS BACKEND** | No endpoint, or an endpoint that cannot answer the question. |
| **NEEDS DESIGN** | No frame, or a frame that contradicts another. |

---

## Student app

### Four defects fixed 8 Sep, and what an audit found is still open

Landed: **#294** (session refresh retried a failure in a tight loop for the whole
2-minute margin — mounted in `StudentShell`, so it ran on a child's metered data
mid-lesson), **#295** (`ScaffoldIndicator` announced `"Support level: full"` to
screen readers while the visual is deliberately wordless — Zero-Tag leaking
through the accessible name), **#299** (Home marked a signed-in child's OWN
dashboard as sample data; Ask Nevo's canned reply carried no mark at all; the
shell called a real child "Ada" for one hydration frame), **#304** (a verified
school with an empty roster was shown fourteen invented class names, then
`classId: undefined` broke account creation three screens later with nothing said
to the child), **#305** (a real SSO handshake was signed into a fabricated
account — `resolveMockSso` ignored `code`/`state`, invented an id, and stored no
token, so `AuthContext` said authenticated while every screen rendered fixtures).

**Still open in the student lane, verified against the code on 8 Sep:**

- **Ask Nevo is absent from the lesson player.** `StudentShell` returns at :54-61
  for full-screen routes, before `<AskNevo />` at :128 — so the drawer is on every
  tab and missing from the one screen where "I'm stuck" happens. NEEDS A DESIGN
  DECISION, not just code: frame 26 says Ask Nevo is "always reachable, never
  interruptive", but frame 17 does not draw it in the player, and the mobile pill
  is positioned (`bottom-[82px]`) to clear a bottom nav the player does not have.
  Someone should rule on placement before this is built.
- **Two hand-offs send a signed-in child to the mock photosynthesis lesson.**
  `WarmUpRun.tsx:62-68` and `ObservedInteractionSequence.tsx:173-178` both read
  `assigned ? real : dashboard ? "/student/lessons" : FIRST_LESSON_ID`, and
  `useStudentDashboard` returns `data: null` while LOADING as well as when signed
  out — so a real child who taps "Start today's lesson" before the read lands goes
  to the fixture.
- **`SubjectDetail.tsx:81`** falls back to the FIXTURE's subject name
  (`liveSubject?.name ?? subject?.name ?? "Progress"`).
- **The spaced-retrieval loop has no entrance.** `/student/lessons/[id]/review-session`
  renders, but nothing links to it, and `useDueReviews`' concepts are plain
  non-clickable spans in `SubjectDetail`.
- **`useProfile` is an orphan** exported from the hooks barrel with no callers —
  and it is the only caller of `intelligenceApi.getProfile`, so `api-audit.mjs`
  reports that endpoint as USED. A dead hook is keeping a dead endpoint alive in
  the audit.
- **Content-blocked, not code-blocked:** the after-lesson chain (`fromContent`
  builds no `assessment` and no `summary`, so a child finishes and gets a bare
  "Done"), and four of five modalities (`RENDERABLE = [MODALITY.TEXT]`). Both wait
  on the library being more than one 2-segment lesson.

**Note for whoever owns E2E:** since #265 guards `/student/*`, the signed-out
walkthrough is unreachable in a browser, so every student fixture except Ask
Nevo's canned reply is now dead weight. Worth deciding whether they stay.

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
modality on from `availableModalities` alone draws an empty visual frame *today*.
`fromContent` and `lib/lessons/adaptation.ts` both gate on payload presence
instead — keep it that way.

### Typed, working, wired to nothing — BUILDABLE

Shipped 4–5 Sep as API-layer work. All have logic and no UI consumer:

| thing | where | what it needs |
|---|---|---|
| `markCheckpoint` / `toQuickCheck` | `lib/api/checkpoints.ts` | `fromContent` to carry checkpoints; the player already draws `QuickCheckSheet` |
| `markInteractive` / `mediaUrlExpired` | `lib/api/variants.ts` | `fromContent` to read the five variants |
| `contentApi.mediaUrl` | `lib/api/content.ts` | a caller — `mediaUrlExpired` decides when |
| `useDueReviews().playable` | `hooks/useDueReviews.ts` | `SubjectDetail` pills to become links into `/review-session` |
| ~~`reflection` / `highlights`~~ | `lib/api/students.ts` | **DONE #247.** `reflection` renders on both Progress screens, read per-subject from the narrowed route — the two routes' `reflection` mean different things, so the tab's would be a claim about all of a child's learning under one subject's heading. `highlights` is carried and NOT placed: it is a student-level list and the only nearby slot is the per-subject card note, so mapping it by index would be fabrication. **Needs a designed slot.** |

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

| thing | why |
|---|---|
| ~~Student → teacher messaging~~ | **DONE #250.** `POST /api/messages` still has no `teacher` recipient — but `POST /messages/threads/{id}/reply` (3 Sep) is the door, and deliberately a different shape: access IS the thread, so a child may write only where they can already read and still cannot start a conversation. |
| Thread unread state | No endpoint reports it; the dot stays off. |
| Student SSO sign-in | Entirely mock (`resolveMockSso`). `authApi.ssoCallback` exists and the teacher side calls it. |
| Teacher-join class code | Pre-auth join still compares a hard-coded `VALID_CODE`. **Re-check:** `connections/class-code` went public on 3 Sep, so this may now be closable. |
| Per-concept assessment result | Questions carry no concept id, so the after-lesson result can only tell *all* from *none*. |
| ~~Adaptation plan~~ | **DONE #260. The "no student-facing endpoint" claim was wrong.** `POST /api/intelligence/adapt` is Bearer with no role restriction and returns 200 to a student's own token. Per-segment `scaffolding` now drives the indicator, which previously drew 2-of-4 support dots from a hardcoded `?? "light"` on every live lesson. |
| ~~Backend-triggered breaks~~ | **DONE #262.** `in_lesson` mode at segment boundaries. `useBreakMonitor`'s TODO is answered; the client timer stays as the priming fallback. Only OBSERVED facts are sent — see the Zero-Tag note below. |
| Boredom escalation | The tap spends the offer and asks nothing. |
| Downloads / offline | Endpoints exist; the device half is a Service Worker project. Hidden from signed-in children, honestly. |
| Baseline Module 4 items | No IRT service; items are authored mocks. |
| Ask Nevo scoping | The console holds no student or lesson UUID to send. |
| Narration audio | 4 × `TODO(audio)` — the assets do not exist. Playback is a simulated progress bar with no `<audio>` element. |

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

| endpoint | field |
|---|---|
| `GET /api/v1/students` | `StudentSummaryResponse.consent` |
| `GET /api/v1/students/{student_id}` | `StudentDetailResponse.consent` |
| `GET /api/v1/classes/{class_id}/students` | `ClassStudentResponse.consent` |
| `GET /api/v1/invites` | `InvitationResponse.consentStatus` |

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

| screen | why |
|---|---|
| C08c Recommend a lesson | Recommendations are **read-only** — `GET /api/intelligence/recommendations/{id}` only, returning prose (`recommendationText`), not selectable lesson options. No POST exists to send one. |
| C08d Session detail | Needs a section-by-section breakdown nothing serves. |
| C16d Variant Review | No lesson read carries the variant objects. |
| Escalate to SENCo | No transport for a teacher-to-SENCo note. The button is disabled rather than lying. |
| Teacher SSO connect | **Not the slug problem.** Nothing in the API enrols a school; all ten SSO operations presuppose a connection that exists. The two `start` endpoints are pre-login user handovers. |
| Profile photo upload | The frame draws the affordance only. |
| Drive / OneDrive import | Blocked on per-school credentials. |

### NEEDS DESIGN

- Help & support — a sidebar item with nowhere to go; no frame draws it.
- Pulse banding — the Strong/Steady/Building cutoffs are a frontend invention.
- ~12 undrawn sections: C09's written summary, C06b's stat cards, the C03 flag
  sparkline (deferred to v1.5), the noticing banner, subject filter pills.
- "Specific students" in the assign wizard has no frame; the wizard errors.

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

| screen | what a refusal used to do |
|---|---|
| Notifications | cleared every unread dot anyway; "Unread only" then said "You're up to date." |
| Class detail — archive | closed the dialog; the class stayed live on every list |
| Class detail — restore | nothing at all, and the button stayed double-clickable |
| SSO disconnect | painted its only message *behind* the modal still covering the screen |
| Student deactivate | swallowed entirely, under the words "their seat frees up" |

All five are pinned by tests and mutation-verified: each guard was collapsed
back to its pre-fix catch and the right test failed.

**STILL OPEN — eight of the ten. Do not assume these are done.**

~~*The invitation delivery family*~~ — **SHIPPED.** Both halves: the wording
now reads `deliveryStatus`, and the join links are handed over instead of
discarded. `needsManualDelivery` finally has callers. Details under
**The invitation family** below.

*The failed-read family — the #269 shape, in screens that sweep never covered:*
- **`IepExporterView`**: a failed roster read empties the dropdown, so
  "Generate draft" is permanently disabled with no explanation — a dead screen.
- **`AssignTeacherSheet`**: tells a school with no teachers that everyone on
  staff already teaches this class, which is the exact first-run state the
  Classes screen sends them to.
- **`SencoView`**: "No profiles match" for a class whose per-class read failed.
- **`TeacherDetailView`**: a headcount that coalesces unknown classes to zero,
  contradicting the Classes card beside it.

*Smaller:*
- **`SignUpStep`**: "nothing has been created yet" after the school AND the
  founding admin were created — the inverse defect, a confirmed write reading
  as one that never happened, and Continue is re-armed so they try again.
- **`SencoView` "Mark as seen"** flips before the server answers, so "Nothing
  needs your attention right now" can render ahead of a failed write. (The
  rollback existed; this PR added the words. The optimistic ordering stands.)
- **`ClassesView`** header sums `studentCount` across classes and silently
  folds archived ones in when "Show archived" is pressed.

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
   `computeCost` returned null and the screen said *"Your per-student rate isn't
   set yet"* to schools whose rate the backend was serving on that very response.
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

| thing | outcome |
|---|---|
| Admin notification events | **Delivered.** Six admin types now arrive. The inbox needed NO frontend change to show them - it was built to render whatever comes - so it is no longer empty on day one. Typed in PR #288. |
| School narrative | **Delivered.** `GET /api/v1/school/narrative`, with `source` a const `"live_school_data"`. The Overview shows the school's own summary and the sample note is deleted, not reworded (PR #287). |
| DPA acceptance | **Delivered.** A typed record carrying version, accepting admin and timestamp. The client sends only the version; the rest is stamped server-side so it cannot drift (PR #288). |
| Scope enforcement | **ANSWERED: scopes ARE enforced.** An admin token without `oversight` gets 403 from `GET /api/v1/admin/team`. That also confirms the 401/403 split shipped in PR #267 - 401 ends the session, 403 does not - was the right call. |

Still open, and NOT frontend work:

| thing | why |
|---|---|
| A `category` on the notification ROW | `NotificationCategory` exists for preferences, but `NotificationResponse` carries only `type`. So the category filter, the per-category label and "mark these as read" have no source. Deriving one from `type` would be an invented mapping, and three of SCRUM-100's six admin categories (roster, SSO, teacher) have no enum value to map onto - this needs design and backend together. |
| Receiving bank account | **DELIVERED and wired, 8 Sep.** `GET /api/billing/bank-transfer-details` serves `{bankName, accountNumber, accountName, currency}`, all required — its own description reads "so the panel stops hardcoding it". The seam had been asking for `/api/billing/receiving-account`, which never existed, so every school was told the details were unavailable. Nothing is hard-coded now or then. |

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

| defect | caught by | not caught by |
|---|---|---|
| Child congratulated for every answer wrong | one component test (sad path) | contract checks, MSW, snapshots, happy-path E2E |
| snake_case posted to a camelCase endpoint | the contract gate, in seconds | unit/component/coverage - **MSW would have hidden it** |
| Signals dropped on 401 | one hook test on `flush()` | E2E cannot - the screen is pixel-identical |
| Login identifier invented client-side | the gate's unread-field check | everything else |

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

| primitive | why it is first |
|---|---|
| `useLiveQuery` | exists because FOUR hooks independently grew the same race — treating a slow answer as a failed one, stranding a teacher on sample data while their real class list had already arrived |
| `useSignals` | where the silent 401 data-loss lived |
| session store | expiry is the only thing between a stale localStorage token and a rendered roster |
| `client.ts` auth latch | concurrent 401s once cleared the session, lost the role, and sent a TEACHER to the child's sign-in screen |

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

| what | why |
|---|---|
| `checkpoints.ts` — 18 tests | the marking rules decide what a child is TOLD about their own work. `answerKey: null` must mean "cannot mark", never "wrong" |
| `variants.ts` — 10 tests | `interactiveVariant.answerKey` has the same nullable union, so the same way of going wrong; also the media-URL expiry margin |
| `FlagCard` — 7 tests | first component test. "Worth your attention" is a judgement about a child shown to their teacher |
| `MasteryDualTrack` — 11 tests | "Reading support needed" is a label a teacher may act on for months |
| `LiveFlagCard` — 12 tests | the live card, where the tap IS the acknowledgement |
| `HomeClasses` — 8 tests | showed other teachers' classes during every load |
| `LiveClassInsights` — 7 tests | "still gathering" over a failure is a false claim about real children |

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
3. Then full E2E - which needs a fallback-disabled build mode and a seeded tenant
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

* The "2.5s" came from a **corrupt build**. Rebuilding while the old `next start`
  still held `.next` left a manifest pointing at chunks that no longer existed, so
  Lighthouse scored an **error page** 75.
* Rewritten event-driven (scroll + resize + ResizeObserver on the pinned sections +
  fonts + visibilitychange) and measured over 3 runs, it is **slightly worse**:
  median 72 vs 73, TBT 578ms vs 432ms, Style & Layout 2491ms vs 1585ms.
* The premise was wrong. `window.scrollY` does **not** force layout in a modern
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

| | before | after |
|---|---|---|
| JS bytes on `/` | 808,881 (789 KB) | **774,524 (756 KB)** |
| chunks | 16 | **15** |
| HTML | 62 KB | 119 KB |

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

* **A hidden browser tab pauses `requestAnimationFrame` and stops painting.** Every
  screenshot returns blank and CDP reports "renderer may be frozen". I mistook that
  for a production bug across three surfaces before checking. **Check
  `document.visibilityState` before believing a blank screenshot.** Playwright is
  immune — headless browsers paint.
* `playwright.config.ts` used `??` for `E2E_BASE_URL`, so an empty string became the
  base URL instead of falling back. Now `||`.

---

## Cross-cutting

| item | state |
|---|---|
| **Tests** | 216 unit + 20 E2E, green as of 8 Sep. `npm test`, enforced by CI alongside types, lint and contract. Four shared primitives, the marking logic, the judgement screens, and the five admin failed-read guards. See **Testing**. |
| **Landing performance** | **41** deployed / **73** on a local production build (3-run median). Investigated 7 Sep — see below before repeating it. |
| **Lint** | Green as of 5 Sep (0 errors, 1 warning). Now enforced by CI. |
| **Contract** | Green as of 6 Sep. `npm run contract`, enforced by CI. |
| **TOSSE** | Working end to end and deployed. One test lead — `27ac8e8a-a46b-45e0-befe-50787d3b9eb9`, "DO NOT CONTACT" — still needs deleting from the booth list. |

---

## Standing asks — where the four landed

All four were answered or delivered on 7 September. Kept here because the
answers matter more than the questions did.

**1. Per-student consent — DELIVERED.** `ConsentStatus` is now
`["not_sent","pending","confirmed","withdrawn"]`, and a typed `consent` object
(status, actorId, actorName, timestamp, channel) is on the student list, the
student detail and the class roster. Parent consent is queued automatically when
an invited student with parent contact joins. Built in PR #281.

*The second half of that gap is closed too:* nothing used to request consent at
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
