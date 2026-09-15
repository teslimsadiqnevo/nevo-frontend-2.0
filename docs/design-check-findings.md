# Admin design check — 74 confirmed findings, 15 September 2026

**All 74 are closed as of 16 September.** Rows 1 and 2 were fixed with the
original six law breaches; the remaining 72 were worked lane by lane and are
recorded below, each with the reasoning where the fix shipped differs from the
proposal in the table.

Every built admin screen compared frame-by-frame against its design frame
and SCRUM spec, then each finding adversarially verified against the code
by a second agent. **79 raw, 74 confirmed, 5 rejected.**

The low rejection rate is not a sign the bar was low — the five law-severity
findings were independently re-checked by hand and all five were real.

Severity: `law` breaks a design law · `state` a state the frame draws that
does not exist · `copy` a sentence that differs in meaning · `layout` a
visual or breakpoint divergence.

**Fixed already (all law-severity):** the withdrawn-consent action, the
deactivated-teacher reassignment, the accommodation pills, the payment card
on the finance home, the bulk-import lesson claim, and the adaptation log's
raw event key. Rows 1 and 2 record two of those six and are closed.

## Closed

Worked by lane. Where the fix shipped differs from the proposal in the table,
the reason is given — those are the rows worth reading.

### Overview — 15, 16, 17, 18, 19, 49, 65, 66

- **17, per-card failure.** `complianceAudit()` was settled rather than left
  bare, so a 500 on it costs its card and not the board summary, the roster
  counts and the roll-up with it. A **403 still denies the whole page**: that
  is not a card failing, it is an admin without `oversight`.
- **A second defect this exposed.** `early` was `(adaptationTotal ?? 0) === 0`.
  Unreachable while the audit gated the page, and live the moment it stopped —
  a school of 287 whose reads failed would have been greeted with "Welcome to
  Nevo — there's nothing to report on learning just yet". Not knowing is not
  zero; it now renders the ordinary dashboard.
- **16, the period pill — built smaller than drawn, deliberately.** The frame
  draws a control (caret, pointer) and SCRUM-39's data line sources it from a
  period-scoped `GET overview` that is not deployed. The pill states the scope
  the figures actually have ("Since setup") and is not a switcher. The term
  prefix on the date line is **not** built: there is nothing to derive
  "Half-term 2" from, and inventing it is the same lie as 49. `TODO(api)`.
- **49, the snapshot heading — period-neutral, against the spec's own copy
  line.** SCRUM-39 fixes it as "Activity this week" and the adaptation
  descriptor as "this half-term". Not one of the five figures beneath is
  scoped to a period — `studentsProfiled`, `adaptationEventsLogged` and every
  `SchoolRosterCounts` field are all-time or point-in-time, with no date
  filter between them. "Activity so far" is the honest heading. Same TODO.
