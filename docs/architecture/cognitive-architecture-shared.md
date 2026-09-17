# Nevo: The Cognitive Architecture

Version 3.0 · Shared document · Teslim (backend), Olayinka (frontend), Lydia (product)

This is the document both of you read. There are two companion documents, one for each side of the build, and neither makes sense without this one.

# The goal

Read this before the page-one summary, because every decision in this document exists to serve it.

Bloom, 1984. A student taught one-to-one with mastery methods performs roughly two standard deviations above the same student in a conventional classroom. The median tutored student outscores about 98% of conventionally taught students.

That result has stood for four decades. The reason educational technology exists in its current form is the attempt to reproduce it without one tutor per child, and the reason the field has a reputation problem is that nothing has come close.

Nevo’s goal is to close that gap. Not to be a good adaptive learning product. To be the first system that delivers, at classroom scale and at a price a Nigerian private school can actually pay, something approaching what a tutor delivers to one child.

That is why six mechanisms run instead of one. Each of them is individually validated and individually insufficient. Spacing alone does not do it. Mastery tracing alone does not do it. Affect-aware sequencing alone does not do it. The bet this product makes is that running all of them together, each calibrated against a specific child’s own baseline rather than a population average, produces something none of them produce alone.

Nobody has measured that combination. That is the open question Nevo exists to answer, and the first cohort of schools is what answers it.

Which sets the standard for the build. A component that merely works is not finished. A component that hits the number published in the study that established it is at the floor, not the target. Anything that quietly sits below the literature is a decision to build something worse than what already exists, and there is no reason for this company to do that.

And it sets the standard for what we say. Every number must be defensible, sourced, and correctly described as either validated research or our own target. A product that claims two sigma without evidence is the thing that gave this industry its reputation. A product that measures honestly and publishes what it finds is the thing that fixes it.

# Page one: the whole thing in one page

Nevo takes a lesson a teacher already wrote and changes how it reaches each child while they are inside it.

Not what they learn. The concept, the objective and the curriculum are identical for every child in the class. What changes is the route: how much is on screen at once, how fast it moves, how much support is holding them up, which way in they get, and what comes next.

Before the first lesson, a short set of activities measures six things about how a child processes information. Those six numbers configure the software. They are not a description of the child and they never become one.

During every lesson, six mechanics run continuously. They track what has actually been mastered, raise and lower support, notice when a child is struggling or bored and change the interface in response, apply persistent accommodations, break long lessons into survivable pieces, and make the child build calculations rather than read them.

Across weeks and terms, a spaced retrieval scheduler brings each concept back shortly before it would have been forgotten, so what is learned stays learned.

The division of labour is absolute. The engine decides. The frontend renders. There is no adaptation logic in the client, and no rendering decisions in the engine.

The rule underneath all of it. The database stores visual_scaffold_density = 0.8. It never stores anything resembling a description of a person. No category, no type, no diagnosis, ever, anywhere.

# 1. What Nevo is not

Read this section before anything else, because getting it wrong has already happened once and it is the failure that would do the most damage.

## Nevo does not have learning styles

There is no such thing in this product as a text learner, a visual learner, an auditory learner or a kinaesthetic learner. No child is ever assigned a modality. No field anywhere holds one. Onboarding does not produce one.

The idea that teaching should be matched to a child’s preferred modality is called the meshing hypothesis, and it is the single most thoroughly disproven idea in education science. It has been tested repeatedly under proper experimental conditions and it does not improve learning. Self-report preference surveys, which is how modality types are normally assigned, carry almost no usable signal for configuring an adaptive engine, because children lack the metacognitive maturity to assess their own cognition and because they answer the way they think adults want.

We removed the preference survey permanently for this reason. If a modality field exists anywhere in the build, it is a bug of the most serious kind, and it must be found and removed.

## What we do instead, and why it looks similar but is not

Every lesson segment supports at least two ways in. The system switches which one is primary based on what is happening in this lesson, right now. It is a response, not an identity. It can be different in the next lesson, and in the next segment.

The distinction matters in three ways.

Scientifically. “This child learns visually” is a claim about the child that is not true. “This child’s working memory is loaded right now and the visual route reduces that load” is a claim about the moment, and it is defensible.

Legally. A stored modality type is a persistent attribute about a child. Our NDPA position and the six assessments we filed rest on the claim that Nevo produces no such attribute. If one exists, the filings are inaccurate.

Commercially. Our closest competitor profiles children into categories and routes them elsewhere. Our entire differentiation is that we do not diagnose. If we categorise, we are a worse version of them.

## Nevo does not label anything, ever

Not to the child, not to the teacher, not to the parent, not to the school, and not in the database.

A child with low working memory capacity does not become low_wmc. They get visual_scaffold_density = 0.8, which means more step-by-step scaffolding renders. The teacher sees that additional scaffolding is active. Nobody sees a description of the child, because none exists.

