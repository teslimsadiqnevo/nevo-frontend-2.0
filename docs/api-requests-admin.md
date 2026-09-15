# Three shapes, as asked — 15 September 2026

You asked for the four Settings sections, what assignment history contains, and
what SENCo active support returns. Here they are.

These were drafted and then adversarially reviewed against the deployed
document; the review killed a fair amount, including one draft that inverted a
locked SCRUM-99 ruling. What follows is what survived.

**Send-order suggestion, cheapest first:** SENCo active support → assignment
history → Settings part one → Settings part two (needs design first).

---

## 0 · Two corrections back to us first

**The profile avatar is already built and we simply are not consuming it.**
`POST /api/v1/users/me/profile-photo` exists and `ProfilePatch.profileImageUrl`
exists; nothing in our tree touches either. Our gap, not yours — struck from
the Settings ask below.

**Two things from today's six that are worth a line in the schema**, in the same
spirit as documenting `vatRate` so the question cannot come round a third time:

1. **The consent 403s are invisible to the contract.** The four processing
   endpoints declare only their success code and 422, and `consent_withdrawn`
   appears **zero times** in the whole document. The enforcement is yours and I
   believe it works — but a generated client cannot see it, our contract-check
   cannot see it, and nothing tells the next person that a 403 from
   `POST /lessons/{id}/session` means "show the account-on-pause screen" rather
   than "you lack permission". One `403` response with the error code in its
   description would fix that permanently.
2. **`LessonDetailResponse` calls it `recap`; the student player reads
   `lesson.summary`.** Both fields are optional, so nothing throws — the
   "See summary" affordance just never appears. That is the student session's
   to wire, and they should know the name differs before they go looking for a
   field that is not coming.

---

## 1 · SENCo active support

The last of D8b's three per-learner figures. The other two are built. This one
still costs one call per learner, because
`GET /api/intelligence/accommodations/{student_id}` takes no student list — at
247 profiles that is 247 requests to paint a list, which is why it is not built.

### `GET /api/intelligence/accommodations` — a collection sibling

School-scoped by token. The item route and `AccommodationAnalysisResponse` do
not change.

**Mirror `GET /api/v1/students`, not `/api/intelligence/flags`.** That read
already fetches this same population for this same screen and is **unpaged** —
bare array, no limit, no offset. Three fields across 247 rows is a few KB, and
the cost here is per-learner analysis, which paging multiplies into five round
trips rather than reducing. Mirroring it kills the ordering, envelope and header
questions at once.

*If you would rather page it,* then two things become MUST: a documented stable
order (`studentId` ascending is enough) and a **body** envelope
`{ profiles, total, limit, offset, hasMore }` — which invents nothing,
`{items,total,limit,offset}` is already `AdaptationEventLogResponse` and
`ParentRightLogResponse`, and `hasMore` is already on
`NotificationListResponse`. Headers would need a `responses.200.headers`
declaration plus a proxy-allowlist and client change, so please price that
before choosing them.

**Row — three fields:**

| field | type | required | for |
|---|---|---|---|
| `studentId` | uuid | ✅ | join key; matches `StudentSummaryResponse.id` |
| `activeAccommodations` | `AccommodationType[]` | ✅, `[]` never null | the list figure. Same name and same existing enum as `AccommodationAnalysisResponse` |
| `status` | `observed \| not_observed_yet` | ✅ | see below |

**`classId`** as an optional query param is NICE TO HAVE only — D8b filters
client-side from a class map it already holds, and the default view needs the
whole school anyway.

**On `status`, honestly:** it duplicates `ClassStudentResponse.profileStatus`,
which we already receive per class. We want it here anyway for two reasons — a
learner in **no class** never appears on any roster read, and a class roster
read can **fail on its own** (the screen already tracks that), in which case the
roster's answer is missing exactly when we need it. If that is not worth a
column to you, drop it and we will take `profileStatus` and accept those two
gaps.

**What we are NOT asking for, and why.** No severity, no rationale, no
free-text, no scores, no engine parameters, no "needs" of any kind. An
accommodation is what Nevo is *doing* for a learner, which is permitted. Any
field describing what the learner *is* would be a diagnostic label about a
child, and this console must never hold one. The list figure D8b draws is a
count and a short label, nothing more.

---

## 2 · Assignment history

SCRUM-40, verbatim: *"Assignment history is a collapsed section on both class
and teacher detail: date, teacher, class, role, and who made the change. Plain
rows, monospace dates. Read-only."* Its done-criterion requires the log to be
**append-only** and to **show who made each change**.

**What already works:** `AssignedTeacherResponse` and `AssignedClassResponse`
both carry `role` and `assigned_at`, so a dated *current*-assignment list is
built and shipping. What is missing is an **actor** and **endings**.

### `GET /api/v1/teacher-class-assignments/history?classId=&teacherId=&limit=&offset=`

**Not `assignments/history`**, which SCRUM-40's data line suggests:
`/api/v1/assignments` is the learning-product lesson-assignment resource and
would collide. This belongs on the teacher-class-assignments router.

Query params **camelCase** to match every other filter endpoint including
`/consents/rights-log`, whose envelope this copies. The response **body stays
snake_case** to match `AssignedTeacherResponse` in the same router. Both are
deliberate; neither should be normalised into the other later.

**One row per EVENT, not per span** — that is what append-only means, and it is
how a removal "writes a history row; it never edits the old record."

