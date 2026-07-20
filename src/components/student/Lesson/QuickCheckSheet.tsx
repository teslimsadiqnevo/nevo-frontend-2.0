"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/shared";
import type { QuickCheck } from "@/lib/types";
import { AnswerOption } from "./AnswerOption";

/**
 * Inline comprehension check (Lesson Player, screen 17) — a Nevo bottom sheet
 * that opens when the student moves past a segment carrying a `quickCheck`.
 * One question, one answer: a correct pick settles navy with the confirm note;
 * a miss softens to violet with the recovery note (never red — the note carries
 * the correction and always reassures continuity). Either way "Keep going" is
 * the single forward path.
 *
 * Mount keyed on the segment id so the chosen answer resets per segment.
 */
export function QuickCheckSheet({
  check,
  open,
  onOpenChange,
  onAnswered,
  onContinue,
}: {
  check: QuickCheck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired once, the moment an option is picked (Slice 5 hooks signals here). */
  onAnswered: (correct: boolean) => void;
  /** "Keep going" — close the sheet and advance. */
  onContinue: () => void;
}) {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const resolved = chosenId !== null;
  const correct = chosenId === check.correctId;

  const choose = (id: string) => {
    if (resolved) return;
    setChosenId(id);
    onAnswered(id === check.correctId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        className="rounded-t-[12px] border-0 bg-nevo-cream px-6 pt-7 pb-8 text-nevo-near-black"
      >
        <div className="mx-auto w-full max-w-[560px]">
          <p className="font-mono text-[11px] tracking-[0.12em] text-nevo-near-black/45 uppercase">
            Quick check
          </p>
          <SheetTitle className="mt-2 text-[20px] leading-[1.35] font-semibold text-nevo-near-black sm:text-[22px]">
            {check.question}
          </SheetTitle>

          <div className="mt-5 flex flex-col gap-2">
            {check.options.map((option) => (
              <AnswerOption
                key={option.id}
                label={option.label}
                chosen={chosenId === option.id}
                correct={option.id === check.correctId}
                resolved={resolved}
                onChoose={() => choose(option.id)}
              />
            ))}
          </div>

          {/* Result note — lands instantly (comprehension results never animate). */}
          {resolved && (
            <div
              role="status"
              className={
                correct
                  ? "mt-5 rounded-[12px] bg-nevo-navy p-4 text-[15px] leading-[1.5] text-nevo-cream"
                  : "mt-5 rounded-[12px] bg-nevo-violet/20 p-4 text-[15px] leading-[1.5] text-nevo-near-black"
              }
            >
              {correct ? check.correctNote : check.recoveryNote}
            </div>
          )}

          {resolved && (
            <Button className="mt-6 w-full" onClick={onContinue}>
              Keep going
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
