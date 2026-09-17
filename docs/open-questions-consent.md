> **For what is still outstanding with counsel, read
> [`docs/waiting-on-counsel.md`](./waiting-on-counsel.md).** This file is the
> chronological record — questions asked, answers received, rulings applied — and
> two of its counsel questions have since come back. You cannot see the open set
> from here without reading all of it and cancelling the answered items in your
> head. That file is the register; update it when an answer lands.

# Two consent questions, 11 September 2026

Both came out of correcting the admin console, which had been telling schools
that a child could not begin lessons until a parent confirmed consent. That was
wrong — SCRUM-80 (7 Sep) ruled that the school warrants consent through the DSA,
so an unconfirmed consent is the school's administrative task and the learner
proceeds; only an explicit **withdrawal** stops processing.

Fixing the eight places that said otherwise surfaced two things the frontend
cannot settle on its own.

---

## 1 · For counsel — DPA clause 5 contradicts the SCRUM-80 ruling

**The clause, as schools currently accept it:**

> **5. Parental consent.** Where a learner is a minor, the School is responsible
> for obtaining parental or guardian consent before that learner begins. Nevo
> provides the mechanism to request and record it, **and will not activate a
> learner whose consent has not been confirmed.**

**The problem is the final clause.** SCRUM-80 ruled that Nevo does not gate on
consent: `not_sent` and `pending` are the school's paperwork and the child
proceeds. The product is built to that ruling. So the DPA promises a behaviour
the product deliberately does not implement.

**Why this is not just wording.** The school *formally accepts* this document
during onboarding. `POST /api/v1/school/dpa-acceptance` records the document
version, the accepting administrator and the timestamp, and the NDPA compliance
screen (D22) then cites that acceptance as evidence of the school's position. So
it is a contractual term, attributed to a named person, displayed back as proof.

**A second signal that it reads as settled:** clauses 6 and 7 carry explicit
`[Placeholder: … to be confirmed by counsel]` markers. Clause 5 does not.

**The question:**

> Which is correct — the clause or the ruling?
>
> - If the **ruling** is correct, clause 5 needs redrafting. The honest version
>   is something like: *"Nevo provides the mechanism to request and record
>   consent, and records each learner's consent state for the School's
>   compliance record."* — dropping the activation promise entirely.
> - If the **clause** is correct, then SCRUM-80 needs revisiting and the product
>   has to actually gate on consent, which is a backend change and a significant
>   one: it would block learners mid-term the moment a consent lapses.

**What we have NOT done:** changed the text. Silently rewording a term a school
has already accepted would be worse than the inconsistency. It sits exactly as
counsel last had it, with a conflict note above it in the source.

**Where it lives:** `src/lib/mocks/dpa.ts`, clause 5 — rendered by the
onboarding DPA step and accepted from there.

---

## 2 · For backend — is withdrawal actually enforced?

**What a parent is told.** On the parent data-management screen, withdrawing
consent says:

> *"This will immediately suspend {child}'s access to Nevo. They will not be
> able to use the platform until consent is restored through your school."*

**What the frontend does about it: nothing.** `processingWithdrawn()` exists in
`src/lib/api/consents.ts` and is documented as "the only consent question the
frontend is entitled to act on" — but it has **no production callers**, only
tests. `myConsentGate()` has no callers at all. Nothing on our side checks a
withdrawal or blocks anything as a result.

**Why we think you might already handle it.** `ConsentGateResponse` carries
`granted` and `blocked` as two *separate* required booleans, which reads like a
deliberate distinction: `granted: false, blocked: false` is precisely the
"school hasn't filed the paperwork, child proceeds" case, and `blocked: true`
would be the withdrawal case. That suggests enforcement is server-side — but we
have inferred that from a field name, not confirmed it.

**The questions:**

1. When a parent withdraws consent, does the backend stop processing for that
   learner — refusing lesson sessions, adaptation and signal capture?
2. Is `ConsentGateResponse.blocked` the field that reports it, and is it
   authoritative? Is it set by anything other than a withdrawal?
3. Is the suspension **immediate**, as the parent is told, or does it apply from
   the next session?

**Why it matters:** if the answer to (1) is no, then a parent has been promised
an immediate suspension that nothing performs, on the most sensitive action in
the product. That is a defect wherever it lives, and we would rather find it in
a reply than in an incident.

**If enforcement is server-side and confirmed**, we would still like to render
it: a withdrawn learner currently sees nothing different, and BUILD_STATUS
carries the open design question of what they *should* see.

