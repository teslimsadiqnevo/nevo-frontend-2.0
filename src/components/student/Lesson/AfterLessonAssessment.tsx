"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button, ProgressDots } from "@/components/shared";
import type { Assessment } from "@/lib/types";
import { AnswerOption } from "./AnswerOption";

/** House recovery copy for questions that don't bring their own. */
const DEFAULT_RECOVERY =
  "That one didn't land — and that's okay. Your progress is saved.";

/**
 * After-lesson assessment (Lesson Player, screen 17) — a low-stakes walk through
 * a few questions once the last segment is done. Growth framing throughout: no
 * score, no marks, no red. A miss gets a violet recovery note and the same
 * forward path as a hit. The result celebrates what's taking hold ("getting the
 * hang of") and names what we'll come back to — concepts, never numbers.
 */
export function AfterLessonAssessment({
  assessment,
  onFinish,
}: {
  assessment: Assessment;
  onFinish: () => void;
}) {
  const total = assessment.questions.length;
  const [qIndex, setQIndex] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);

  if (qIndex >= total) {
    return <GrowthResult assessment={assessment} onFinish={onFinish} />;
  }

  const question = assessment.questions[qIndex];
  const resolved = chosenId !== null;
  const correct = chosenId === question.correctId;

  const advance = () => {
    setChosenId(null);
    setQIndex((i) => i + 1);
  };

  return (
    <div className="motion-safe:animate-nevo-reveal">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.12em] text-nevo-near-black/45 uppercase">
          Checking in
        </p>
        <ProgressDots
          total={total}
          current={qIndex + 1}
          aria-label={`Question ${qIndex + 1} of ${total}`}
        />
      </div>

      <h2 className="mt-3 text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[26px]">
        {question.prompt}
      </h2>

      <div className="mt-5 flex flex-col gap-2">
        {question.options.map((option) => (
          <AnswerOption
            key={option.id}
            label={option.label}
            chosen={chosenId === option.id}
            correct={option.id === question.correctId}
            resolved={resolved}
            onChoose={() => setChosenId(option.id)}
          />
        ))}
      </div>

      {/* Recovery note — lands instantly (comprehension results never animate). */}
      {resolved && !correct && (
        <div
          role="status"
          className="mt-5 rounded-[12px] bg-nevo-violet/20 p-4 text-[15px] leading-[1.5] text-nevo-near-black"
        >
          {question.recoveryNote ?? DEFAULT_RECOVERY}
        </div>
      )}

      {resolved && (
        <Button className="mt-6 w-full" onClick={advance}>
          {qIndex + 1 < total ? "Next one" : "See how it went"}
        </Button>
      )}
    </div>
  );
}

/** The growth result — what's taking hold and what we'll revisit. No score. */
function GrowthResult({
  assessment,
  onFinish,
}: {
  assessment: Assessment;
  onFinish: () => void;
}) {
  const mastered = assessment.masteredConcepts ?? [];
  const revisit = assessment.revisitConcepts ?? [];

  return (
    <div className="flex flex-col items-center text-center motion-safe:animate-nevo-reveal">
      {/* Success mark: navy circle + cream check, one-shot pop (DS state pattern). */}
      <div className="flex size-16 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
        <Check className="size-8 text-nevo-cream" strokeWidth={2.5} />
      </div>

      <h2 className="mt-5 text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[28px]">
        Nice work today
      </h2>

      {mastered.length > 0 && (
        <ConceptGroup label="You're getting the hang of" tone="navy" items={mastered} />
      )}
      {revisit.length > 0 && (
        <ConceptGroup label="We'll come back to" tone="violet" items={revisit} />
      )}

      <Button className="mt-9 w-full max-w-[300px]" onClick={onFinish}>
        Finish lesson
      </Button>
    </div>
  );
}

function ConceptGroup({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "navy" | "violet";
  items: string[];
}) {
  return (
    <div className="mt-7">
      <p className="font-mono text-[11px] tracking-[0.12em] text-nevo-near-black/45 uppercase">
        {label}
      </p>
      <div className="mt-2.5 flex flex-wrap justify-center gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={
              tone === "navy"
                ? "rounded-full bg-nevo-navy px-4 py-1.5 text-sm font-medium text-nevo-cream"
                : "rounded-full bg-nevo-violet/25 px-4 py-1.5 text-sm font-medium text-nevo-near-black"
            }
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
