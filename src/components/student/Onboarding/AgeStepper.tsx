"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const AGE_MIN = 5;
export const AGE_MAX = 18;
const AGE_DEFAULT = 11;

/** True when `value` parses to an age within the accepted range. */
export function isAgeInRange(value: string): boolean {
  const n = parseInt(value, 10);
  return !Number.isNaN(n) && n >= AGE_MIN && n <= AGE_MAX;
}

const clamp = (v: number) => Math.max(AGE_MIN, Math.min(AGE_MAX, v));

/**
 * Age picker (UI/UX spec B.2 Step 1). Large tap-target stepper with a directly
 * editable numeric field. First +/- from empty jumps to the default age; typing
 * is digits-only and clamps to range on blur.
 */
export function AgeStepper({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = value === "" ? null : parseInt(value, 10);
  const age = parsed === null || Number.isNaN(parsed) ? null : parsed;
  const inRange = age !== null && age >= AGE_MIN && age <= AGE_MAX;
  const decDisabled = inRange && age <= AGE_MIN;
  const incDisabled = inRange && age >= AGE_MAX;

  const step = (delta: number) =>
    onChange(String(age === null ? AGE_DEFAULT : clamp(age + delta)));

  const commit = () => {
    if (value === "") return;
    const p = parseInt(value, 10);
    onChange(Number.isNaN(p) ? "" : String(clamp(p)));
  };

  const btnBase =
    "flex size-12 items-center justify-center rounded-[10px] border-[1.5px] transition-colors";
  const btnActive =
    "cursor-pointer border-nevo-navy text-nevo-navy hover:bg-nevo-navy/[0.06]";
  const btnOff =
    "cursor-not-allowed border-nevo-near-black/[0.14] text-nevo-near-black/[0.32]";

  return (
    <div className="flex h-18 w-full items-center justify-between rounded-[10px] border-[1.5px] border-nevo-near-black/[0.16] bg-nevo-cream px-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        aria-label="Decrease age"
        disabled={decDisabled}
        onClick={() => step(-1)}
        className={cn(btnBase, decDisabled ? btnOff : btnActive)}
      >
        <Minus className="size-5" strokeWidth={2.2} />
      </button>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
        }
        onBlur={commit}
        inputMode="numeric"
        aria-label="Age"
        placeholder="—"
        className="w-18 bg-transparent text-center text-[28px] font-semibold tracking-[-0.01em] text-nevo-near-black tabular-nums outline-none placeholder:text-nevo-near-black/40"
      />

      <button
        type="button"
        aria-label="Increase age"
        disabled={incDisabled}
        onClick={() => step(1)}
        className={cn(btnBase, incDisabled ? btnOff : btnActive)}
      >
        <Plus className="size-5" strokeWidth={2.2} />
      </button>
    </div>
  );
}
