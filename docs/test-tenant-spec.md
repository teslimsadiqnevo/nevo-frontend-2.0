# What the E2E tenant needs in it — 14 September 2026

The E2E school currently holds **no students**, because `POST /api/v1/students`
returns 500. Every admin screen has therefore only ever been seen in its empty
state, which is the one state where a counting bug cannot show itself.

This is a request for a seeded tenant, and the shapes below are not arbitrary.
Each one exercises a code path that unit tests cover with mocks and that nothing
has ever run against a real backend.

**If `POST /api/v1/students` can be fixed, that is by far the cheapest route.**
Otherwise seeding means driving the invitation + join flow per child.

---

## Why a "normal-looking" tenant is not enough

A tenant with 30 tidy students would render every screen and prove almost
nothing. The bugs this console has actually shipped were all in the gap between
*a number* and *the right number*:

- a count that silently capped at a page boundary
- a count of FLAGS rendered under the word "students"
- an absent value rendered as a zero
- a partial read rendered as a total

None of those is visible unless the data crosses the boundary that triggers
them. So the asks below are mostly about **thresholds and mixtures**.

---

## 1 · Students — a mixture of consent states, not a uniform one

Aim for ~40 students spanning **all four** consent states:

| state | how many | why |
|---|---|---|
| `confirmed` | ~20 | the ordinary case |
| `pending` | ~8 | drives the Overview roll-up's "waiting on parent consent" |
| `not_sent` | ~8 | must NOT appear in that row — it is a different claim |
| `withdrawn` | ~3 | the only state that stops processing (SCRUM-80) |
| consent object **absent** | ~1 if possible | "unknown" must not render as "nobody asked" |

**The point of the mixture:** `withoutRecordedConsent` (everything but
confirmed) and `withdrawnCount` (withdrawn only) must come out as *different
numbers*. On a uniform tenant they coincide and a conflation bug is invisible.

The NDPA compliance screen's coverage row also refuses to show a figure if ANY
student came back without a consent record — the last row above tests that.

## 2 · Attention flags — at least one child with two

For the Learning Support surfaces and the Overview roll-up:

- **~12 flags across ~8 students**, so at least two children carry more than one.
- a **mix of acknowledged and not**.

**Why:** the Overview row says "N students have a flag nobody has marked as
seen". That is a count of *children*, deduplicated by student. If every child
has exactly one flag, a bug that counts flags instead of children produces the
same number and ships.

**If you can reach 200+ flags in total, please do.** `GET /api/intelligence/flags`
caps `limit` at 200, and the paging loop past that boundary has never run
against a real backend.

## 3 · Adaptation log — more than 100 events in a seven-day window

This is the most important threshold on the list.

`GET /api/admin/adaptation-log` caps `limit` at 100. The SENCo screen's
"adaptations this week" pages until it sees a short page. **On an empty or small
tenant the first page is always short, so the multi-page path exits immediately
and has never executed against a real backend.**

- **~250 adaptation events inside the last 7 days**, across ~15 students
- spread over several days, not all at one timestamp

That forces three pages and exercises both the paging loop and the
deduplication.

## 4 · Classes — several, and not all tidy

~8 classes, including:

- one **archived** (archive is reversible and must not read as deleted)
- one with **no teacher assigned** (the "No teacher yet" state)
- one with a **primary and a co-teacher**
- one with **only a primary**
- varied `assigned_at` dates, some months apart — the assignment dates now
  render on both class and teacher detail

Roster observations matter too: some learners with a `completed_lessons`
observation carrying a count, **at least one with the count null**, and at least
one with no observations at all. Absent must render as nothing, never as zero.

## 5 · Teachers — three shapes

- one teacher holding **4+ classes** (drives the removal-forces-reassignment flow)
- one **invited but not joined**
- one **SSO-sourced**, if the provider is connected

## 6 · SSO — connected, with a failed run that has issues

- a **connected provider** with `last_successful_sync_at` set
- **several sync runs** in history, including at least one `failed` or
  `partial_manual_review` carrying a non-empty `issues[]`
- ideally a run with `missingTeacherClassMappings > 0`

**Why:** the "View technical details" panel only appears when a run has issues
or a failure reason. With a clean history it never renders, and neither does the
IT Admin Home's "accounts couldn't be matched" row.

## 7 · Billing — an invoice and a card

- at least one **issued, unpaid** invoice with a due date
- at least one **paid** invoice
- a **payment method on file**
- `contractStart` and `contractEnd` set

This is what the Finance Home reads. Also: a real invoice lets us confirm the
PDF download now works — the proxy was corrupting every PDF until today, so
invoice downloads have been broken and nobody would necessarily have noticed.

## 8 · Compliance — ideally a non-zero scan

If it can be arranged safely in a test tenant, **one or two findings** so the
non-zero state renders. The zero state is the expected reading forever and is
well covered; the non-zero hero has never been seen with real data.

Not essential, and not worth contriving if it means putting a clinical term in a
database.

---

## What this does NOT need

No real children, no real names, no real parent contacts. Every figure this
console renders is an aggregate or a state; nothing depends on the data being
plausible as people. Synthetic names are fine and preferable.

---

## The one question back

Is `POST /api/v1/students` fixable? It returns 500 on valid input and has been
raised since 8 September. Enrolment itself goes through invitations, so this is
not a missing door for schools — but it is the difference between seeding a
tenant in a script and driving a join flow forty times.
