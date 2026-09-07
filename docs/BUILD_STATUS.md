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

### Also unresolved: SCRUM-80 contradicts itself on gating

The ticket says the notice **never blocks** a child (the school warrants consent in
the DSA). Lydia's comment on the same ticket has `ConsentGate` blocking while status
is `pending`, with a five-value enum — and the deployed `ConsentStatus` has only
`pending | confirmed`. Three versions of one model. Needs a ruling before the student
consent gate is wired.

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
- **`docs/blocked-items-handoff.md` is six weeks stale** and every backend contract in it
  is live. It is the single most likely source of a wrong blocker quote here.
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

Surveyed in depth 6 Sep (eight-dimension audit at `87192e8`, every blocker
adversarially re-verified; the quality and ops dimensions did not report, so test debt
and deploy/monitoring are still unassessed). **43 `TODO(api)` in components** remain the
largest single block in the codebase, spread across Students, Onboarding, Teachers, Senco,
Invitations and Classes.

18 of 27 buildable `Dxx` screens have a real component (~67%; ~78% counting the honest
partials D04, D07, D20). 17 of 21 admin routes call live endpoints. About half the
day-one flows complete end to end: register, sign in, invite a teacher, redeem the join
link, manage classes/teachers/students, SSO management, IEP export and compliance audit
all work. Reset a password, see per-student consent, see an invoice, or change any
setting do not.

### BUILDABLE — nothing blocks these

- ~~Sign out was absent entirely~~ — **shipped, PR #251.** The footer was a
  non-interactive `div` while the Bearer token survived a tab close in
  `localStorage`, so the next person on a shared staff machine was signed in as
  the proprietor.
- ~~Overview rendered D04's fixture "Worth a glance" counts to every school~~ —
  **shipped, PR #257.** A school with no lessons taught now gets D04's own
  "Getting started" checklist; a tick is only ever set from a signal we hold.
- ~~Both invite flows asserted a parent consent request was sent~~ — **shipped,
  PR #258.** NOTE THE FINDING BEHIND IT: nothing in the product requests parent
  consent at all. `consentsApi.requestParentConsent` is typed with NO CALLER, the
  invitation response carries no consent field, and consent is requested against
  a STUDENT id that does not exist until the invite is accepted. With
  `email_not_configured` a live state, invited students' parents are probably
  never contacted by any path — a launch blocker on the consent gate itself,
  backend or product, not frontend.
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
  Verified by types and inspection, NOT by tests — see the rejection-mocking trap
  under Testing.

### NEEDS BACKEND

| thing | why |
|---|---|
| Per-student consent | No GET returns consent for any student but the child themselves, and `ConsentStatus` is `[pending, confirmed]` where D07 needs four pills. Withdrawal is causable via the parent rights endpoint with **no way to read it back**. Blocks D07's column, count and row action, D07b's consent card, and the D5b roster pill. |
| Admin notification events | `NotificationType` carries no admin events, so the inbox and popover are empty on day one. |
| School narrative | Nothing writes a school's own board summary; D04 leads with a card whose own note says the figures are not this school's. |
| DPA acceptance | Schools accept 0.9-draft wording and the only record — version + timestamp, no admin id — is written into the untyped `school.profile.onboarding` blob. |
| Scope enforcement | **UNKNOWN, not confirmed.** `proxy.ts` is optimistic and checks role, never scope. One request with a roster-only token against `/admin/team` settles it. |

### NEEDS DESIGN

- Where a non-oversight admin lands. SCRUM-39 lists Overview for billing-only; D17 IT Home
  and D18 Finance Home have no route. A bursar currently has nowhere to go.
- D03 draws no way to change an existing admin's scopes, though the endpoint is live.
- The NDPA non-zero compliance state is drawn nowhere school-facing.
- Three of the four `inferred` nav scopes are actually settled by SCRUM-39's own item map;
  only Settings remains genuinely unmapped.

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

### Prerequisite 2 — a seeded tenant. NOT DONE, and needs a person.

`scripts/shape-probe.mjs` records that the demo account holds **real school staff and
children**. A write-path E2E — assign a lesson, send a message, upload a unit —
mutates real people's records. So E2E needs its own school before it runs once.

**BLOCKED ON A BACKEND BUG, raised 7 Sep.** `POST /api/v1/schools/register` returns
**500 on valid, unique input** — reproduced twice at ~00:22 UTC with fresh timestamped
emails on two different domains. Body is a bare `Internal Server Error`;
`CF-RAY: a3718f180abdc13d-CPT`, origin `uvicorn` on Render, so the traceback is in the
Render logs.

Validation is healthy (422s correctly, including rejecting reserved domains like
`.invalid`), so it fails AFTER validation, during creation. It takes 3.5s to fail
versus 1.4s to reject — it is doing real work first, so **check whether failed
attempts leave partial rows behind**.

This blocks all new school onboarding, not just our test tenant.

What it needs to be:

- a school named unmistakably for the purpose, e.g. `E2E DO NOT USE — automated tests`
- an admin address on a domain nobody reads
- credentials in CI secrets, never in the repo
- ideally one teacher, one class and two students inside it, so the console has
  something real to render

Until that exists, E2E can cover **read-only, signed-out** surfaces only.

