/**
 * Fail the build when the code stops being what the architecture describes.
 *
 *   node scripts/architecture-check.mjs           # exits 1 on any finding
 *   node scripts/architecture-check.mjs --warn    # report, always exit 0
 *
 * A GATE for the rules in `docs/architecture/` that are mechanically checkable.
 * It is a safety net under correct construction, not a substitute for it - most
 * of the ten rules (adaptation felt not seen, absence is an instruction) cannot
 * be checked by a parser and are enforced by reading the document.
 *
 * WHY THIS EXISTS. The shared architecture names the failure mode exactly: "one
 * developer making one reasonable local decision", and "none of that is visible
 * from the code". A stored modality "looks like a small enum". Prose in a doc
 * nobody re-reads does not survive three sessions and a deadline, so the rules
 * that CAN be checked are checked here, on every commit.
 *
 * Two live breaches motivated it, both found the day the v3.0 docs landed:
 *
 *   CLOCK     `useSignals` stamped every interaction event with
 *             `new Date().toISOString()`. Frontend section 2 requires
 *             `performance.now()` because clock skew across devices corrupts
 *             every latency measurement, and latency is the primary signal for
 *             three of the four affective states. There is no way for the
 *             engine to recover precision the client did not send.
 *   CONTRACT  `GET /api/session/state/:student_id`, the single endpoint the
 *             whole frontend document is built on, had zero references in
 *             `src/lib/api`. Not checkable here, but it is why nobody should
 *             trust that reading the document once is enough.
 *
 * Parsing uses the TypeScript AST rather than a regex window, for the reason
 * `contract-check.mjs` gives: the regex version of that gate flagged seven call
 * sites, most were false positives, and that is how a gate teaches people to
 * ignore it. `typescript` is already a dependency, so package.json gains no
 * entry - which matters, because three sessions share this lockfile.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const WARN_ONLY = process.argv.includes("--warn");

const findings = [];
const add = (kind, file, node, sf, message) => {
  const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  findings.push({ kind, where: `${file}:${line + 1}`, message });
};

/** Every .ts/.tsx under src. Tests included for the Zero-Tag rules: a test
 *  asserting a banned shape still puts that shape in front of a reviewer as
 *  though it were correct. Copy rules skip tests, where fixture prose is fine. */
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(entry)) files.push(p);
  }
})(SRC);

// ---------------------------------------------------------------- rule 1
// No learner types, modality categories, or learning styles. Anywhere.
// Segment-level modality SWITCHING is correct and expected - the frontend
// document names `ModalitySuggestionPill` itself. What is banned is a modality
// carried BY A CHILD, which is why this matches names, not the word.
const BANNED_NAMES =
  /^(learner_?types?|learning_?styles?|preferred_?modality|modality_?preference|dominant_?modality|student_?modality|child_?modality|visual_?learner|auditory_?learner|kinaesthetic_?learner|kinesthetic_?learner)$/i;

// ---------------------------------------------------------------- rule 2
// A modality property hanging off a person-shaped type is the same bug wearing
// a plainer name. Scoped to the API layer, where a stored field would enter.
const PERSON_TYPE = /(student|child|learner|pupil|profile|baseline|onboarding)/i;
const MODALITY_PROP = /^(modality|modalities)$/i;

// ---------------------------------------------------------------- rule 3
// performance.now(), never Date.now() - for anything timed and sent up.
const SIGNAL_FILE = /(signal|telemetry|tracking|interaction|adaptation)/i;
const TIME_PROP =
  /^(timestamp|ts|occurred_?at|emitted_?at|started_?at|ended_?at|dwell|latency|duration)$/i;

// ---------------------------------------------------------------- rules 4, 5
// Never a score, grade or percentage shown to a child. No reward mechanics.
const CHILD_FACING = /[\\/]components[\\/]student[\\/]/;
// `out of \d+` is deliberately NOT here: it catches "1 out of 4 slices", which
// is a fraction being taught, not a mark being reported.
const SCORE_COPY =
  /\b(your score|score of|you scored|grade of|percentile|percent correct|marks out of|\d+\s*%\s*(correct|right))\b/i;
const REWARD =
  /\b(confetti|streak|trophy|leaderboard|badge earned|points earned|you win)\b/i;

