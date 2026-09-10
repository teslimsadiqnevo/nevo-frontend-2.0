"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { NevoKeyboard } from "@/components/shared";
import { cn } from "@/lib/utils";

export type CodeStatus = "idle" | "pending" | "success" | "error";

/** `SchoolCodeRequest` is minLength 2, maxLength 50. */
export const CODE_MIN = 2;
export const CODE_MAX = 50;

/** Uppercase; letters, digits and the hyphen real codes use. */
export function normaliseCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, CODE_MAX);
}

export function codeIsEnterable(code: string): boolean {
  return code.trim().length >= CODE_MIN;
}

/**
 * School-code entry (UI/UX spec B.2 Step 2).
 *
 * THIS USED TO BE FOUR BOXES BEHIND A FIXED `NEVO–` PREFIX, and it was the wall
 * every child hit. Real codes are neither: our own E2E tenant's is `751A1136`
 * (eight characters, no prefix) and `BGA-4827` is another shape again. The step
 * posted `NEVO-${entered}`, `SchoolCodeRequest` is an exact 2-50 character
 * lookup with no server-side normalisation to rescue it, and Continue was gated
 * on a success that could never arrive. Every entrance funnels through here, so
 * no child could reach the product at all.
 *
 * SO IT NO LONGER GUESSES A SHAPE. Swapping four boxes for eight would have
 * been the same mistake with a different number - the contract says 2 to 50
 * arbitrary characters, and a fixed-length field is a guess about a format that
 * is not ours to decide. One field, uppercased, trimmed, hyphen kept, and the
 * SERVER decides whether it names a school.
 *
 * A code is submitted deliberately - Return, or the step's own button - rather
 * than fired the moment it looks full, because with no fixed length there is no
 * such moment, and checking on every keystroke would tell a child their
 * half-typed code was wrong.
 */
export function SchoolCodeInput({
  value,
  onChange,
  onSubmit,
  status,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Return, or an on-screen keyboard's return key. */
  onSubmit: (code: string) => void;
  status: CodeStatus;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [kbOpen, setKbOpen] = useState(false);

  const submit = () => {
    const code = value.trim();
    if (codeIsEnterable(code)) onSubmit(code);
  };

  const fieldBorder =
    status === "success"
      ? "border-nevo-navy"
      : status === "error"
        ? "border-nevo-violet"
        : "border-nevo-near-black/[0.16]";

  return (
    <div
      className={cn(
        "relative flex h-15 w-full items-center rounded-[10px] border-[1.5px] bg-nevo-cream px-4 shadow-elevation-1 transition-colors sm:h-17",
        fieldBorder,
      )}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(normaliseCode(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        onFocus={() => setKbOpen(true)}
        // ~120ms debounce per the handoff's keyboard-docking guidance.
        onBlur={() => {
          setTimeout(() => {
            if (document.activeElement !== inputRef.current) setKbOpen(false);
          }, 120);
        }}
        maxLength={CODE_MAX}
        // A.12: the Nevo Keyboard is the input on touch; a hardware keyboard
        // still types on desktop, where the on-screen one is hidden.
        inputMode="none"
        autoComplete="off"
        autoCapitalize="characters"
        autoFocus
        enterKeyHint="go"
        aria-label="School code"
        placeholder="Type your school code"
        className="h-full min-w-0 flex-1 bg-transparent pr-8 text-[22px] font-bold tracking-[0.06em] text-nevo-near-black uppercase outline-none placeholder:text-[15px] placeholder:font-normal placeholder:tracking-normal placeholder:text-nevo-near-black/35 sm:text-[26px]"
      />

      {(status === "pending" || status === "success") && (
        <div className="absolute top-1/2 right-4 flex size-7 -translate-y-1/2 items-center justify-center">
          {status === "pending" ? (
            <span className="size-5 rounded-full border-[2.5px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin" />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200">
              <Check className="size-4 text-nevo-cream" strokeWidth={2.6} />
            </span>
          )}
        </div>
      )}

      {kbOpen && (
        <NevoKeyboard
          layout="qwerty"
          onKey={(ch) => onChange(normaliseCode(value + ch))}
          onBackspace={() => onChange(value.slice(0, -1))}
          onReturn={submit}
          className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        />
      )}
    </div>
  );
}
