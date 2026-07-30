/**
 * Static mock lesson for building the Lesson Player before the backend content +
 * adaptation contracts exist. Shapes match `@/lib/types`, so wiring the real
 * `contentApi.getLesson` / `intelligenceApi.getAdaptation` later is a data-source
 * swap, not a UI change. Content here is illustrative, not curriculum-reviewed.
 */
import { MODALITY, DENSITY, CALC_MODALITY } from "@/lib/constants";
import type { AdaptationPlan, Lesson } from "@/lib/types";

export const PHOTOSYNTHESIS: Lesson = {
  id: "photosynthesis",
  title: "Photosynthesis",
  subject: "Science",
  segments: [
    {
      id: "intro",
      modalities: [MODALITY.TEXT, MODALITY.VISUAL, MODALITY.AUDIO, MODALITY.INTERACTIVE],
      text: {
        heading: "What is photosynthesis?",
        body: {
          default:
            "Photosynthesis is how green plants make their own food. Using energy from sunlight, they turn water and carbon dioxide into glucose - a sugar they use for energy - and release oxygen into the air.",
          [DENSITY.SIMPLIFY]:
            "Plants make their own food using sunlight. They take in water and carbon dioxide, and give out oxygen.",
          [DENSITY.EXPAND]:
            "Photosynthesis takes place in the chloroplasts of a plant's cells, where a green pigment called chlorophyll captures energy from sunlight. That energy drives a reaction between water, drawn up from the roots, and carbon dioxide, taken in through tiny pores in the leaves. The products are glucose, which stores the captured energy, and oxygen, which is released back into the air.",
          [DENSITY.SLOWER]: "Let's take this one small step at a time.",
        },
        slowerSteps: [
          "A leaf takes in sunlight, caught by its green colour - chlorophyll.",
          "It draws up water from the roots and takes in carbon dioxide from the air.",
          "Together these make glucose, the plant's food - and oxygen is given out.",
        ],
        keyTerms: ["chlorophyll", "chloroplast", "glucose"],
        callouts: {
          [DENSITY.SIMPLIFY]: {
            label: "IN SHORT",
            text: "Sunlight + water + carbon dioxide → food + oxygen.",
          },
          [DENSITY.EXPAND]: {
            label: "WORD EQUATION",
            text: "Carbon dioxide + Water → Glucose + Oxygen",
            sub: "…in the presence of sunlight and chlorophyll.",
          },
        },
      },
      visual: {
        heading: "See it as a picture",
        intro: "A leaf takes in three things and gives out two. Follow the arrows.",
        art: {
          id: "leaf-photosynthesis",
          alt: "A leaf photosynthesising: sunlight, water and carbon dioxide go in; glucose and oxygen come out",
          caption:
            "Inside the leaf, chloroplasts use sunlight to turn water and carbon dioxide into food.",
        },
        diagram: {
          inLabel: "TAKES IN",
          outLabel: "GIVES OUT",
          inputs: ["Sunlight", "Water", "Carbon dioxide"],
          outputs: ["Glucose", "Oxygen"],
        },
      },
      audio: {
        heading: "Listen to this one",
        intro:
          "Play it and follow along. You can pause any time, and read the words too.",
        title: "Narrated: What is photosynthesis?",
        durationSec: 48,
        transcript:
          "Photosynthesis is how green plants make their own food. Using energy from sunlight, they turn water and carbon dioxide into glucose, and release oxygen into the air.",
      },
      interactive: {
        heading: "Try it yourself",
        intro:
          "See photosynthesis happen for real. Tick each step as you go - there's no rush.",
        needs: ["A leaf", "A glass of water", "Sunlight"],
        steps: [
          "Rest the leaf in a glass of water in the light.",
          "Leave it for a few minutes.",
          "Look closely for tiny bubbles forming on the leaf.",
        ],
        outcome: {
          pending: "Tiny bubbles will start to appear on the leaf.",
          done: "Those bubbles are oxygen - the leaf is photosynthesising.",
        },
      },
      quickCheck: {
        question: "What do plants take in from the air?",
        options: [
          { id: "co2", label: "Carbon dioxide" },
          { id: "o2", label: "Oxygen" },
          { id: "n2", label: "Nitrogen" },
        ],
        correctId: "co2",
        correctNote: "That's it - plants take in carbon dioxide from the air.",
        recoveryNote:
          "Not quite - oxygen is what plants give out. Let's look again. Your progress is saved.",
      },
    },
    {
      id: "calc-fractions",
      modalities: [MODALITY.TEXT, MODALITY.INTERACTIVE],
      text: {
        heading: "Adding what the plant makes",
        body: {
          default:
            "A leaf made 1/4 of its glucose in the morning and 2/4 more by midday. When two fractions share the same bottom number, you add them by adding just the top numbers.",
          [DENSITY.SIMPLIFY]:
            "Same bottom number? Just add the top numbers.",
          [DENSITY.EXPAND]:
            "The bottom number of a fraction (the denominator) tells you how many equal parts the whole is split into. When two fractions share that number, the parts are the same size, so you can add the top numbers (the numerators) directly and keep the denominator the same.",
          [DENSITY.SLOWER]: "One small step at a time.",
        },
        slowerSteps: [
          "Check the bottom numbers match.",
          "Add only the top numbers.",
          "Keep the bottom number the same.",
        ],
      },
      // Non-null variant → the Interactive modality routes to the solver (17b §8).
      calculationVariant: "fraction_add_like",
      calculation: {
        variant: "fraction_add_like",
        problem: { expression: "1/4 + 2/4", answer: "3/4" },
        scaffold: { kind: "fraction_bars", parts: 4, rows: [1, 2] },
        steps: [
          {
            prompt: "What are the denominators?",
            choices: ["4 and 4", "1 and 2"],
            correct: 0,
            hint: "Look at the bottom number of each fraction.",
            onCorrect: {
              highlight: "denominators",
              confirm: "Both denominators are 4 - they match, so we can add directly.",
            },
          },
          {
            prompt: "What do we add together?",
            choices: ["The numerators: 1 and 2", "The denominators: 4 and 4"],
            correct: 0,
            hint: "We add the top numbers - the ones above the line.",
          },
          {
            prompt: "So what is 1 + 2?",
            input: "numeric",
            answer: "3",
            hint: "Just add the two top numbers: 1 + 2.",
          },
        ],
        completion:
          "When fractions share the same denominator, you only add the numerators - the denominator stays the same.",
        modalities: [CALC_MODALITY.INTERACTIVE, CALC_MODALITY.AUDIO, CALC_MODALITY.KINESTHETIC],
      },
    },
    {
      id: "recap",
      modalities: [MODALITY.TEXT, MODALITY.AUDIO],
      text: {
        heading: "Why it matters",
        body: {
          default:
            "Almost every breath you take uses oxygen that plants released through photosynthesis. It's one of the main ways the sun's energy reaches living things.",
          [DENSITY.SIMPLIFY]:
            "Plants give out the oxygen we breathe. That oxygen carries the sun's energy to us.",
          [DENSITY.EXPAND]:
            "Photosynthesis sits at the base of almost every food chain: the glucose plants make feeds the animals that eat them, and the oxygen they release makes animal respiration possible. In effect, it converts sunlight into a form of energy the rest of life can use.",
          [DENSITY.SLOWER]: "Let's take it one step at a time.",
        },
        slowerSteps: [
          "Plants release oxygen.",
          "Animals breathe that oxygen.",
          "So the sun's energy, captured by plants, reaches almost every living thing.",
        ],
      },
      audio: {
        heading: "Listen to this one",
        intro:
          "Play it and follow along. You can pause any time, and read the words too.",
        title: "Narrated: Why it matters",
        durationSec: 32,
        transcript:
          "Almost every breath you take uses oxygen that plants released through photosynthesis.",
      },
    },
  ],
  assessment: {
    questions: [
      {
        prompt: "What gas do plants release during photosynthesis?",
        options: [
          { id: "o2", label: "Oxygen" },
          { id: "co2", label: "Carbon dioxide" },
        ],
        correctId: "o2",
      },
      {
        prompt: "Where does a plant get the energy for photosynthesis?",
        options: [
          { id: "sun", label: "Sunlight" },
          { id: "soil", label: "The soil" },
        ],
        correctId: "sun",
        recoveryNote:
          "That one didn't land - and that's okay. The energy comes from sunlight. Nothing to fix right now.",
      },
    ],
    masteredConcepts: ["What photosynthesis makes", "Adding like fractions"],
    revisitConcepts: ["Where the energy comes from"],
    resultNote:
      "You showed you understand what photosynthesis makes and how to add like fractions. One idea - where the energy comes from - we'll come back to together.",
  },
  summary: {
    recap:
      "You worked through what photosynthesis makes and how a plant uses sunlight, and added some like fractions along the way. You took your time with the tricky idea and came back to it.",
    covered:
      "What photosynthesis makes · adding like fractions · why it matters",
  },
};

export const PHOTOSYNTHESIS_PLAN: AdaptationPlan = {
  lessonId: "photosynthesis",
  segments: [
    { segmentId: "intro", startModality: MODALITY.TEXT, density: null, suggestModality: MODALITY.VISUAL },
    { segmentId: "calc-fractions", startModality: MODALITY.INTERACTIVE, density: null, suggestModality: null },
    { segmentId: "recap", startModality: MODALITY.TEXT, density: DENSITY.SLOWER, suggestModality: MODALITY.AUDIO },
  ],
};