This is the Zero-Tag architecture. It is enforced in three places: by building it correctly, by the compliance guard middleware rejecting any write containing diagnostic vocabulary, and by never writing copy that characterises a person.

## Nevo does not tell the child what it is doing

The adaptation is silent. Nothing on screen tells a child that their lesson differs from anyone else’s. Support arrives as part of the lesson rather than as a correction, which is the only reason a struggling child can be helped in a room full of their peers without being exposed.

# 2. The two halves that make one product

Almost every misunderstanding on this build comes from collapsing these two halves together. They are different in kind, they run on different timescales, and they come from different science.

The persistent half is configuration. It comes from onboarding, it applies from the very first screen of the very first lesson, it changes only when daily recalibration shifts it, and it is proactive. Reading accommodations, interface density, session length, numerical scaffolding level.

The reactive half is intervention. It comes from what the child is doing in the next few seconds, it fires and resolves inside a single lesson, and it responds to evidence. A hint appearing, the interface softening, a harder item being offered, a Socratic panel opening.

A child with a low reading fluency baseline gets larger type and more generous line height in every lesson from day one, which is persistent. If that same child then shows frustration signals on a particular question, an unrequested hint appears, which is reactive. The first says nothing about how they are feeling. The second says nothing about who they are.

Confusing the two produces the exact failure mode we are avoiding. A reactive signal treated as persistent becomes a label. A persistent parameter treated as reactive means a child’s accommodations flicker on and off inside a lesson.

# 3. Layer 1: what onboarding measures

Six dimensions. Each one produces a continuous parameter that configures software. None produces a category.

The activities are framed to the child as setting up their learning space. There is no skip, no back, no timer, no attempt counter, and no right or wrong feedback during the tasks. A wrong tap gets a gentle violet nudge, never red. The words “test”, “score” and “ability” never appear. No result is ever shown to the child. A filled four-segment quest map is the only progress cue.

Four modules, one visual shell, four age bands: Primary 1-3, Primary 4-6, JSS 1-3, SS 1-3. The same component renders all four. Content variants load by band. The architecture does not fork.

| # | Dimension | What it configures |
|---|---|---|
| 1 | Visuospatial working memory | Scaffold density, instruction step size, how much can be on screen at once |
| 2 | Visual processing speed | Response timer thresholds, hint escalation timing, pacing boundaries |
| 3 | Reading fluency | Text complexity, audio scaffold triggers, time limits on reading-heavy items |
| 4 | Non-symbolic numerical fluency | Maths pathway entry, whether numbers render abstract, visual or concrete |
| 5 | Attentional focus | Session length, break scheduling, interface density, prompt frequency |
| 6 | Prior domain knowledge | Which node in the subject knowledge graph the child starts at |

Each is measured by a public, well-characterised paradigm rather than a licensed instrument: Corsi-type spatial span for working memory, speeded same-different comparison for processing speed, Eriksen flanker for attention, timed sentence verification for reading, dot-array comparison for numerical fluency, and an adaptive IRT probe for prior knowledge. Section 9 gives the performance each must reach.

## Why it is measured rather than asked

An adaptive engine with no history defaults to population averages, which means the first lessons are wrong for most children. Unseeded systems need many interactions per concept before they become useful, and a large share of children abandon the platform during that unstable window. Seeding the engine with real data means it is useful from the first few interactions instead of the thirtieth.

## Two bias protections that are not optional

Motor baseline. A short motor-screening step captures the child’s raw touchscreen tap latency so it can be subtracted from every later timing measurement. Without it, a child unfamiliar with touchscreens reads as cognitively slow when they are only device-slow. This is the difference between measuring a mind and measuring a household’s income.

Non-verbal and localised. Working memory is measured visuospatially rather than verbally, because verbal span tasks penalise multilingual learners through word-length effects. Reading material uses West African names, settings and syntax, because standard Western texts depress scores through cultural reference rather than reading ability.

## The output

One object per child, holding configuration parameters and the underlying baseline values. Every downstream engine reads it. Raw interaction streams are reduced to parameters and then permanently purged.

## Recalibration

Profiling is not one-and-done. A roughly 45-second warm-up opens each daily session and recalibrates one dimension, rotating through all six across the week. Same activities, stripped to a single round, quest map removed. Never a test, never a score.

# 4. Layer 2: the six mechanics

## Mechanic 1: per-concept mastery

Two algorithms in tandem, not one replacing the other.

BKT maintains a running probability that the child has mastered each concept, updated after every interaction, seeded from the domain probe rather than a population average. The child advances when that probability reaches 0.95.

AKT sits alongside it and does two things BKT cannot. It models transfer between skills, because understanding fractions genuinely helps with ratios and BKT treats skills as independent. And it separates reading ability from concept mastery, tracking them as two values rather than one.