---

## Context, if useful

The ruling is recorded in `src/lib/api/consents.ts`:

> not_sent → proceed · pending → proceed · confirmed → proceed · **withdrawn → STOP**

Three of the four states are `granted: false`, which is exactly why reading
`granted` alone cannot implement the ruling — `status` is the field that matters.
The admin console's bug was that it read "not confirmed" as "blocked", in eight
places, including one that named an individual child.

---

# Addendum — the NDPA findings list, 14 September 2026

Counsel cleared the compliance screen with four rules: show the category in
plain language, never the `term`, never the `recordId`, and no student
assessment data. Three of the four were already satisfied and the fourth cannot
be built. Details below, with what backend would need to add.

## What changed in code today

- **`term` and `recordId` are stripped at the API boundary**, not merely left
  unrendered, so they never enter React state. Rebuilt field by field rather
  than destructured-and-rested, so a new identifying field the backend adds
  later cannot ride in by default. Mutation-verified.
- **The PDF export is held** behind a constant — see below.
- The findings card no longer says "your data officer should look at these",
  which pointed at a list that is not on screen and now never will be.

## 1 · For counsel — the category you cleared does not exist

`ComplianceFindingResponse` is `{table, recordId, field, term}`, all four
required. **There is no category field, no date, and no resolved status.**

Rules 2 and 3 remove `term` and `recordId`. What remains is `table` and `field`
— database locators, e.g. table `student_profiles`, field `notes`. They are not
NDPA categories and nothing in the contract maps them to one.

So "category and status only" leaves this screen with **nothing to show per
finding**. It can honestly show a count, which is what it has always shown.

**The deeper mismatch.** The updated D22b frame draws rows categorised
"Parental consent", "Data subject request" and "Consent withdrawal", each with
a date and a Pending/Resolved chip. Those are **data-subject rights events** —
they match `ParentRightType` (`request_data | object | withdraw_consent`), not
this endpoint. `GET /api/admin/compliance-audit` is a **diagnostic-label scan**:
it reports where in the data model a clinical term was found, which is why its
findings are shaped table/field/term/recordId.

The frame and the endpoint are describing two different features. Worth
confirming which one counsel actually reviewed.

## 2 · For counsel — the PDF export is outside the ruling, and is now held

The screen offers "Export report (PDF)", composed by **backend**. Its 200 has an
empty schema, so the contract constrains nothing, and the obvious contents of a
compliance report are exactly the two fields we were told to withhold. A rule
kept on screen and broken by a download is not kept.

It is disabled behind `EXPORT_CLEARED_BY_COUNSEL = false` in `ComplianceView`.
Nothing of value was lost: it had been arriving corrupt anyway (see below).

**The question:** does `report.pdf` contain the flagged term or the record
identifier? If it does, either it is regenerated without them or the button
stays off.

## 3 · For counsel — two claims on this screen that may breach rule 4

Rule 4 says nothing about how a student performed or what the engine observed.
The screen itself is clear — it renders only `diagnosticLabelsStored`, a count
of things that should not exist. But two **claim rows** assert things worth a
second look:

- *"Nothing about how a learner performed is written to long-term storage"* and
  *"Learning signals, being ephemeral, have no retention period at all."*
  `GET /api/admin/adaptation-log` returns rows carrying `studentFirstName`,
  `trigger`, `adaptation` and `timestamp`, filterable by `studentId` and date.
  Whether that is "how a learner performed" is counsel's call, but the sentence
  should not ship again unexamined.
- The **right-to-erasure** row. The nearest real mechanism is
  `DELETE /api/v1/students/{student_id}` ("Anonymize Student"), which only an
  administrator can invoke; `ParentRightType` has no erasure value, and the
  string "erasure" appears **zero times** in the entire contract.

## 4 · For backend — what the frame needs

To build D22b as drawn, the admin-facing findings response needs:

- a **category** on each finding, from a closed enum, in the NDPA vocabulary the
  frame uses — not a table/column locator;
- an **occurredAt** per finding (today only the whole scan has `generatedAt`,
  identical for every row);
- a **resolved/pending** state per finding, and something that sets it;
- and, ideally, **`term` and `recordId` removed from the admin response
  entirely**, rather than sent and declined by the client. The safest version of
  counsel's rule is one where the data never crosses the wire.

