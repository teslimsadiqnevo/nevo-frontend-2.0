# Nevo frontend — what is left

Last updated **6 September 2026**. Written from a survey of the source and the
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

**For the student session** — all found while scoping other work, none of it started:

- `src/lib/lessons/fromContent.ts` is the chokepoint: it discards
  `comprehensionCheckpoints` and all five typed variants, so a live lesson plays as
  text and every other modality renders "This modality is coming next" to a child.
  Five already-built pieces are behind it.
- `/student` 404s — no `page.tsx`. Same defect as `/teacher`, fixed 5 Sep; copy that.
- `/student/*` is unguarded by `proxy.ts`.
- `POST /api/intelligence/adapt` **returns** `modality_suggestion`, `break_suggestion`
  and `proactive_adjustment`. `useStudentLesson.ts:155` says the adaptation plan has
  no student-facing endpoint — that may be it.
- `messagesApi.reply(threadId, content)` exists and is typed. `useStudentThreads`
  still says "READ ONLY"; that comment predates the endpoint.

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

## Student app — the next focus

### The chokepoint

`src/lib/lessons/fromContent.ts` is the only adapter between `lessonsApi.detail()`
and the player, and **it discards `comprehensionCheckpoints` and all five typed
variants**. Its `RENDERABLE` list is `[TEXT]`, so a live lesson plays as text and
every other modality falls through to `ModalityPlaceholder` — the literal string
"This modality is coming next", shown to real children.