That second point is the one that matters most here. Without it, a child who understands fractions but reads slowly is recorded as not knowing fractions. Research on a sample of 8,549 students showed this is a real and measurable bias in standard mastery systems, falling hardest on emerging readers. The dual-skill split eliminates it.

Evidence: BKT validated at R² = 0.92 predictive accuracy with a 40% reduction in time to reach the same standard (Corbett and Anderson, 1994). AKT raises predictive AUC from the 0.70 to 0.82 range to 0.82 to 0.89.

## Mechanic 2: scaffold indicator

Four small circles in the corner of the lesson player showing current support level. All four filled when a child is struggling, one or none when they are flying. Computed from mastery and affective state together. It rises and falls on its own and the child cannot control it.

Scaffolds must fade as mastery grows or children become dependent on them. That fading is the mechanism, not the scaffold itself.

Evidence: progressive scaffold fading produces learning gains of d = 0.42 to 0.68 and 25% faster task completion with fewer errors (van de Pol et al. 2010, Renkl 2014).

## Mechanic 3: affective response states

The system infers emotional state from interaction rhythm and modulates the interface in response. Four states, four responses.

Anxiety shows as rising latency, accuracy falling below previously demonstrated mastery, and shrinking tap precision. The interface thins out, secondary elements drop to 40% opacity, transitions slow, copy gentles.

Boredom shows as very fast correct responses with falling time per item. A “Ready for something harder?” pill appears, scaffold withdraws, difficulty steps up.

Frustration shows as erratic tapping, rapid error chains, replay spamming, long pauses followed by impulsive taps. An unrequested hint appears. If it persists past two adaptation cycles, a calm break is offered.

Confusion shows as repeated returns to the same step, alternating between options without committing, long dwell without progress. A Socratic panel opens with guided questions.

### Productive confusion, which is the subtle part

Not all confusion is bad. A child wrestling with a hard concept is doing the thing that produces deep learning, and interrupting it makes the product worse. So confusion starts a grace window rather than an intervention: 45 seconds for Primary, 60 for JSS, 90 for SS.

During the window the engine watches for productive signs, meaning still tapping, scrolling, re-reading, attempting even when wrong, against unproductive signs, meaning stalled for more than 15 seconds, three or more consecutive errors on the same step, or attempts to skip out.

If it resolves inside the window, nothing fires and it is logged as productive. If unproductive patterns persist past it, the Socratic panel opens.

The window scales with the child’s attentional baseline, because a child with strong sustained attention can hold productive struggle longer, and a child with weaker attention is more likely to cascade from confusion into disengagement.

Evidence: the flow-confusion-frustration-boredom transition model is validated (D’Mello and Graesser, 2012 and 2024). Affect-aware sequencing produces a 17% engagement increase and 12% accuracy improvement. Distinguishing productive from unproductive confusion reduces session dropout by 25%.

### Why this depends entirely on Layer 1

Every threshold here is calibrated against the child’s own baseline, never a population average.

The motor baseline is subtracted from all latency measurements. A child with naturally slow processing speed must not trigger frustration detection from response time alone. A child with lower attentional sensitivity shows more reaction-time variability normally, and that normal variability must not be read as confusion.

Without Layer 1 this mechanic misfires constantly, and it misfires hardest against exactly the children it is meant to help.

## Mechanic 4: UDL accommodations

Persistent rendering rules from the child’s configuration, applied from the first screen of the first lesson. Three profiles that can combine.

Reading: larger type, more line height, softer contrast, more whitespace.

Attention: segments broken into shorter sub-segments with tap-to-continue boundaries, pause screens between chunks, reduced density.

Numerical: numbers as grouped dots, fractions as filled bars, equations with number lines. Abstract notation always kept alongside rather than removed, so the child builds the association between the visual and the symbolic.

Evidence: UDL produces effect sizes of d = 0.35 to 0.55 across 18 studies (Capp 2017). Unlabelled accessibility options raise engagement 24% for neurodivergent learners while preserving self-efficacy (Hall, Cohen and Vue 2015). Multi-modal computer-assisted instruction produced significant achievement gains in Nigerian secondary schools (Adigun 2020, Ibadan).

That last citation matters more than its size suggests. It is the one piece of this evidence base gathered in Nigerian classrooms.

## Mechanic 5: module chunking

Lessons of six or more segments split into named modules with a calm boundary screen between them, and a two-level progress line showing both module and segment position.

Long unbroken sequences overwhelm working memory and executive function. The boundary is a cognitive reset point.

No confetti, no points, no streaks, no celebration. The boundary screen reads “Module 2 of 4: Fractions in everyday life.” The completion state is quiet.

## Mechanic 6: co-construction for calculation

For maths and physics, the system does not show a worked example. It holds the equation and a visual scaffold, and the child supplies one thinking-step at a time while the answer assembles.

