"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One answer card, shared by the Quick Check and the after-lesson assessment.
 * Resolution follows the DS state philosophy: the chosen-correct card settles
 * navy, a chosen miss softens to violet — never red, never an alarm. Once the
 * question resolves nothing animates (comprehension results land instantly) and
 * the other options quiet down.
 */
export function AnswerOption({
  label,
  chosen,
  correct,
  resolved,
  onChoose,
}: {
  label: string;
  /** This option is the one the student picked. */
  chosen: boolean;
  /** The pick was right (only meaningful when `chosen`). */
  correct: boolean;
  /** The question has been answered — options stop being tappable. */
  resolved: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      disabled={resolved}
      onClick={onChoose}
      aria-pressed={chosen}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-[12px] border-[1.5px] px-4 py-3.5 text-left text-[15px] font-medium sm:text-base",
        !resolved &&
          "cursor-pointer border-nevo-near-black/10 bg-nevo-cream-elevated transition-colors hover:border-nevo-near-black/25",
        resolved && chosen && correct && "border-nevo-navy bg-nevo-navy text-nevo-cream",
        resolved && chosen && !correct && "border-nevo-violet bg-nevo-violet/20 text-nevo-near-black",
        resolved && !chosen && "border-transparent bg-nevo-cream-elevated opacity-50",
      )}
    >
      <span>{label}</span>
      {resolved && chosen && correct && (
        <Check className="size-5 shrink-0" strokeWidth={2.5} />
      )}
    </button>
  );
}