Its docblock still describes the pre-3-September contract ("every one of them is
typed `Record<string, unknown>`"). That is no longer true.

**Everything in the next section is behind that one file.**

### Typed, working, wired to nothing — BUILDABLE

Shipped 4–5 Sep as API-layer work. All have logic and no UI consumer:

| thing | where | what it needs |
|---|---|---|
| `markCheckpoint` / `toQuickCheck` | `lib/api/checkpoints.ts` | `fromContent` to carry checkpoints; the player already draws `QuickCheckSheet` |
| `markInteractive` / `mediaUrlExpired` | `lib/api/variants.ts` | `fromContent` to read the five variants |
| `contentApi.mediaUrl` | `lib/api/content.ts` | a caller — `mediaUrlExpired` decides when |
| `useDueReviews().playable` | `hooks/useDueReviews.ts` | `SubjectDetail` pills to become links into `/review-session` |
| `reflection` / `highlights` | `lib/api/students.ts` | `useStudentProgress` to return them; two screens to render them |

Neither `checkpoints.ts` nor `variants.ts` is exported from `lib/api/index.ts`.

### Stale comments that now contradict the contract — BUILDABLE

Each asserts a gap backend closed on 3 Sep, and will mislead the next reader:

- `lib/lessons/fromContent.ts:16-35` — "every one of them is typed `Record<string, unknown>`"
- `hooks/useStudentProgress.ts:19-22` — "WHAT IS GENUINELY ABSENT is the PROSE"
- `components/student/Progress/ProgressTab.tsx:28-31` — "No field carries…"
- `components/student/Progress/SubjectDetail.tsx:37-40`, `:241-243` — "nothing writes one"
- `components/teacher/Library/VariantReviewRoute.tsx:14-15` — still calls the variants "free-form"

### Routing and auth — BUILDABLE

- **`/student` 404s.** No `page.tsx` at `src/app/student/`. Same defect as
  `/teacher`, fixed 5 Sep — apply the same redirect to `/student/dashboard`.
- **`/student/*` is unguarded.** `proxy.ts` covers only `/teacher*`, `/admin*`
  and the two staff sign-in doors. `app/student/layout.tsx:17` notes the
  layout-level check is still owed.
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
| Student → teacher messaging | `POST /api/messages` constrains `recipientType` to `^(student\|class)$`. There is no `teacher` value, so a child cannot address their teacher at all. Read works; send does not. |
| Thread unread state | No endpoint reports it; the dot stays off. |
| Student SSO sign-in | Entirely mock (`resolveMockSso`). `authApi.ssoCallback` exists and the teacher side calls it. |
| Teacher-join class code | Pre-auth join still compares a hard-coded `VALID_CODE`. **Re-check:** `connections/class-code` went public on 3 Sep, so this may now be closable. |
| Per-concept assessment result | Questions carry no concept id, so the after-lesson result can only tell *all* from *none*. |
| Adaptation plan | No student-facing endpoint; a live lesson plays unadapted. |
| Backend-triggered breaks | `useBreakMonitor` is time-threshold only. |
| Boredom escalation | The tap spends the offer and asks nothing. |
| Downloads / offline | Endpoints exist; the device half is a Service Worker project. Hidden from signed-in children, honestly. |
| Baseline Module 4 items | No IRT service; items are authored mocks. |
| Ask Nevo scoping | The console holds no student or lesson UUID to send. |
| Narration audio | 4 × `TODO(audio)` — the assets do not exist. Playback is a simulated progress bar with no `<audio>` element. |

### NEEDS DESIGN

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

- **Sign out.** Was absent entirely; the footer was a non-interactive `div` while the
  Bearer token survived a tab close in `localStorage`. Shipped as PR #251.
- **Overview renders D04's fixture "Worth a glance" counts to every school**, including a
  brand-new one with zero students — "6 students are waiting on parent consent" to a
  school that has none. Gate the glance card and narrative on the `early` signal.
- **Both invite flows assert a parent consent request was sent** regardless of
  `deliveryStatus`, which the backend reports as `not_requested` / `email_not_configured`.
  The consent request is the legal gate before a child can begin lessons.
- **`PermissionProvider` resolves once, swallows the failure, and never re-asks**, so a
  founding admin who finishes the wizard lands on a rail showing one placeholder row and
  the words "No access yet". A cold-start 502 does the same thing to any admin.
- **A 403 is treated as a dead session**: `client.ts` clears the session and redirects to
  "your session has ended… for your security", so a scope denial reads as an inactivity
  timeout and logs the admin out. Scope filtering is client-side only.
- **Billing plumbing** — invoice list, invoice PDF, upcoming charge, billing-contact write
  — is buildable against nine live endpoints today. Only the pricing figures are disputed.
- **Failed reads rendered as established absences**, the shape #218 fixed one file over:
  Student detail says "No guardian on the record", SSO reads "Healthy", Reports says "not
  enough lessons yet", Notifications says "You're all caught up" — all on a FAILED read.

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
- **FOR THE STUDENT SESSION:** that same endpoint RETURNS `modality_suggestion`,
  `break_suggestion` and `proactive_adjustment`. `useStudentLesson.ts:155` says "the
  adaptation plan has no student-facing endpoint" and a live lesson therefore plays
  unadapted. That may be the missing plan - worth a look before building around its
  absence.
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

`FlagCard` tests what a teacher can READ and ACT ON — the name, the note explaining
the flag, the evidence behind it, where each action goes. **Not styling**: the design
frames are the contract for that, and asserting Tailwind classes would duplicate an
existing check while breaking on every redesign. The one visual thing asserted is
sudden-vs-pattern, because it is semantic rather than decorative.

### Next, in order

1. More judgement screens — `LiveFlagCard`, the mastery views, `LiveClassInsights`.
   `FlagCard` is the pattern to copy.
3. Then full E2E - which needs a fallback-disabled build mode and a seeded tenant
   first, because `shape-probe.mjs` records that the demo account holds real school
   staff and children.

### Traps found while scoping (do not relearn these)

- `useLiveQuery`'s effect begins `if (!getToken()) return;` - a hook test with no
  token exercises zero network logic and passes having tested an early return.
- MSW handlers authored alongside the code inherit its bugs. A handler for the TOSSE
  form would have accepted `school_name`, because that is what the form sent.
- Coverage is misleading here: `src/lib/mocks` is 2,541 lines of trivially coverable
  static data, and defect #3's drop path WAS covered - it was simply wrong.
- Snapshots would have locked in defect #1: there was one snapshot, the success
  state, and it was correct. The bug was a state never rendered at all.

---

## Cross-cutting

| item | state |
|---|---|
| **Tests** | 59 as of 6 Sep — four shared primitives, the marking logic, and one judgement screen. See **Testing**. Still uncovered: the other 13 teacher screens. |
| **Landing performance** | **41** on mobile (was 62 on 18 Aug). 2,800 ms total blocking time, 3,658 ms style & layout, 3.3 s script evaluation on a 398 KB page. The server responds in 60 ms — this is client JS, not network. Two chunks carry most of it. |
| **Lint** | Green as of 5 Sep (0 errors, 1 warning). Now enforced by CI. |
| **Contract** | Green as of 6 Sep. `npm run contract`, enforced by CI. |
| **Tests** | 59, green. `npm test`, enforced by CI. Four gates now run on every push: types, lint, contract, tests. |
| **TOSSE** | Working end to end and deployed. One test lead — `27ac8e8a-a46b-45e0-befe-50787d3b9eb9`, "DO NOT CONTACT" — still needs deleting from the booth list. |

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