Reading a worked solution lets a child skip comprehension by copying the answer. Building it does not.

Evidence: worked-example fading produces d = 0.42 to 0.68 on transfer compared to passive reading (Renkl 2014).

This is the one place where modalities genuinely layer rather than switch. Tap-to-build, audio read-aloud of the current step, and a visual equation scaffold run simultaneously. Everywhere else, modality switches between primary and secondary. Here it stacks, deliberately.

# 5. Spaced retrieval

Concepts are brought back shortly before they would have been forgotten, scheduled from three values per concept per child: how stable the memory is, how difficult that concept is for that child, and how retrievable it is right now.

Retrievability target is dynamic, moving between 0.85 and 0.90 based on the child’s current cognitive load. A child already under strain gets a relaxed target and fewer daily reviews. A child with capacity gets a tighter target and better retention.

Daily caps by band: 15 items for Primary, 20 for JSS, 25 for SS. Overflow prioritises lowest retrievability first and rolls forward.

Reviews interleave rather than block. If fractions, ratios and percentages are all due, they mix. Blocked review feels easier and produces worse transfer.

Completion reads “You strengthened this concept.” Never a grade, never a score.

Evidence: the spacing effect is d = 0.60 across 254 studies and more than 14,000 participants (Cepeda et al. 2006). The scheduler cuts review volume 20 to 30% against the older SM-2 algorithm while holding 90% retrievability, benchmarked across 700 million reviews (2025).

This mechanic is what makes the commercial claim true. Gaps stop accumulating, holidays stop erasing a term, and each term starts from a stronger place than the last.

# 6. Layer 3: how it all coordinates

Six engines produce six outputs. The frontend must not talk to six services and must not merge them itself.

The interface state manager queries every engine, resolves conflicts between them, and returns one payload per screen update: what content comes next and at what difficulty, the scaffold level, any affective intervention, the accommodation overrides, the review queue, and the module position.

Conflict resolution lives here and nowhere else. When the affective engine wants to reduce density while the mastery engine wants to introduce a harder item, something has to decide, and it is this service.

## Multi-signal confirmation

No adaptation fires from a single signal. At least two independent signal sources must agree within a time window before anything changes.

A long response time alone is not frustration. A long response time plus erratic tap coordinates plus a sudden error chain is.

This exists because behavioural data is noisy and a false positive is not a neutral event. It means a child who was concentrating gets interrupted, or a child who was fine gets handled as though they were struggling.

## The compliance guard

Middleware inspecting every database write and every API response. Any field name or value matching diagnostic vocabulary is rejected and logged.

It is a safety net under correct construction, not a substitute for it.

# 7. Scenarios: what this actually looks like

Six pictures. The first four are a single lesson, the fifth is a term, and the sixth is what failure looks like so that it is recognisable before it ships.

## Scenario 1: Amara, who reads slowly and thinks quickly

Her configuration: low reading fluency baseline, strong working memory, no attention flags.

Before her first screen renders, the accommodation parameters are already applied. Larger type, more line height, softer contrast, more whitespace. She does not watch a plain version turn into an accessible one. Her Nevo has always looked like this and she has no idea it looks different to anyone else.

The lesson is adding fractions with unlike denominators. The domain probe established during onboarding that she already holds equivalent fractions, so the mastery engine places her at the right node and she is not walked through a prerequisite she owns. The class is doing the same lesson. She is doing it from the correct starting point.

Four minutes in, she slows on a step with dense wording. Her response latency rises sharply.

This is where a lesser system fails her. Rising latency is a frustration signal. A naive engine fires a hint, interrupts a child who was concentrating, and teaches her that the system thinks she is struggling.

Nevo does three things instead. It subtracts her motor baseline from the measurement. It checks her reading fluency baseline and finds that slower responses on text-heavy items are normal for her rather than evidence of difficulty. And it looks for a second corroborating signal and does not find one, because her tap precision is steady and she has made no errors.

Nothing fires. She works it out herself.

At the next segment a suggestion pill offers the audio route. She takes it. The concept, the objective, the curriculum and the assessment are identical. Only the way in changed, and it changed for this segment, not for her.

She finishes. Nothing on screen has told her that her lesson differed from anyone else’s, because in every way that matters it did not.

## Scenario 2: Tunde, who is confused, and then is not

His configuration: lower attentional sensitivity, numerical fluency baseline indicating the visual route.

His lesson renders in shorter sub-segments with tap-to-continue boundaries. His fractions appear as filled bars with the standard notation held alongside, never replacing it, because the point is that he builds the association rather than avoids the symbols. The lesson runs to eleven segments, so chunking has split it into three modules with a calm boundary screen between each.

On the third question he taps twice quickly, reverses, taps again, then stops for eleven seconds.