- **19, denominators.** Band-sourced, per SCRUM-39 ("from the band seat
  ceiling, not from a count of rows"). **Enterprise gets none** — "801+" is a
  floor, not a ceiling, so there is no honest number to put after "of".
- **18, muting.** Early-life zeros only. The compliance zero stays navy at
  full weight for ever, which SCRUM-39 calls out as the deliberate difference;
  it is not built from `snapshotTiles.ts` for that reason, and a test pins it.
- **15, board pack.** Carries the compliance line and the adaptation count per
  spec, in `labelHero`'s words rather than a second copy of that claim. A
  figure we failed to read is **omitted, never zeroed** — nothing puts
  "Diagnostic labels stored: 0" on a governor's desk off a read that did not
  return. A refused clipboard says so instead of claiming success.

New, tested: `snapshotTiles.ts`, `boardPack.ts`.

### IT & SSO — 30, 31, 32, 33, 34, 35, 53

- **32, the disconnected school.** `SsoConnectionStatus` has three members and
  the page branched on two, so "we hold a status record" was read as "a
  provider is live". A school that had turned Microsoft 365 off got the full
  connected page — a "Healthy" roster sync with a Sync now button, a sign-in
  URL nobody can use, and an offer to disconnect what is already disconnected.
  `isLive` now draws that line once, and the school gets its **code** instead,
  with a line saying when the provider went and that nothing of theirs was
  lost.
- **34, never synced.** "Healthy · Last synced never" was what a school in its
  first hour saw. The ladder is now ordered and tested in `ssoState.ts`, and
  `next_scheduled_sync_at` — fetched and never rendered anywhere — is what the
  waiting state says.
- **30, the mapping gap.** Banner and the degraded sync word, both to D10's
  copy. The **action is scope-gated**: assigning a teacher to a class is
  `roster`, this screen is `it_sso`, and `it_sso` can be held alone — so an
  admin who cannot open Classes is told the fact without being sent to a
  refusal. That follows the rule `itHomeRows` already keeps.
- **31, the disclosure.** Both groups, both headings and the route out. "What
  we never touch" is a **product guarantee held in the client**, because no
  endpoint can enumerate an absence. It renders for a disconnected school too,
  in the past tense — that reader is the one most likely to be asking.
- **33, copy.** Local to the button, clears after 2.2s, and a clipboard the
  browser refuses says so rather than going silent. It used to write "Copied"
  into the page-wide notice several sections above, overwriting whatever the
  last sync or disconnect had said, and never clearing.
- **35, provenance — not built, by design.** D10b prints "Connected by Mr.
  Idris Bello on 12 March 2026" and nothing in the contract carries an actor
  or a connected-at. `reauthorised_at` is a different event; dating the line
  from it would print the wrong year under the words "Connected by".
  `TODO(api)` on `SsoStatus` naming the two fields wanted.
- **53, "Not in use."** Back to being a description of one provider rather
  than a pill on every card — a school with nothing connected met two cards
  each stamped with it, on the page inviting them to connect one.

New, tested: `ssoState.ts`.

### Invitations — 8, 9, 10, 57

- **8, the counters.** D19 draws them as the screen's primary filter and they
  were three numbers nobody could press. The first counted the whole tab — a
  total is not a subset any filter can select, so pressing it could only ever
  mean "clear". The set is now the frame's own Pending / Joined / Expired, and
  pressing the active one clears.
- **10, the consent filter.** Its own value, **not a fourth status**. D19's
  fixture folds "Consent Withdrawn" into the status badge; the contract does
  not, and a withdrawn child's invitation is very often `joined` — so a
  status-only filter could never have surfaced them, which is the point of
  the filter. Student tab only, and it clears itself when the admin switches
  to Teachers rather than hiding every row behind a control no longer on
  screen.
- **9, pagination.** Twenty a page, the frame's size, with its "Showing 1-20
  of 47" line. The window is **clamped**, so narrowing a filter while on page
  four lands on page one instead of an empty table.
- **57, the join landing.** The wordmark, above the panel and outside every
  branch — including expired and invalid, which is exactly when someone wants
  to know whether the link they were sent was real. Same crop as the sidebar.

New, tested: `inviteFilters.ts`.

### Notifications — 11, 12, 13, 58, 59

- **11, archive in the panel.** `NotificationRow` already took the handler and
  the page already passed one; the panel passed nothing, so the same row had
  the action in one of the two places it renders. A refused write puts the row
  back rather than leaving the panel showing what the server declined.
- **12, hover.** SCRUM-100 has one sentence per surface — panel "revealed on
  row hover only", page "always visible rather than hover-only" — and one rule
  was applied to both, honouring neither: hidden on the page at both drawn
  widths, revealed in the panel only above 1024. It keys on `compact` now.
- **13, the failure state.** The spec's copy verbatim ("We couldn't pull these
  in just now. We're on it.") with the **Try again** it asks for. What it
  replaced told the reader to close the panel they were reading and open it
  again.
- **59, the bell mark.** SCRUM-100 keeps it by name and the done-criterion
  says so; it had been dropped, leaving two lines of text in an empty panel.
- **58, the breakpoint — and the console-wide rule behind it.** `AdminSidebar`
  collapses its rail at `(min-width: 1280px)`, so **1280 is this console's
  tablet boundary**. A `max-lg:` variant fires below 1024 and therefore never
  fires at 1024×768, the size the frames are drawn at — so the stacked form
  was written, shipped, and unreachable at either drawn width. Re-keyed to
  `max-xl:`, with the reasoning recorded in the file.

**Also fixed here, not in the register:** the panel capped at six rows where
SCRUM-100 says eight ("Panel caps at eight with a route to the full page").

### Classes — 4, 5, 44, 45, 46, 56

- **4, the Created state.** SCRUM-40: "Sheet closes, new row enters, nevoPop
  check badge on the row for one shot, then rest." It navigated away to the
  new class's detail page instead — so an admin creating three classes in a
  row was taken off the list every time, and never once saw the list they had
  just changed.
- **44, the source line — and a TODO that was already corrected.** The note in
  this file's docblock first said no endpoint reported the last sync, was then
  corrected to say the gap was ours, and **sat there, corrected and unacted**,
  while the line went on saying "your school's connected roster". It now reads
  as SCRUM-40 writes it. Every clause is conditional on having been told: a
  status we could not read keeps the generic sentence rather than inventing a
  provider, and a school that has never synced gets no clause rather than the
  word "never".
- **45, the remove confirm.** SCRUM-40: "His notes on these students stay with
  the school." It said "Nothing about the students changes" — a different and
  weaker claim that answers a question nobody asked while leaving the one they
  did ask, about their colleague's work, unanswered.
- **46, the primary conflict.** The dropped clause was "she keeps the class and
  her notes" — the half that matters, since what an admin hesitates over here
  is whether they are taking something off a colleague.
- **5, the secondary Close.** Both failure footers offered only Try again. A
  failure with one way out holds the sheet open until it succeeds.
- **56, the breakpoint** — same re-key as 58, plus the tablet side padding the
  header was missing, so the column labels track their columns again.

### Teachers — 40, 41, 72, 73, 74

- **40, the dead end.** `staff: []` was the value on first render, after a
  failed read, and for a school with nobody else active — and all three
  rendered the same uncompletable sheet: selects showing only a placeholder, a
  commit that could never enable, nothing on screen to act on. Three states
  now, each saying which. `AssignTeacherSheet` had already learned this
  lesson; the same hole was left open next door.
- **41, no confirmation.** The sheet closed onto a list where the teacher was
  still present — the reload happens in the parent, afterwards — so an admin
  who had just handed over four classes saw a screen identical to the one they
  started from. It holds for its confirmation, then closes.
- **72 and 73, the tablet row.** Re-keyed like 56/58; and the Classes cell was
  hidden at tablet with **nothing in its place**, so how much a teacher is
  teaching — this screen's whole subject — vanished at 1024. It rides under
  the name now, as the year group does on the classes list.
- **74, the empty state.** `flex-1` was inert: both wrappers above it are
  plain blocks, so the panel centred inside its own content box and rendered
  directly beneath the heading. A definite height fixes it.

**Also fixed, same defect, sibling files:** the identical inert empty state on
`Classes/ClassesView` and `Students/StudentsView`. The check raised it on
Teachers only; it is one fix in three files, and leaving two behind is exactly
the shape this register keeps finding.

### Billing — 3, 42, 43

- **3, overdue.** The row line and the 60-day page panel, both to D11.8. Every
  constraint on them is the spec's and none is stylistic: "no red, no warning
  glyph, no 'account at risk', no countdown to suspension", because
  "non-payment never affects a student's or a teacher's access. Not at 60
  days, not at 200, not ever." The row line therefore says how long it has
  been and that nothing has changed for the children, and stops. Several
  overdue invoices aggregate into **one** panel, with the bank details inline
  so paying needs no navigation.
- **A rule this turned up.** The aggregate total needed adding decimal
  strings, and `money.ts` opens with "never through a float". `sumMoney` was
  added there rather than a `Number()` sum written at the call site — on the
  one figure a bursar reconciles against their own ledger. It is hand-written
  string arithmetic because the project targets ES2017, matching the `carry()`
  helper already in that file.
- **42, the empty state.** SCRUM-98's done-criterion is "names the first
  invoice date rather than saying nothing is here" — and the date is
  `upcoming.dueAt`, which this screen already reads and renders forty lines
  above. The one thing a bursar opens that section to find out was on the page
  and not in the state that exists to answer it.
- **43, a promise Billing cannot keep.** The finance home said "the full
  schedule is in Billing" and offered "See schedule". SCRUM-98 draws that
  six-year table off `GET rate_schedule`; no such endpoint is deployed and the
  word "schedule" does not appear in `lib/api/billing.ts` at all. The row now
  names what Billing does hold — this year's cost in full — with a `TODO(api)`
  for the schedule itself.

New, tested: `Billing/overdue.ts`, `money.sumMoney`.

### Settings — 21, 22, 23, 24, 25, 26, 27, 51

- **25, the preset maps were shifted a level.** British had `kg1` as
  "Reception" and `p1` as "Year 2", where D12b's own `presetMaps` put them at
  "Reception 1" and "Year 1" — and SCRUM-99 states it outright in its example
  copy, "P1 shows as Year 1". This is not cosmetic: **a Year 1 class was
  labelled Year 2 on every screen in the product, including the ones a parent
  sees.** Both maps are now the frame's, copied in enum order.
- **24 and 23.** IB added (PYP/MYP/DP). Custom is a real card, and the preset
  is **derived from the labels** rather than read from a stored string — so a
  school that renames one level can no longer be described as "British" over
  labels that are not. The cards show mappings ("P1 shows as Year 1") instead
  of four bare names.
- **26, validation.** Overlaps, reversed terms and half-term breaks outside
  their own term, each as a plain navy line under its row, with Save gated and
  the live count SCRUM-99 asks for. **Gaps are deliberately not flagged** — a
  Nigerian year has a real month between terms, and treating that as something
  to resolve would disable Save on every correct calendar.
- **27, half-term dates.** `halfTermBreak?: boolean` was dead — nothing wrote
  it, nothing read it, and it could say a break existed but never when, on the
  screen whose whole job is to say when. Replaced with the spec's pair.
- **51.** SCRUM-99's VS ERASURE line, verbatim; it is a done-when.
- **21 and 22.** Signing a device out fired on the first press and named no
  consequence — and every row reads "Another device", because the contract
  carries no device name at all. One misread row ends the session someone is
  working in. And a single session rendered as a one-row list with nothing to
  do on it, where the answer wanted is that nowhere else is signed in.

**Not from the register, and larger than any row in it.** `saveCalendar` wrote
`yearStart`, `yearEnd` and `terms` — all three of which are **ours**, client
inventions kept in a blob the backend passes through untouched. The deployed
`AcademicConfig` types exactly one property, `termStartDates`, whose own
description says what happens without it: *"fewer means Nevo falls back to
splitting the contract year evenly."* So a school that carefully set three term
dates in Settings had told Nevo nothing, and every "this half-term" figure in
the product went on dividing their year into equal thirds. The save now derives
and writes it.

`maxItems: 3` on that field cannot express the four-term year this screen's own
"Add a term" action offers; a `TODO(api)` records it rather than guessing which
half is wrong.

Also corrected: both SCRUM-40 and SCRUM-99 say "17 canonical levels" in prose
and then enumerate sixteen. The code follows the list, and says so.

New, tested: `academicCalendar.ts`, `taxonomy.ts`.

### Shell — 28, 29, 52, 70

- **28, the identity block never said who you are.** It rendered a generic
  person glyph over a scope summary, so the one place in the console that
  answers "who am I signed in as" answered only "what may I do" — on a
  justification recorded in that very file which had already been corrected
  elsewhere: the teacher console reads the same hook and has shown a name and
  initials since 1 September. The scope line stays underneath, because it is
  what tells two admins at the same school apart.
- **70, the rail scrolled instead of the list.** With `overflow-y-auto` on the
  aside, a rail taller than the viewport scrolled as a whole — so at 1024×768
  the Notifications row, the Collapse chevron and the account and sign-out
  block all fell below the fold. That is every persistent control in the
  console, reachable only by scrolling a sidebar nobody expects to scroll.
- **52.** The "Admin" badge beside the wordmark. Three consoles share one mark
  and only this one is drawn with a badge; without it an admin and a teacher
  see the same wordmark over different products.
- **29, and its fifteen siblings.** The sign-out primary darkened on hover,
  which is D14's **pressed** treatment — a navy button that darkens as the
  pointer arrives reads as already-pressed, which is the one impression a
  sign-out confirm should not give. The check raised it here and (as 64) on
  five onboarding primaries; `hover:brightness-93` appeared **16 times across
  10 files**. All are now `hover:brightness-110 active:brightness-93`, which
  also closes 64.

### Intelligence — 6, 7

- **6, the filtered-empty state.** It discriminated on the class filter alone,
  so an admin who had narrowed to one KIND of adaptation and found nothing was
  told "No adaptations were made in the last 30 days" — a flat statement about
  their school, produced by a control they had set two rows above — with no way
  back. The kind filter arrived after that branch was written and nothing in it
  noticed.
- **7, documentation rather than a build.** Cohort analytics ships with no
  cohort selector, no time range and no previous-period comparison — three
  controls SCRUM-65 locks as decided — and the docblock, exhaustive about
  everything else on that screen, never said so. Each needs a parameter no
  deployed endpoint accepts, and the responses are already aggregated, so there
  is nothing to narrow client-side either. Recorded with the reason, because a
  proprietor looking for "how is JSS 2 doing" should not have to infer from an
  empty toolbar that nobody thought of it.

### Learning Support — 20, 50, 67, 68, 69

- **50, the attestation the screen exists to produce, naming nobody.** A
  finalised IEP is a member of staff putting their name to a report about a
  child, and it read "Finalised 14 September" — that something happened, not
  who stands behind it. **Guarded on identity:** the contract gives
  `reviewedByUserId`, an id and not a name, so the only reviewer this console
  can honestly name is the person reading it. Anyone else's report keeps the
  date alone rather than an id nobody recognises. `TODO(api)` for
  `reviewedByName`, which every comparable surface already has.
- **20, the review note.** `POST /exports/iep/{id}/review` has always accepted
  `reviewNote` and `IepExport.reviewNote` has always carried it back — the
  field existed on both ends of the call and no screen ever wrote it. An empty
  note is sent as null, not `""`.
- **68, the open-flag dot.** Built from flags already in the same component's
  state. Without it the two halves of the screen did not join up: a SENCo
  reading the profiles list had no way to see which learners the Learning
  Support tab is about. **Open flags only** — a permanent mark on a learner
  whose flag was handled weeks ago is the kind of lingering label this console
  does not keep.
- **67, the year-group filter.** Offered only for the year groups this
  school's own classes use, never the full canonical list.
- **69, the empty state's mark.** The calmest screen in the console was also
  the barest, on the tab a SENCo opens hoping to find exactly that state.

### Students — 36, 37, 38, 39, 54, 55, 71

- **36, what withdrawn actually means.** The card named the fact and stopped.
  Since 15 September the backend enforces withdrawal on the four processing
  endpoints with a 403 `consent_withdrawn`, so the child genuinely cannot start
  a lesson — and this is the screen an admin opens when a parent rings to ask
  why. It now states the three things the reader needs: lessons are paused,
  nothing of the child's is lost, and **only the parent who withdrew can lift
  it**, because SCRUM-80 makes that their decision and nothing in this console
  may override it.
- **55, the move sheet answered a question nobody asked.** It said the old
  class's teachers would lose sight of the child — true, and colder. SCRUM-40's
  line is about what is kept: notes belong to the class, not the teacher, and
  an admin hesitating over a mid-term move is asking whether the work written
  about this learner survives it.
- **37 and 38, two silent endings.** A completed move closed onto a roster that
  looked unchanged; an **erasure** — the one irreversible action on the screen
  — returned in silence. Both confirm now, the erasure by carrying the name
  through the navigation so the roster can state it.
- **39, the consent filter.** Its five states, plus **"No record at all"** as
  its own option: a row that came back with no consent object is not the same
  as `not_sent`, and folding them would report a read gap as a school's own
  decision not to ask.
- **54, the footer line** SCRUM-40 says to keep by name — "it is where admins
  learn how parent accounts come into being". It counts what is on screen, so
  it stays true under every filter above it.
- **71, the consent pill in the header,** where the frame puts it. It was
  readable only by scrolling, on the record whose header is the one thing an
  admin reads before deciding anything about a child.

### Onboarding and team — 14, 47, 48, 60, 61, 62, 63 (64 closed with 29)

- **14, a school at its allowance had no path to add anyone.** The invite
  action was removed outright, where SCRUM-39 says the opposite in as many
  words: "At zero remaining the invite action stays visible and routes to
  Billing." The card explaining the allowance is the explanation, not a
  replacement for the affordance — a control that vanishes teaches nothing.
- **61, the invite replaced the page.** Pressing Invite returned the panel
  *instead of* the whole screen, so the team being looked at — and the seats
  line that decides whether to invite at all — disappeared at the moment of
  deciding. It is a docked sheet over the list now, which is what SCRUM-40
  reserves sheets for.
- **47, the failure blamed the admin.** "Check the address and try again" is a
  correction, on a failure the response gives us no reason to attribute to
  them — and it left the real question unanswered: whether the four scopes they
  had just ticked survived. They do, and it now says so.
- **48, one sentence for two providers.** Both SSO cards read "the school
  account they already have", so the choice between Microsoft and Google was
  made from the title alone. D01's three descriptions, verbatim.
- **60, the one moment of warmth.** A head teacher has just given Nevo their
  school's name, band, DPA acceptance and sign-in method; the last screen read
  like another form. The confirmation mark is on **both** branches.
- **63, the wordmark.** The two places a school meets Nevo before there is a
  console around them were the only two carrying nothing that says whose
  product this is.
- **62, the wizard's breakpoint** — the same `lg:` → `xl:` re-key as 56, 58
  and 72: keyed at `lg` it applied its desktop centring from 1024 up, so the
  tablet treatment the frame draws at 1024×768 could never be reached.

**Still carrying `max-lg:`, same defect, not raised by the check:**
`Reports/ReportsView`, `Senco/IepExporterView`, `Settings/SchoolSettings`,
`Students/StudentDetailView`, `Teachers/TeacherDetailView`,
`Onboarding/DpaStep`, `Invitations/InvitationsView`. Left alone rather than
swept, because each needs looking at against its own frame — but they are the
same bug and should go in one pass.

## The suite cannot be run in parallel on this machine

Worth recording, because it cost most of an afternoon and will cost the next
person the same.

`npx vitest run` reported 11 failures on one pass and 20 on the next, in
different files each time, across the student, teacher, parent and admin
lanes. None of them was real. Running the failing set together produced the
actual explanation: **seven of eight files failed to start a worker at all** -
`[vitest-pool]: Failed to start forks worker ... Timeout waiting for worker to
respond`. The "failures" underneath are `waitFor` calls running out while
their worker is starved, which is why they cluster on tests that await a
mocked rejection.

`npx vitest run --no-file-parallelism`, with nothing else competing for the
machine, is **147 files / 1110 tests, all passing**.

Two corrections to things this document said earlier, both from the same
mistake - I ran other suites in the foreground while a full run was going, and
then read its output as if it meant something:

- It claimed three student-lane suites fail on `main`. They do not. They pass
  in the clean serial run, and the earlier evidence was contaminated.
- The per-lane runs quoted above were each re-verified serially and alone.

The practical rule: a parallel run proves nothing here, in either direction.
Gate on `--no-file-parallelism`, and do not run anything else while it goes.

| # | sev | lane | finding | fix |
|---|---|---|---|---|
| 1 | law | intelligence | The adaptation log prints the engine's raw event key as each row's headline instead of the plain-language label the codebase already defines. | In src/components/admin/Adaptations/AdaptationLogView.tsx line 436, render the mapped label with a neutral fallback instead of the raw key: {eventTypeLabel(r.eventType) ?? "Nevo made an adju |
| 2 | law | senco | The learner profile prints the raw accommodation enum as pills ("Reading", "Attention", "Numerical") where the frame's fixed copy is sentences about what Nevo is doing - a category noun besi | ALREADY APPLIED for the accommodations half — and applied as exactly the proposed fix, so the proposal needs no further work there. On branch `fix/design-law-breaches` the working tree carri |
| 3 | state | billing | Billing implements no overdue state beyond a violet pill: neither the per-row line naming the days and stating nothing has changed for students, nor the page-level panel past 60 days. | In src\components\admin\Billing\BillingView.tsx:  1. Row line. Add a small helper `daysPastDue(dueAt: string): number \| null` (null on an unparseable date, clamped at >= 1). In the invoice  |
| 4 | state | classes | The Created state on the classes list is not built - creating a class navigates away to its detail page instead of closing the sheet onto the list with the new row marked. | In `C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Classes\ClassesView.tsx`:  1. Replace the navigate-away on save with the spec's Created state. Keep the return |
| 5 | state | classes | Both failure footers in this lane offer only Try again; the spec's secondary Close action is missing. | Add a GHOST_BTN "Close" wired to onClose beside the "Try again" primary in both failed footers: AssignTeacherSheet.tsx:192-201 (phase === "failed") and ClassFormSheet.tsx:120-129 (phase ===  |
| 6 | state | intelligence | The filtered-empty state ignores the type filter: it names the wrong cause and offers no way back. | Fold the type filter into the same two places that already know about the class filter.  1. The empty branch, AdaptationLogView.tsx:389. Change the condition it discriminates on from `classI |
| 7 | state | intelligence | Cohort analytics ships with no cohort selector and no time range - three controls the spec locks as decided - and the docblock, which is otherwise exhaustive, never names this gap. | Documentation, not a feature build. In the ReportsView docblock (C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Reports\ReportsView.tsx, after the D9 TODO at lin |
| 8 | state | invitations | The status counters are inert. D19 draws them as the screen's primary filter control, and one of the three counters is a different quantity. | Follow the frame's statDefs. In the `stats` useMemo (InvitationsView.tsx:152-160), replace the total tile with the Expired count so the set is exactly Pending / Joined / Expired, and carry t |
| 9 | state | invitations | The invitations table has no pagination at all, on a screen whose own bulk import accepts 500 rows in one go. | In src/components/admin/Invitations/InvitationsView.tsx, add client-side paging matching the frame. Hold a `page` state, derive `pageCount = Math.max(1, Math.ceil(visible.length / 20))`, cla |
| 10 | state | invitations | There is no way to find the students whose parent withdrew consent: the frame's "Consent Withdrawn" status filter is absent even though every invitation row now carries consentStatus. | Add a "Consent withdrawn" option to STATUS_FILTERS in src/components/admin/Invitations/InvitationsView.tsx:43-48, shown only on the student tab (a teacher invite has no parent behind it, exa |
| 11 | state | notifications | The popover has no Archive action on any row, so the per-row archive SCRUM-100 adds to the panel simply does not exist there. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Notifications\NotificationsPanel.tsx, add an onArchive handler mirroring NotificationsView.onArchive (Notificat |
| 12 | state | notifications | On the full page the Archive action is hidden until hover at both designed widths, where the spec asks for it to be always visible on the page. | In "C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Notifications\NotificationRow.tsx", gate the hover reveal on the panel surface only, using the `compact` prop  |
| 13 | state | notifications | The panel's failure state offers no way to retry and paraphrases the spec's fixed failure copy. | Extract the feed read out of the mount effect into a useCallback (setRows(null); setFailed(false); then the existing list/catch), call it from the effect, and render the failure branch throu |
| 14 | state | onboarding-team | At the seat allowance the Admin Team screen removes the "Invite an admin" button entirely, so a school that has filled its seats has no path to add anyone. | Render InviteButton unconditionally in the TeamList header (drop the `!atAllowance &&` guard at AdminTeamView.tsx:282) and keep the at-allowance card below it as the explanation, matching th |
| 15 | state | overview | The "Copy for board pack" action and its copied state are not built at all. | Restore the narrative card's footer row in src/components/admin/Overview/OverviewView.tsx, inside the non-early branch only (the frame does not draw it on the welcome variant). Add a divider |
| 16 | state | overview | The header's period control is missing — no period pill, and no term label on the date line. | Render the period pill at the right of the header row in OverviewView.tsx:180-187, and prefix the date line with the period, matching SCRUM-39 line 370.  1. Header row becomes a flex with sp |
| 17 | state | overview | A failure on one read blanks the whole dashboard; the spec requires per-card failure. | Give the audit read the same treatment as its three neighbours and let the page survive it.  1. `.catch(() => null)` on `schoolIntelligenceApi.complianceAudit()` at OverviewView.tsx:114, and |
| 18 | state | overview | The early-life zero treatment is not implemented: zeros render at full weight and the adaptation descriptor never changes. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Overview\OverviewView.tsx, make the snapshot tiles zero-aware in the early state only.  1. Add a small local he |
| 19 | state | overview | The snapshot tiles carry no "of N" denominator, which the spec sources from the enrolment band rather than from a row count. | Render a band-sourced `of N` on the enrolled-students tile, following the `adminSeatAllowance` precedent exactly.  1. Add a student-ceiling table beside `SEATS_BY_BAND` in `src/components/ad |
| 20 | state | senco | The draft reviewer has no way to leave a note, though the frame draws the control and the API carries the field twice. | Add an "Add a note" control to the draft block, matching the frame's copy and placement (a labelled action with a note glyph, sitting with the draft's edit affordances above the Save draft / |
| 21 | state | settings | Signing a device out fires immediately - no inline confirm, and the consequence copy is missing. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Settings\AccountSettings.tsx, add `const [asking, setAsking] = useState("")` alongside the other session state, |
| 22 | state | settings | The single-session state is not implemented - one session renders as a one-row list. | In src/components/admin/Settings/AccountSettings.tsx, derive the live set once and branch on it rather than on the raw array.  1. Near line 152, replace `const others = sessions.filter((s) = |
| 23 | state | settings | Editing a year-group label leaves the preset card still claiming Nigerian/British/American - the exact lie the spec forbids. | In SchoolSettings.tsx, have the year-group label input's onChange set preset to "custom" as well as updating labels. Add a fifth entry to the rendered preset list, { id: "custom", name: "Cus |
| 24 | state | settings | Only three taxonomy presets ship; the IB preset the spec names is absent. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Settings\SchoolSettings.tsx:  1. Add a fourth entry to `PRESETS` (line 78-82), after american:    `{ id: "ib",  |
| 25 | state | settings | The British and American preset maps are shifted one level against the spec's own stated mapping, and the preset cards show name lists rather than mappings. | In src/components/admin/Settings/SchoolSettings.tsx, realign BRITISH to the frame: n1 Nursery 1, n2 Nursery 2, kg1 Reception 1, kg2 Reception 2, p1-p6 Year 1-6, jss1-jss3 Year 7-9, ss1-ss3 Y |
| 26 | state | settings | Term dates get no overlap or gap validation, and Save is never gated on one. | In SchoolSettings.tsx, derive a per-term validity list from `terms` (a term whose end precedes its start; a term starting before the previous term ends; and a gap between one term's end and  |
| 27 | state | settings | Term rows have no half-term break fields at all. | In `C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\lib\api\school.ts`, replace the dead `halfTermBreak?: boolean` on `SchoolTerm` (line 170) with the spec's optional pair, in thi |
| 28 | state | shell | A signed-in admin's identity block shows neither their name nor their initials, on a justification the same docblock records as out of date. | In src/components/admin/Shell/AdminSidebar.tsx, call useCurrentUser() alongside the existing usePermissions()/useHasSession() hooks, then mirror the branch shape TeacherSidebar.tsx:363-395 a |
| 29 | state | shell | The sign-out confirm's primary button darkens on hover, which is D14's pressed state, and it has no pressed state of its own. | On C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Shell\AdminSignOutModal.tsx line 94, replace `transition-[filter] hover:brightness-93` with `transition-[filter |
| 30 | state | sso | The mapping-gap banner and the "Synced with one thing to finish" degraded sync state are not built at all, even though the data is already fetched and the IT home links here expressly to res | In src/components/admin/Sso/SsoView.tsx, take `const run = latestRun(history)` (latestRun is already imported) at the top of the connected branch.  1. Banner. When `run && run.missingTeacher |
| 31 | state | sso | The data-flow disclosure renders only half the section: the "What we never touch" group is absent, the two inner group headings are absent, the link out is absent, and the whole section disa | In src/components/admin/Sso/SsoView.tsx:  1. Lift the section out of the `{status && …}` gate at line 425 so it renders for a not-connected school. Derive a provider noun once: `const provid |
| 32 | state | sso | A school whose SSO status is `disconnected` gets the full connected page: a "Healthy" roster sync with a Sync now button, a sign-in URL, and a "Disconnect Microsoft 365" action for a provide | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Sso\SsoView.tsx, stop treating "a status record exists" as "a provider is live". Introduce one derived flag nex |
| 33 | state | sso | Copying the sign-in URL confirms in the wrong place and never clears, and a clipboard failure is silent. | In SsoView.tsx, stop routing the copy confirmation through the shared `notice`:  - Add a local `const [copyState, setCopyState] = useState<"idle" \| "copied" \| "manual">("idle")` and a ref  |
| 34 | state | sso | A connected school that has never synced reads "Healthy · Last synced never" instead of the spec'd waiting state, and `next_scheduled_sync_at` is fetched and never used. | In src/components/admin/Sso/SsoView.tsx, add a never-synced branch above the "Healthy" fallback in the status-word ladder (lines ~459-473): render "Waiting for the first sync" as the status  |
| 35 | state | sso | The provenance line above the reauthorise panel is missing, and the API gap behind it is not named anywhere. | Do not fabricate the line — there is nothing to render it from. Add a `TODO(api)` to the `SsoStatus` interface in src/lib/api/sso.ts (alongside the existing gap notes) requesting `connected_ |
| 36 | state | students | The withdrawn state on student detail never says access is paused or how restoration works, so an admin is left with no route at all. | In the withdrawn branch of the consent card (StudentDetailView.tsx, after the consentDetailLine paragraph around :284-292), add a second line carrying the spec's three propositions, rendered |
| 37 | state | students | A completed move gives no confirmation naming the destination class. | Add a `done` phase to MoveStudentSheet's Phase union and set it in the PATCH `.then` instead of calling `onMoved` there. In the done phase render the footer as the check badge (CheckIcon fro |
| 38 | state | students | Erasing a record returns to the Students tab silently - the specified confirmation line is not there. | Carry the erasure through the navigation and render one plain line above the roster. In StudentDetailView.tsx:571, replace `onErased={() => router.push("/admin/students")}` with a push that  |
| 39 | state | students | The roster has no consent filter, so the screen that exists to answer the consent question cannot be narrowed by it. | Add an "Any consent" filter as a third control in the filter row of C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Students\StudentsView.tsx (the row at lines 20 |
| 40 | state | teachers | A failed or still-in-flight staff read collapses the sheet into an unexplainable dead end: every select shows only the placeholder and the commit can never enable, with nothing on screen say | Give the staff read in RemoveAccessSheet.tsx the same treatment AssignTeacherSheet.tsx:95-128 already has, and distinguish the three cases the current code collapses into one:  1. Add `const |
| 41 | state | teachers | Removal completes with no confirmation of any kind - the sheet closes and the admin is returned to a list where the teacher is still present. | Add `"done"` to the `Phase` union in `RemoveAccessSheet.tsx:52` and hold the sheet open for it, matching the frame's third footer phase.  In `apply()` (line 111-112), replace the immediate ` |
| 42 | copy | billing | The empty invoice state says nothing is there yet instead of naming when the first invoice lands, which is the one thing the state is required to say. | In src\components\admin\Billing\BillingView.tsx, replace the empty-invoices branch (lines 261-269) so it answers the two questions the state exists to answer — how big the first bill is and  |
| 43 | copy | billing | The finance home promises a pricing schedule in Billing - 'See schedule' - that Billing does not contain and the API cannot source. | In `C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\FinanceHome\financeHomeRows.ts`, in the `rate-lock` row (lines ~97-110), stop pointing at a screen that has no |
| 44 | copy | classes | The SSO-sourced source line names neither the provider nor the last sync time, and the file's own docblock says the old backend excuse for that is wrong. | Accept the proposed fix. In `C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Classes\ClassesView.tsx`: when `ssoSourced` is true, fetch `ssoApi.status()` (fire it |
| 45 | copy | classes | The remove-from-class confirm drops the spec's fixed reassurance that the teacher's notes stay with the school and replaces it with a different claim about the students. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Classes\ClassDetailView.tsx around line 335, keep the first sentence and its last-teacher clause and replace th |
| 46 | copy | classes | The primary-conflict notice states the demotion but drops the spec's reassurance that the incumbent keeps the class and her notes. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Classes\AssignTeacherSheet.tsx, extend the notice at line 311-315 so the second sentence carries the retention  |
| 47 | copy | onboarding-team | The invite-failure message blames the admin's input and does not say their typed values and chosen scopes are preserved. | In src/components/admin/Team/AdminTeamView.tsx, replace the catch-block string at lines 405-408 with the lane's house shape - system owns the fault, no blame, preservation stated: "That didn |
| 48 | copy | onboarding-team | The two SSO cards on the sign-in-method step carry identical descriptions, and neither is the frame's wording. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Onboarding\AuthMethodStep.tsx, replace the three OPTIONS `desc` strings with D01's `auth` array values verbatim |
| 49 | copy | overview | The snapshot heading claims a half-term the figures do not cover, and contradicts its own card descriptor. | Take the period-neutral option, not the `dateFrom` option. Scoping `adaptationLog` with a half-term boundary would fix one of the five figures; `audit.studentsProfiled`, `counts.classes`, `c |
| 50 | copy | senco | The finalised report never names the member of staff who finalised it, which is the attestation the whole screen exists to produce. | In the FINAL block of C:/Users/theol/Documents/work/NEVO FULL/nevo-2.0-admin/src/components/admin/Senco/IepExporterView.tsx (lines 443-453), name the reviewer, guarded on identity. Add `cons |
| 51 | copy | settings | The retention section never states the erasure distinction, which SCRUM-99 makes a done-when. | Add the VS ERASURE sentence verbatim as a third line in the retention section of C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Settings\SchoolSettings.tsx, dire |
| 52 | copy | shell | The "Admin" badge the frame draws beside the wordmark is not rendered at all. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Shell\AdminSidebar.tsx, inside the expanded branch of the logo row (the `expanded ? (...)` arm at lines 227-238 |
| 53 | copy | sso | "Not in use." has moved from the unused card's description into a pill, so it shows on every non-active provider card - including both cards of a school that has nothing connected and is bei | In src/components/admin/Sso/SsoView.tsx, restore the third description string and drop the "off" pill. (1) At :337-342 make the description three-way: active -> "Staff and students sign in w |
| 54 | copy | students | The roster's footer line is missing entirely - the one place the product explains where parent accounts come from. | Render the footer under the table card in `src/components/admin/Students/StudentsView.tsx`, inside the `phase === "ready" && (students.length > 0 \|\| filtering)` fragment, immediately after |
| 55 | copy | students | The move sheet's second effect line tells the admin the old teachers lose sight of the student, where the spec's line reassures them the notes they wrote are kept. | In C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Students\MoveStudentSheet.tsx, replace the second effect line (lines 151-155) with the retention fact the spec  |
| 56 | layout | classes | The classes table's tablet treatment is keyed to a breakpoint that never fires at 1024x768, and inside that block the header keeps desktop side padding while the rows drop to 18px, so the co | Two changes, one lane-owned and one console-wide. Lane-owned, do this here: at ClassesView.tsx:297 add the tablet padding the frame draws on headRowT so the labels track their columns - appe |
| 57 | layout | invitations | The join-link landing carries no Nevo mark, on the one page in this lane a stranger opens from a link in a message. | In src/components/admin/Invitations/JoinLanding.tsx, render the wordmark once ABOVE the max-w-[420px] panel and OUTSIDE the phase branches, so it is present in loading, valid, expired and in |
| 58 | layout | notifications | At 1024x768 the preferences grid renders in its desktop two-column form, not the stacked tablet form the frame draws, because the tablet styles in this lane are gated at <1024px while the co | Switch the tablet variants in this lane from max-lg: to max-xl: so they engage below 1280px, matching AdminSidebar's own (min-width: 1280px) rail boundary and the xl: padding switch already  |
| 59 | layout | notifications | The panel's empty state dropped the bell-circle mark the spec says verbatim to keep. | In the `rows.length === 0` branch of `C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Notifications\NotificationsPanel.tsx` (lines 139-148), restore the mark abov |
| 60 | layout | onboarding-team | The final onboarding step has no confirmation mark - the one moment of warmth in the flow is missing from both the manual and the SSO variant. | Render the confirmation mark above StepHeading in BOTH HandoverStep branches (before the SSO return at :95 and the manual return at :172), reusing the house one-shot exactly as at Auth/Admin |
| 61 | layout | onboarding-team | The invite flow replaces the whole page instead of opening the docked sheet over the team list. | Keep TeamList mounted and render InvitePanel inside the existing Sheet primitive rather than returning early. Concretely, in src/components/admin/Team/AdminTeamView.tsx remove the `if (invit |
| 62 | layout | onboarding-team | At the drawn tablet size the onboarding wizard applies its desktop layout, so the tablet-only treatments never appear at 1024x768. | Move this wizard's tablet boundary above 1024, matching the convention AdminSidebar already set at 1280:  - OnboardingWizard.tsx:71 - change `lg:justify-center lg:py-12` to `xl:justify-cente |
| 63 | layout | onboarding-team | Neither the wizard nor the admin sign-in screen shows the Nevo wordmark the frames put on every state. | Render the existing /brand/logo-wordmark-purple.png on both pre-shell surfaces, using the frames' crop (62x18 overflow window over the 181x181 source, as AdminSidebar.tsx:232 and TeacherSign |
| 64 | layout | onboarding-team | The navy primary button darkens on hover, which is the pressed treatment, not the hover one. | In this lane, change `hover:brightness-93` to `hover:brightness-110` on the five navy primaries: src/components/admin/Auth/AdminSignIn.tsx:279, and src/components/admin/Team/AdminTeamView.ts |
| 65 | layout | overview | The snapshot tiles never form the single row the frame draws at 1440. | Add a desktop column step to the snapshot grid at src/components/admin/Overview/OverviewView.tsx:317 so the tiles form the spec's single row at 1440 while the existing 2 x 2 holds at 1024. O |
| 66 | layout | overview | Snapshot numerals are near-black where the frame and spec specify navy. | Swap the five snapshot numerals in src/components/admin/Overview/OverviewView.tsx — lines 319, 330, 349, 363 and 377 — from `text-nevo-near-black` to `text-nevo-navy`, leaving the surroundin |
| 67 | layout | senco | The learner-profile list has no year-group filter, only search and class. | Add a second control beside the class select in the filter row at SencoView.tsx:488-529: a `year` state string, a `<select>` over the distinct `yearGroup` values of `classes` rendered with ` |
| 68 | layout | senco | Nothing in the profile list marks the learners who have an open flag, though the frame draws that dot and the flags are already in the same component's state. | In the profiles branch of SencoView.tsx (the row at lines 574-583), render a small violet dot beside the learner's name when openFlags.some((f) => f.studentId === s.id) - an 8px rounded span |
| 69 | layout | senco | The Learning Support empty state drops the frame's illustration, unlike every sibling admin list. | Copy nevo-design-outputs/admin/uploads/illustration-empty-outcomes.png into nevo-2.0-admin/public/illustrations as empty-admin-outcomes.png (matching the empty-admin-* naming the other three |
| 70 | layout | shell | At 1024x768 the whole rail scrolls instead of the nav list, so the Notifications row, the Collapse chevron and the account/sign-out block fall below the fold. | Move the scroller to match the frame's rail-hidden / list-scrolls split, in src/components/admin/Shell/AdminSidebar.tsx:  1. Line 208 — drop overflow-y-auto from the aside: "flex h-full shri |
| 71 | layout | students | Student detail has no consent pill in the header row and no "View record" link on the consent card, although the consent record they were removed for is now built. | In StudentDetailView.tsx, put a consent pill at the right of the header row alongside the existing Deactivated pill (after the name/class block, around line 190-205), fed from student.consen |
| 72 | layout | teachers | The tablet row treatment is keyed to a width the admin console never uses as its tablet size, so at 1024x768 the desktop grid renders instead of the tablet layout the frame draws. | Re-key the tablet treatment in `C:\Users\theol\Documents\work\NEVO FULL\nevo-2.0-admin\src\components\admin\Teachers\TeachersView.tsx` from `max-lg:` to `max-xl:`, so the row shape lines up  |
| 73 | layout | teachers | On the tablet row the Classes cell is hidden with nothing put in its place, so how much a teacher is teaching - the screen's whole subject - disappears at that breakpoint. | Mirror ClassesView in TeachersView.tsx. Inside the name block (after the `{t.name}` span, around lines 209-219), add a tablet-only class-load line and hide the email at that breakpoint, so t |
| 74 | layout | teachers | The empty state sits directly under the heading instead of centred in the content area, because the centring classes are inert. | The proposed fix is directionally right but incomplete: the height chain has TWO block wrappers, not one, so patching only the page wrapper still leaves `flex-1` inert. Pass a definite heigh |

## Per lane

| lane | raw | confirmed |
|---|---|---|
| overview | 8 | 8 |
| classes | 6 | 6 |
| teachers | 7 | 5 |
| students | 12 | 7 |
| senco | 6 | 6 |
| sso | 10 | 7 |
| billing | 4 | 3 |
| settings | 15 | 8 |
| invitations | 6 | 4 |
| notifications | 5 | 5 |
| onboarding-team | 8 | 8 |
| intelligence | 3 | 3 |
| shell | 6 | 4 |