A read endpoint for the rights log would cover most of this:
`POST /api/v1/parent/{token}/rights` mints a `requestId` and **nothing anywhere
reads one back** — `ParentRightResponse` is referenced by exactly that one
operation in the whole spec.

## 5 · For backend — the proxy was corrupting every PDF (fixed)

`src/app/api/backend/[...path]/route.ts` read the upstream response with
`await upstream.text()`, decoding binary as UTF-8 and re-encoding it. The file's
own comment, four lines above, says that would corrupt the file — the REQUEST
direction had been fixed to use an ArrayBuffer and the RESPONSE direction had
not.

Everything binary that fetches through `/api/backend` (the default base URL)
arrived mangled: the NDPA compliance PDF **and every billing invoice PDF**. Now
passes bytes through. Worth knowing if anyone reported invoices that would not
open.

---

# Rulings — 14 September 2026

Design and counsel came back. Recorded here because several reverse earlier
decisions, and the reasons matter more than the outcomes.

## The category ruling was applied to the wrong feature

Confirmed: the diagnostic-label scan and D22b are two different features, and
the ruling was written while picturing the frame. That is now untangled.

## 1 · DPA clause 5 — WITH COUNSEL, do not build either way

Back to Oladayo. **Two readings, and they lead opposite ways:**

- We are a PROCESSOR, and the clause just needs redrafting. SCRUM-80 stands.
- We are a CONTROLLER for the adaptation engine, and the gate is deliberate.
  **If so, SCRUM-80 REVERSES and the admin consent trigger becomes a launch
  blocker.**

The clause text stays untouched, and nothing is built in either direction until
he answers. Note what this means: the consent-gate correction shipped across the
admin console on 11 Sep assumed the first reading. If the second is right, that
work inverts — it is not wasted, but it is not final either.

## 2 · The scan is NOT an admin-facing list — BUILT

Design's ruling, and it reverses a PR's worth of work in the right direction:
once `term` and `recordId` are gone, a finding is a database locator.
`student_profiles` / `notes` tells an administrator nothing and gives them
nothing to act on. It is an internal Zero-Tag enforcement tool.

On the admin surface it is now **one aggregate line**: when the last scan ran,
and whether it came back clean. Anything found is ours to handle, not the
school's to read. The per-finding row is gone entirely.

The boundary strip in `schoolIntelligence.ts` stays regardless — the forbidden
fields never enter React state, which is cheap insurance whatever is displayed.

## 3 · D22b stays as drawn — WITH COUNSEL, do not build

Its categories are genuine NDPA categories. Oladayo is being asked to confirm
that parental consent, data subject request and consent withdrawal — shown with
dates and status, no learner identified — is cleared.

**Still blocked on backend regardless:** there is no read endpoint for any of
it. `POST /api/v1/parent/{token}/rights` mints a `requestId` and nothing reads
one back; `ParentRightResponse` is referenced by exactly that one operation in
the whole spec.

## 4 · Both claim rows PULLED — DONE

Design: "a compliance screen making a false statement is worse than a missing
screen." Both are absent, with the reasoning in place and tests that fail if
either returns.

- **Ephemeral processing.** Said "nothing about how a learner performed is
  written to long-term storage". The adaptation log returns `studentFirstName`
  with `trigger` and `timestamp`, filterable by student. THE SENTENCE CHANGES,
  NOT THE LOG — the log is a real capability and an audit trail.
- **Right to erasure.** Described a right a parent cannot exercise.
  `ParentRightType` has no erasure value and the word appears nowhere in the
  contract; the nearest mechanism is admin-only.

Both are being rewritten against what the contract genuinely does.

## For the student lane — three rulings

Not this session's to build, recorded so they are not lost:

1. **The withdrawn child's copy is decided:** stopped at the door with "Your
   Nevo account is on pause. If you have questions, talk to your teacher."
   Blameless, no explanation of why. **No frame exists yet — a real gap, and a
   frame is coming.** The parent-side wording stands.
2. **The rotate prompt is an accessibility failure.** A device fixed in
   landscape on a wheelchair tray cannot satisfy it, which locks a child out by
   posture. Ticket going in for a way through — an explicit continue, or
   landscape support on the affected screens.
3. **The synthetic calibration voice is acceptable** — on the condition that it
   is the IDENTICAL voice every time. Calibration depends on consistency, not
   warmth; a varying voice would contaminate the baseline. Worth checking that
   `speechSynthesis` pins a specific voice rather than taking the platform
   default, which differs per device and per OS version.