Confusion signals. The grace window opens. His attentional baseline shortens it from the standard 60 seconds to around 40, because a child with his profile is more likely to slide from confusion into disengagement than to hold productive struggle.

At second 20 he is still scrolling and re-reading. Those are productive signs. Nothing fires. He is doing the thing that produces deep learning and interrupting it would make the product worse.

At second 38 he has made three consecutive errors on the same step and stalled with no input. Two independent signals now agree. The Socratic panel opens with a guided question rather than an answer.

He reasons through it and gets there himself. The scaffold indicator, which had filled to four circles, drops back to two.

Eight days later, shortly before he would have forgotten it, the concept returns in a review session. It is mixed in with ratios and percentages rather than blocked with other fraction problems, because blocked review feels easier and produces worse transfer. He gets it right.

“You strengthened this concept.” No grade, no score, no percentage.

## Scenario 3: Chidinma, who is bored

Her configuration: strong across every dimension. The domain probe placed her three nodes ahead of her class.

Six minutes into the lesson she is answering correctly in under two seconds per item, her time per item is falling, and she has started skipping ahead through segments she has not read.

A single fast answer means nothing. Fast answers plus falling engagement time plus skip-like navigation is three signals agreeing.

The scaffold withdraws to zero. A pill appears: “Ready for something harder?” She taps it. Item difficulty steps up and she is working at a level that costs her something.

What did not happen is the important part. She was not moved to a different lesson, a different curriculum, or a gifted track. She is in the same lesson as everyone else, on the same objective, working at the edge of what she can do. No teacher had to notice, no parent had to request it, and nothing on screen marked her as advanced.

## Scenario 4: Emeka, who knows the maths but reads slowly

This is the scenario the dual-skill architecture exists for, and it is worth walking through carefully because it is the most common way adaptive systems fail children quietly.

Emeka understands fractions. He can manipulate them, he understands equivalence, and given a bare equation he solves it. His reading is well behind his year group.

The lesson presents a word problem. He answers incorrectly, because he misread what was being asked rather than because he cannot do the operation.

In a standard mastery system, that is a wrong answer on the fractions concept. His mastery probability for fractions drops. The system serves him easier fraction content. He answers that incorrectly too, for exactly the same reason, and the system concludes he is weaker still. Within a week he has been walked backwards through material he already knows, bored and increasingly convinced he is bad at maths, and the system’s records say he cannot do fractions.

Research on 8,549 students showed that this is real, measurable, and falls hardest on emerging readers.

Nevo tracks two probabilities. Concept mastery and reading demand are separate values, and every item in the content database carries both a concept difficulty and a reading demand level. When Emeka fails a high-reading-demand item on a concept he has previously demonstrated, the engine attributes the failure to reading rather than to fractions.

What happens next is that his reading accommodations are already active, the audio route is offered on the next text-heavy item, and his fractions mastery is untouched. He continues forward in maths at the level he actually is, while his reading is supported where it actually needs support.

The teacher sees that a concept is settling normally for him. Not that he is a weak reader, because that is not stored.

## Scenario 5: A term, from the school’s side

September. 120 children onboard across four classes. Each completes four short activity modules that never use the words test, score or ability, and never show a result. The engine now holds a configuration per child. Nothing in it describes a person.

Week one. Every child’s first lesson is already adapted. There is no warm-up period where the product is bad while it learns, which is the window where most adaptive platforms lose a third of their users.

Week three. The engine has converged. Teachers begin seeing class-level narratives: which concept is settling slowly across the whole class regardless of who is teaching it, and where attention would be useful this week. No child is ranked. No child is characterised.

Mid-term assessment. The first measurable proof. The bottom quartile has moved on their own baselines. A child who scored 30% is materially higher on a comparable assessment, and it is visible to a parent without waiting for a report card.

End of term. Two things are measured against a matched control class. The mean has risen, and the spread has narrowed. That second one is the whole argument, because a product that lifts the strong and leaves the weak has not done what we said it does.

The holiday. Spaced retrieval keeps bringing concepts back before they fade. Where a conventional class loses a large share of a term across a long break, the decay here is small.

January. Term two starts above where term one ended. The teacher does not spend three weeks re-teaching. That is the compounding claim, and it is the reason a school renews rather than churns.

## Scenario 6: What failure looks like

This one is written so it is recognisable in a code review rather than in a client meeting.

A developer implementing onboarding sees that the system needs to know how to present lessons to each child. It seems natural to store the outcome as a type. The child becomes a text learner, or a visual learner. The field is small, it makes rendering simple, and everything appears to work.

Here is what has actually been built.

A child who onboards on a day when the audio was not working becomes a text learner forever. A child who is strong at reading is never offered the visual route on a concept where the visual route is the one that would land. A teacher opens a profile and sees a category, and within a week the staff room is talking about which children are visual learners, and a child overhears it.

