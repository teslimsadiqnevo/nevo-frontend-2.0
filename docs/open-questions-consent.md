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