| field | type | required | notes |
|---|---|---|---|
| `id` | uuid | ✅ | |
| `assignment_id` | uuid | ✅ | ties the pair of events together |
| `event` | `assigned \| role_changed \| ended` | ✅ | new enum — `AssignmentStatus` is the lesson lane's and would collide |
| `occurred_at` | date-time | ✅ | |
| `class_id` | uuid | ✅ | |
| `class_name_at_time` | string | ✅ | non-null on `AssignedClassResponse`, so no mismatch |
| `teacher_id` | uuid | ✅ | the row's subject |
| `teacher_first_name_at_time` | string \| null | ✅ key | |
| `teacher_last_name_at_time` | string \| null | ✅ key | |
| `teacher_email_at_time` | string \| null | ✅ key | |
| `role` | `TeacherAssignmentRole` | ✅ | existing enum |
| `actor_id` | uuid \| null | ✅ key | |
| `actor_name_at_time` | string \| null | ✅ key | |
| `actor_kind` | `person \| roster_sync \| system` | ✅ | see below |
| `actor_recorded` | boolean | ✅ | why a name is null |

**Names are snapshots.** SCRUM-40: *"Renaming a class does not alter history:
assignment records keep the name they carried at the time."* The three teacher
name fields mirror `AssignedTeacherResponse` exactly so the history row runs the
same first+last → email → fallback the rows above it already run, and the same
teacher never renders two ways on one screen.

**`actor_kind` exists because a roster sync is not a person.** You already have
a `roster-sync` assignment endpoint, and "who made this change" has no honest
answer for it. `roster_sync` lets the row say *"by the Microsoft directory
sync"* rather than inventing a name or leaving a blank that reads as missing
data.

**No backfill.** Instead, one envelope field:

| field | type | required | for |
|---|---|---|---|
| `history_begins_at` | date-time | ✅ | when this log started recording |

The section then renders *"This record starts 15 September 2026"* beneath the
rows, and SCRUM-40's empty state *"No changes yet."* becomes a **true**
statement rather than a claim that nothing ever happened. This deletes a
migration and stops the API asserting events nobody observed.

---

## 3 · The four Settings sections — **part one only**

Part two needs design answers before it is worth your time. Sending what is
ready.

### 3a · Role title — one nullable column

`ProfilePatch` gains `roleTitle: string | null`, and `CurrentUserResponse`
returns it. **Name it `roleTitle`, camelCase**, matching the `profileImageUrl`
precedent on that same schema — `CurrentUserResponse` is otherwise snake_case,
so without saying this you will reasonably ship `role_title` and the console
will read `undefined`.

### 3b · Type the `profile` blob

Same treatment you just gave `academicConfig`, for the same reason. The console
invented `contactEmail`, `contactPhone` and `location`, and nothing validates
them. While you are there, the remaining `academicConfig` keys we invented —
`yearStart`, `yearEnd`, `terms`, `yearGroupLabels`, `taxonomyPreset` — want the
same, and the calendar ones matter twice over because your own promotion logic
will need those dates.

### 3c · School address

`PostalAddress`, extracted from the one already inside `BillingContactRequest`
rather than a second shape. Keep `region`.

Justified on the **DPA**, not on invoicing — `BillingContactRequest` already
carries a full invoicing address written from D11b. Please say which is the
address of record if they can differ.

### 3d · Email change — a pair, not a PATCH

Email is an authentication identifier, so a silent `PATCH` is wrong.

- `POST /api/v1/users/me/email-change/request` — `{ newEmail, currentPassword? }`
- `POST /api/v1/users/me/email-change/complete` — `{ token }`, **unauthenticated**
  (`security: []`, exactly like `password-reset/complete`), returning a plain
  receipt rather than `CurrentUserResponse`; the console refetches `/users/me`.
- `CurrentUserResponse` gains `pendingEmail: string | null`, so the screen can
  say *"waiting for you to confirm from that address"* rather than showing the
  old address as though nothing is happening.

`currentPassword` must be optional or absent for SSO accounts — either tell us
how the server identifies one, or accept step-up through the existing
`POST /api/v1/admin/sso/reauthorise`.

### 3e · Cut from this round

- **The logo.** D12 draws none and says *"no white-label controls in v1"*, while
  SCRUM-99's ticket says the logo appears on student and teacher surfaces. That
  is design's to settle before you build an upload endpoint.
- **Language.** Nothing is written at all — D12c renders it as explanatory copy
  (*"English is the only language available today"*). No endpoint needed.

### 3f · Part two — held, and what it needs

**Two-step sign-in (D12.8)** and **promotion (D12.4b)** both need design
answers first.

One thing to fix in advance, because our own draft got it wrong: promotion's
**leaving cohort defaults to KEEP ACTIVE, not deactivate.** SCRUM-99 settled it
on 26 July — *"Leaving cohort at promotion: never automatic… Default is keep
active. Admin decides."* Our draft proposed the opposite and attributed it to
design; it was wrong, and I would rather tell you that than have you build it.

When it comes, promotion needs a **preview → commit** pair where the commit
quotes a `previewId` that doubles as the idempotency key, a `202` returning the
`{runId, status, pollUrl}` shape you already use for roster sync, and a
server-owned `undoAvailableUntil` — the seven days must not be a client-side
`committedAt + 7`, because that is how a screen promises an undo the server has
already dropped.

And the "why can't this student be promoted" reasons must be an **enum**, never
free text — for the same reason you left `reasonRecorded` out of the rights log.
"Repeating this year at his parents' request" is a family circumstance about a
named child in front of every admin who opens the page.