The engine can no longer adapt, because adaptation means changing the route in response to what is happening now, and the route has been fixed by a decision made in week one.

The compliance position is now inaccurate. We told schools, in writing and under our own filings, that no child is categorised. One is.

And the scientific claim is inverted. The product is now running on the meshing hypothesis, which is the one idea in education research that has been tested properly and does not hold. We are selling a disproven mechanism to people who read the literature.

None of that is visible from the code. It looks like a small enum. It is the difference between this product and the thing it is trying to replace.

The same shape recurs everywhere: a threshold derived in the client because the engine did not send one, a count rendered inline where its absence changes the meaning, a narrative state inferred from a row count. Each is one developer making one reasonable local decision. Together they are the build slowly ceasing to be the thing the architecture describes.

The rule that prevents all of it: when the contract does not give you what the design needs, change the contract. Never fill the gap.

# 8. The division of labour, stated once

The engine decides. The frontend renders. Absence is an instruction.

If the engine cannot support a claim, it sends nothing, and the frontend renders the state that corresponds to nothing. The frontend never fills a gap, never derives a threshold from row counts, and never infers what the engine did not say.

This has been breached three times on this build. A count interpolated into a sentence that changed its meaning. A threshold about to be derived client-side for insight narratives. A modality type that exists nowhere in this architecture appearing in a demo as though it did.

Each looked like a small local decision. Together they are the same failure, and it is the failure that makes a product mediocre: the build slowly stops being the thing the architecture describes, and nobody notices until it is on a screen in front of someone who matters.

If the contract does not give you what the design needs, the answer is to change the contract. It is never to guess well.

# 9. Benchmarks: what the research measured, and what Nevo must beat

How to read this section.

The Measured column is published research on the method, with the scale it was established at. It is true today and citable.

The Nevo floor column is the level this build must meet or surpass. Nothing less is acceptable. It is not a result, it has never been measured on Nevo, and it must never be stated externally as though it has.

Every floor here is set at or above the best published figure, because a benchmark that sits below the literature is a plan to build something worse than what already exists. The point of measuring how a child thinks before their first lesson is to beat the systems that do not.

One honest caveat for the team. Published figures come from controlled studies with tuned parameters and large samples. First measurement on a real Nigerian cohort will miss several of these. That is expected and it is not failure. These are the targets the tuning programme aims at, and the gap between first measurement and floor is the work. What is not acceptable is not measuring.

## Baseline profiling and pre-seeding

| Metric | Measured | Scale | Nevo floor |
|---|---|---|---|
| Interactions to useful accuracy, unseeded | 15 to 30, AUC 0.52 to 0.58 | benchmark evaluations | not applicable, this is the comparison |
| Interactions to useful accuracy, seeded | AUC above 0.78 within 3 to 5 | published | AUC ≥ 0.82 within 3 interactions |
| First-session attrition, unseeded | 28 to 35% abandon | published | not applicable |
| First-session attrition, seeded | below 10% | published | ≤ 7% |
| Response accuracy gain from pre-seeded scheduling | 12 to 18% | p < 0.05 | ≥ 18% |
| Practice activities to reach mastery | up to 35% fewer | published | ≥ 35% fewer |
| Self-report signal strength | r below 0.12 | published | not a target. This is why the survey was removed. |
| Working memory, correlation with curriculum attainment | r = 0.50 to 0.65, independent of IQ | established literature | our task correlates r ≥ 0.55 with attainment |
| Reading fluency, share of comprehension variance | over 40% | established | our task correlates r ≥ 0.55 with comprehension |
| Prior knowledge, share of early platform accuracy variance | up to 60% | established | domain probe captures ≥ 50% of that variance |
| Total onboarding duration | not research | design | ≤ 12 min Primary, ≤ 15 min Secondary |

## Mastery modelling

| Metric | Measured | Scale | Nevo floor |
|---|---|---|---|
| BKT predictive accuracy | R² = 0.92 | Corbett and Anderson 1994 | R² ≥ 0.92 |
| Reduction in time to reach the same standard | 40% | same | ≥ 40% |
| BKT benchmark AUC | 0.70 to 0.82 | benchmark sets | not applicable, superseded by AKT |
| AKT benchmark AUC | 0.82 to 0.89 | benchmark sets | AUC ≥ 0.89 on our data |
| First-answer mastery disparity, emerging vs non-emerging readers | real and measurable in standard BKT | EDM 2025, N = 8,549 students | ≤ 2 percentage points |

That last row is the most important acceptance test in this document. It is directly checkable, it is the entire reason the dual-skill architecture exists, and failing it means the product is quietly penalising the children it was built to protect.

## Affective inference

