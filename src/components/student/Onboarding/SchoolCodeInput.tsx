"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { NevoKeyboard } from "@/components/shared";
import { cn } from "@/lib/utils";

export type CodeStatus = "idle" | "pending" | "success" | "error";

const CODE_LENGTH = 4;

/**
 * School-code entry (UI/UX spec B.2 Step 2). Renders the fixed `NEVO–` prefix
 * plus a 4-character code field: auto-advancing single-char boxes, uppercase
 * alphanumeric, backspace steps back. Border colour + trailing icon reflect the
 * validation status (idle / pending / success / warm-toned error).
 */
export function SchoolCodeInput({
  value,
  onChange,
  onComplete,
  status,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  onComplete: (code: string) => void;
  status: CodeStatus;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  // A.12: the Nevo Keyboard opens while a code box is focused (touch). It stays
  // open across the auto-advance between boxes; a hardware keyboard still types
  // on desktop, where the on-screen one is hidden.
  const [activeIndex, setActiveIndex] = useState(0);
  const [kbOpen, setKbOpen] = useState(false);

  const setChar = (i: number, raw: string) => {
    const ch = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const next = value.slice();
    next[i] = ch;
    onChange(next);
    if (ch && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus();
    if (next.every((c) => c !== "")) onComplete(next.join(""));
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault();
      const next = value.slice();
      next[i - 1] = "";
      onChange(next);
      refs.current[i - 1]?.focus();
    }
  };

  // On-screen backspace: clear the active box, or step back and clear the previous.
  const kbBackspace = () => {
    const next = value.slice();
    if (value[activeIndex]) {
      next[activeIndex] = "";
      onChange(next);
    } else if (activeIndex > 0) {
      next[activeIndex - 1] = "";
      onChange(next);
      refs.current[activeIndex - 1]?.focus();
    }
  };

  // Close only when focus leaves the field entirely (not on auto-advance).
  // ~120ms debounce per the frontend handoff's keyboard-docking guidance.
  const handleBlur = () => {
    setTimeout(() => {
      if (!refs.current.some((el) => el && el === document.activeElement)) {
        setKbOpen(false);
      }
    }, 120);
  };

  const fieldBorder =
    status === "success"
      ? "border-nevo-navy"
      : status === "error"
        ? "border-nevo-violet"
        : "border-nevo-near-black/[0.16]";
  const boxBorder =
    status === "success"
      ? "border-b-nevo-navy"
      : status === "error"
        ? "border-b-nevo-violet"
        : "border-b-nevo-near-black/[0.32]";

  return (
    <div
      className={cn(
        "relative flex h-15 w-full items-center justify-center rounded-[10px] border-[1.5px] bg-nevo-cream px-4 shadow-elevation-1 transition-colors sm:h-17",
        fieldBorder,
      )}
    >
      <span className="text-[22px] font-bold tracking-[0.04em] text-nevo-navy sm:text-[28px]">
        NEVO
      </span>
      <span className="mx-[7px] text-[22px] font-bold text-nevo-near-black/30 sm:mx-2 sm:text-[28px]">
        –
      </span>

      <div className="flex gap-2.5 sm:gap-3">
        {value.map((c, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={c}
            onChange={(e) => setChar(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={() => {
              setActiveIndex(i);
              setKbOpen(true);
            }}
            onBlur={handleBlur}
            maxLength={1}
            inputMode="none"
            autoComplete="off"
            autoFocus={i === 0}
            aria-label={`Code character ${i + 1}`}
            className={cn(
              "h-8 w-[38px] border-0 border-b-2 bg-transparent text-center text-[23px] font-bold uppercase tracking-[0.02em] text-nevo-near-black outline-none transition-colors sm:h-[38px] sm:w-11 sm:text-[28px]",
              boxBorder,
            )}
          />
        ))}
      </div>

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
          onKey={(ch) => setChar(activeIndex, ch)}
          onBackspace={kbBackspace}
          className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        />
      )}
    </div>
  );
}