// ---------------------------------------------------------------- rule 6
// Never a gendered pronoun in generated copy. No pronoun is stored for any
// child and there is no field that could make it right.
const PRONOUN = /\b(he|him|his|she|her|hers|himself|herself)\b/i;
const COPY_DIR = /[\\/]components[\\/](student|teacher|parent)[\\/]/;
// Authored assessment and lesson items are exempt. Their narrative characters
// are people in a story, not the child reading it, and the shared architecture
// positively REQUIRES West African names and settings in reading material
// because standard Western texts depress scores through cultural reference.
const AUTHORED_ITEMS = /[\\/](Profiling|Lesson)[\\/].*(Module|Item|Content)\.tsx$/;

for (const abs of files) {
  const file = relative(ROOT, abs).replace(/\\/g, "/");
  const sf = ts.createSourceFile(
    abs,
    readFileSync(abs, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const isTest = /\.(test|spec)\.tsx?$/.test(file);

  const visit = (node) => {
    // rule 1 - banned names, anywhere, including tests
    if (
      (ts.isIdentifier(node) || ts.isStringLiteral(node)) &&
      BANNED_NAMES.test(node.text)
    ) {
      add(
        "zero-tag",
        file,
        node,
        sf,
        `\`${node.text}\` is a learner type. Shared doc section 1: no child is ever assigned one.`,
      );
    }

    // rule 2 - modality property on a person-shaped type, in the API layer
    if (
      file.startsWith("src/lib/api/") &&
      ts.isPropertySignature(node) &&
      node.name &&
      MODALITY_PROP.test(node.name.getText(sf))
    ) {
      let p = node.parent;
      while (p && !ts.isInterfaceDeclaration(p) && !ts.isTypeAliasDeclaration(p))
        p = p.parent;
      const owner = p?.name?.getText(sf) ?? "";
      if (PERSON_TYPE.test(owner)) {
        add(
          "zero-tag",
          file,
          node,
          sf,
          `\`${owner}.${node.name.getText(sf)}\` gives a child a modality. Segment-level switching is fine; a child carrying one is not.`,
        );
      }
    }

    // rule 3 - wall clock on a value the engine measures from
    if (ts.isPropertyAssignment(node)) {
      const name = node.name.getText(sf).replace(/['"]/g, "");
      const init = node.initializer.getText(sf);
      if (
        TIME_PROP.test(name) &&
        /new Date\(\s*\)|Date\.now\(/.test(init) &&
        SIGNAL_FILE.test(file) &&
        !isTest // a fixture timestamp is not a measurement
      ) {
        add(
          "clock",
          file,
          node,
          sf,
          `\`${name}\` uses the wall clock. Frontend section 2: performance.now(), or clock skew corrupts every latency measurement.`,
        );
      }
    }

    // rules 4, 5, 6 - copy. String literals only: an identifier named `score`
    // is a local decision, a sentence on screen is what a child reads.
    if (
      (ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node)) &&
      !isTest
    ) {
      const s = node.text;
      const words = s.trim().split(/\s+/).length;
      if (CHILD_FACING.test(file) && SCORE_COPY.test(s))
        add("child-score", file, node, sf, `Copy shows a child a result: "${s.slice(0, 60)}"`);
      if (CHILD_FACING.test(file) && REWARD.test(s))
        add("reward", file, node, sf, `Reward mechanic in child-facing copy: "${s.slice(0, 60)}"`);
      if (COPY_DIR.test(file) && !AUTHORED_ITEMS.test(file) && words >= 3 && PRONOUN.test(s))
        add("pronoun", file, node, sf, `Gendered pronoun in copy: "${s.slice(0, 60)}"`);
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const TITLES = {
  "zero-tag": "Zero-Tag breach - a child is being categorised",
  clock: "Wall clock on a signal the engine measures latency from",
  "child-score": "A result shown to a child",
  reward: "Reward mechanics",
  pronoun: "Gendered pronoun in generated copy",
};

const byKind = {};
for (const f of findings) (byKind[f.kind] ??= []).push(f);

for (const [kind, list] of Object.entries(byKind)) {
  console.log(`## ${TITLES[kind] ?? kind}  (${list.length})`);
  for (const f of list) console.log(`   ${f.where}\n     ${f.message}`);
  console.log();
}

if (findings.length === 0) console.log("No architecture violations.");

process.exit(findings.length > 0 && !WARN_ONLY ? 1 : 0);