| Metric | Measured | Scale | Nevo floor |
|---|---|---|---|
| Engagement increase, affect-aware sequencing | 17% | Affect-LinguoNet 2025, IEEE | ≥ 20% |
| Task accuracy improvement | 12% | same | ≥ 15% |
| Session dropout reduction, productive vs unproductive confusion separated | 25% | D’Mello and Graesser | ≥ 30% |
| False-positive interventions | not published | — | ≤ 5% of adaptation cycles |
| Interventions firing on a single signal | not published | — | zero. Hard requirement, not a target. |
| Grace window respected before intervening | not published | — | 100% of confusion events |

## Support and accommodation

| Metric | Measured | Scale | Nevo floor |
|---|---|---|---|
| Scaffold fading, learning gain | d = 0.42 to 0.68 | van de Pol et al. 2010, Renkl 2014 | d ≥ 0.68 |
| Task completion speedup | 25% | same | ≥ 25% |
| UDL effect size | d = 0.35 to 0.55 | Capp 2017, meta-analysis of 18 studies | d ≥ 0.55 |
| Engagement gain, unlabelled accessibility, neurodivergent learners | 24% | Hall, Cohen and Vue 2015 | ≥ 24%, self-efficacy preserved |
| Multi-modal CAI in Nigerian secondary schools | significant achievement gains | Adigun 2020, Ibadan | replicate significance on our own cohort |
| Accommodations active before first screen render | not research | — | 100% of sessions |

## Construction over demonstration

| Metric | Measured | Scale | Nevo floor |
|---|---|---|---|
| Worked-example fading, transfer gain | d = 0.42 to 0.68 | Renkl 2014 | d ≥ 0.68 |

## Retention and scheduling

| Metric | Measured | Scale | Nevo floor |
|---|---|---|---|
| Spacing effect | d = 0.60 | Cepeda et al. 2006, 254 studies, 14,000+ participants | d ≥ 0.60 on delayed post-test |
| Review volume reduction against SM-2 | 20 to 30% | FSRS benchmark 2025, 700 million reviews | ≥ 30% |
| Retrievability held while doing it | 90% | same | ≥ 90% |
| Interleaving, delayed problem-solving transfer | up to 43% | published | ≥ 43% against blocked review |
| Daily review cap respected | not research | — | 100%. 15 Primary, 20 JSS, 25 SS. |

## Open-response evidence extraction (v1.5)

| Metric | Measured | Scale | Nevo floor |
|---|---|---|---|
| Agentic BKT predictive validity | r = 0.333, p < 0.0001, triples baseline | IEEE Conference on Games 2026 | r ≥ 0.333 |

## Compliance, which has no range

| Metric | Nevo floor |
|---|---|
| Diagnostic labels stored, transmitted or displayed | zero |
| Modality or learner-type fields anywhere in the system | zero |
| Raw interaction streams persisting after reduction | zero |
| Compliance guard rejections reaching production data | zero |
| Results, scores or grades shown to a child | zero |

## What this section is for externally

Nothing in the Nevo floor column is a result. When talking to a school, an investor or a grant body, the defensible sentence is that the methods are validated at the levels in the Measured column, across the samples named, and that a term of deployment is what produces our own numbers.

The floors are the measurement plan. The moment a cohort completes a term with attainment data alongside their baselines, every row above becomes a test.

# 10. The composite: the number that is actually the point

Everything in section 9 measures one mechanism against the study that established it. Beating all of them individually is necessary and it is not the goal.

Every piece of research Nevo is built on isolated a single mechanism. Cepeda measured spacing with nothing else running. Corbett and Anderson measured mastery tracing in a system with no affective inference. Capp’s meta-analysis measured UDL without a spaced scheduler underneath it. D’Mello measured affect-aware sequencing without dual-skill mastery separating reading from concept.

Nobody has measured all of them running together on the same child, in the same lesson, calibrated against that child’s own baseline. That is what Nevo is, and it means the composite outcome is an open empirical question rather than a known quantity.

Effect sizes do not add. A spacing effect of d = 0.60 and a UDL effect of d = 0.55 do not produce d = 1.15. They overlap, they interact, and some of them partly explain each other. Anyone who multiplies them out is doing marketing, not science. The composite has to be measured directly, against a matched control, on our own cohort.

## The benchmark the composite is aimed at

Individual one-to-one tutoring using mastery methods moves the average student roughly two standard deviations above the same student taught conventionally. The median tutored student outperforms about 98% of conventionally taught students.

That finding is fifty years old, it is the most famous result in education research, and the reason the entire field exists in its current form is that nobody has reproduced it at scale. Every adaptive learning system since has been an attempt at it, and the best of them land far short.

That is the number. Not because it is reachable next term, but because it is the only benchmark that corresponds to what Nevo claims to do, which is give every child what a tutor gives one child.

## Composite acceptance criteria

Measured against a matched control cohort in the same school, same curriculum, same teachers, over a full term minimum.