### Signed-out E2E — DONE 7 Sep. 20 tests, `npm run e2e`.

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

### Prerequisite 3 — Playwright, DONE. What remains is the tenant.

Deliberately NOT installed yet. It is the heaviest install in the ecosystem (browser
binaries) and this lockfile is shared by three sessions, so it should land when the
tenant exists and the first spec is actually being written — not before.

Auth will need the programmatic route: the token lives in **localStorage**, invisible
to the server, so `storageState` alone will not carry a session. Sign in via the API,
then seed localStorage before first paint.

### Next, in order

1. Olayinka creates the E2E tenant (above).
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
- **A component whose mocked API call REJECTS fails the file, even when the
  component catches it.** `mockRejectedValue`, an `async` throw, and a
  `Promise.reject` with a no-op `.catch` attached were all reported as
  `Error: <msg>` against the test, with no assertion failure, while the
  success-path test in the same file rendered the same component fine. The
  component's own `.catch` is attached correctly and the fix works in the
  browser. This is why the five failed-read guards in PR #269 ship verified by
  types and inspection rather than by tests: every admin screen fails this exact
  way, so none of them can currently be tested for it. Worth solving properly -
  it blocks the "component tests only on screens rendering a judgement about a
  child" half of the plan above.
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
| **Tests** | 102 as of 7 Sep — four shared primitives, the marking logic, and five judgement screens including both hook-driven ones. See **Testing**. |
| **Landing performance** | **41** deployed / **73** on a local production build (3-run median). Investigated 7 Sep — see below before repeating it. |
| **Lint** | Green as of 5 Sep (0 errors, 1 warning). Now enforced by CI. |
| **Contract** | Green as of 6 Sep. `npm run contract`, enforced by CI. |
| **Tests** | 113 unit + 20 E2E, green. `npm test`, enforced by CI. Four gates now run on every push: types, lint, contract, tests. |
| **TOSSE** | Working end to end and deployed. One test lead — `27ac8e8a-a46b-45e0-befe-50787d3b9eb9`, "DO NOT CONTACT" — still needs deleting from the booth list. |

---

## Standing asks — what the admin console is now blocked on

Every frontend-fixable launch blocker on the admin console is shipped
(PRs #251, #257, #258, #264, #267, #269, #272). What is left cannot be closed by
this repo. Four items, each with the one thing that would unblock it:

**1. Per-student consent has no read, and nothing requests it. — Teslim**

Two separate gaps behind one surface, and the second is worse than the first:

- No GET returns consent for any student but the child themselves.
  `ConsentRecordResponse` is referenced by exactly ONE operation and it is a
  POST. `ConsentStatus` is `[pending, confirmed]` where D07/SCRUM-40 needs four
  pills — `withdrawn` is causable via `POST /parent/{token}/rights` with **no
  field anywhere that can read it back**.
- `consentsApi.requestParentConsent` is typed in this repo with **no caller**,
  and it cannot be wired from the invite flow: consent is requested against a
  STUDENT id that does not exist until an invite is accepted. Combined with
  `InvitationDeliveryStatus` including `email_not_configured`, invited students'
  parents are most likely **never contacted by any path**.

Consent is the gate before a child may begin lessons, so this is a launch
blocker on the flow itself, not on a screen. *Ask: add
`consent: confirmed|pending|notsent|withdrawn` (plus actor, timestamp and
channel per SCRUM-40) to the student roster and detail reads, and either report
the consent request's state on the invitation or give us a call that queues one
for an invited student.*

**2. The pricing model. — Lydia, then Teslim**

D11/D11b say per-student ₦150,000 + 7.5% VAT, "no tiers, no plan selection".
`GET /billing/subscription` answers with `subscriptionTier`, `studentCountBand`
and a flat `contractValue` — SCRUM-98, the spec those frames superseded. The
billing screen ships without its cost sheet because rendering either version
states a school's annual bill on the strength of a disagreement. Jira is
inverted here too: SCRUM-98 is Done while SCRUM-115 sits in Idea, unassigned.
*Ask: confirm which model is real, and re-baseline those two tickets.*

**3. Nevo's receiving bank account. — business**

D11's "How to pay" panel needs it, and **no schema in the deployed spec carries
a payable account** — checked field by field. The frame fills it with literal
details (Providus, an account number). That was not built: an unsourced payable
account in frontend source sends money to the wrong place the day it goes stale.
The only payment seam that exists is `POST /payments/checkout`, which returns a
Paystack `authorizationUrl` — a hosted gateway checkout D11 explicitly forbids.
*Ask: decide the account, and expose it on an endpoint rather than in a frame.*

**4. Does the backend enforce `PermissionScope` server-side? — Teslim, one request**

Unknown, and it is the only item here that is a question rather than work.
`proxy.ts` is explicitly "OPTIMISTIC ONLY" and checks role, never scope, so
scope filtering is client-side today. The deployed spec documents **zero** 401
or 403 responses, so the status a denial returns is also unconfirmed — which
matters, because `client.ts` now treats 401 as a dead session and 403 as a
refused action (PR #267), and that split is only correct if the backend agrees.
*Ask: one request with a roster-only token against `GET /api/v1/admin/team`, and
tell us the status code.* If denials are not enforced server-side, client-side
scope filtering is a security gap, not a convenience.

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