| Composite metric | Why it matters | Nevo floor |
|---|---|---|
| Effect size on curriculum attainment | The headline. Nothing at scale has approached two sigma. | d ≥ 1.0 at first term. d ≥ 2.0 as the standing target. |
| Reduction in attainment spread across the class | If adaptation works, the gap between strongest and weakest narrows while the mean rises. No single mechanic claims this. It is purely a property of the combination. | class standard deviation down ≥ 30% while mean rises |
| Bottom-quartile gain relative to top-quartile gain | The equity claim, made testable. A system that lifts the strong faster than the weak is not doing what we say it does. | bottom quartile gain ≥ top quartile gain |
| Decay across a holiday break | Conventional instruction loses a large share of a term over a long break. This is what spaced retrieval plus mastery tracking should eliminate. | ≤ 10% decay, against a 20 to 40% conventional baseline |
| Time to mastery, compound | Mastery tracing gives 40%, pre-seeding gives up to 35% fewer activities, interleaving improves transfer. Compounded, not added. | ≥ 50% reduction against conventional pacing |
| Term-over-term acceleration | The compounding claim. Term two should start from a higher floor than term one, and term three higher again. | each term’s starting attainment above the previous term’s ending baseline |

That last row is the one no competitor can claim and no single study measures, because it requires the same children on the same system across multiple terms. It is also the entire commercial argument, which is that the longer a school runs Nevo the better it gets rather than the more it plateaus.

## Immediate and compounding, which are two different proofs

A school will not wait a year to see whether this worked, and it should not have to. The product has to show inside the first term and keep growing after it, and those are two separate measurements with two separate designs.

Immediate, visible inside one term. A child entering at 30% on a mid-term assessment should be materially higher by the end-of-term assessment. Two standard deviations, which is the tutoring benchmark, moves a child at roughly the bottom decile to around the 60th to 70th percentile of an untaught class. For a child starting at 30%, that is a trajectory into the 70s.

Say that precisely, because a proprietor will press on it. A percentage score and a percentile are different claims, and conflating them is the kind of error that ends a meeting. The measurable version is the child’s own score on comparable assessments at two points in the same term, alongside a matched control.

| Checkpoint | What is measured | Nevo floor |
|---|---|---|
| Week 3 | Engine has converged on the child | AUC ≥ 0.82, accommodations active from session one |
| Mid-term assessment | First visible movement | bottom-quartile children up ≥ 15 percentage points on their own baseline |
| End of term | The term claim | d ≥ 1.0 against matched control, spread down ≥ 30% |
| After the break | The retention claim | ≤ 10% decay |
| Start of term two | The compounding claim | starting attainment above term one’s ending baseline |
| End of term three | The full claim | d ≥ 2.0, and each term’s gain at least matching the last |

Compounding, visible across terms. The gain must not flatten. A system that lifts a child once and plateaus is a tutoring substitute. A system where term two starts higher than term one ended, and term three higher again, is infrastructure, and it is the only thing that justifies a multi-year relationship with a school.

Across every kind of learner. These floors apply to the cohort as a whole and to the bottom quartile separately, and they apply whether a child is neurotypical or neurodivergent. A class mean can rise while the weakest children fall, and reporting that as success would make the product worse than nothing. Per-quartile reporting is not an analytics nicety. It is the check on whether the thing we claim is happening is actually happening.

## What this obliges us to build

A composite claim requires a measurement design, and the design has to exist before the first cohort starts rather than after.

That means a matched control from day one, attainment data captured at term boundaries alongside baseline vectors, a defined delayed post-test after each break, and per-quartile reporting rather than class averages. A class mean can rise while the bottom quartile falls, and a system that let that happen while reporting success would be worse than no system.

None of this is v1 product work. All of it is v1 planning work, and if the first cohort runs without it we lose a term of evidence we cannot reconstruct.

## What we say until then

The methods are validated at the levels in section 9, across the samples named. The combination has not been measured by anyone, including us, and a term of deployment is what produces that number.

That is a stronger position than a borrowed statistic, because it is true, it is checkable, and it is the reason the first cohort of schools is getting the rate they are getting.

# 11. The rules that do not bend

- No learner types, modality categories, or learning styles. Anywhere.
- No diagnostic label created, stored, transmitted or displayed. Anywhere.
- The database describes software behaviour, never human character.
- No adaptation fires on a single signal.
- Every threshold is calibrated against the child’s own baseline, never a population average.
- The frontend computes no scores, parameters, or thresholds.
- Raw interaction streams are purged after reduction to parameters.
- The child is never told what the system is doing or why.
- No reward mechanics. No points, streaks, confetti or celebration.
- Nothing is ever shown to a child as a result, a score or a grade.
Nevo Learning Limited, RC 9507736. Supersedes the Adaptive Engine Developer Reference v2.1.
