"use client";

import Image from "next/image";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Check } from "lucide-react";
import { NevoKeyboard } from "@/components/shared";
import { cn } from "@/lib/utils";

/**
 * PIN entry state machine. Kept as a pure reducer so the confirm/mismatch logic
 * lives in one place and rapid input (fast typing, held keys, quick taps) always
 * folds onto the latest state — no stale closures, no setState-in-effect.
 *
 * TODO(api): persist the chosen PIN via the auth client on `done`.
 */
type PinState = { digits: string; error: boolean; done: boolean };
type PinAction = { type: "digit"; value: string } | { type: "backspace" };

function pinReducer(state: PinState, action: PinAction): PinState {
  if (action.type === "backspace") {
    if (state.done) return state;
    return { digits: state.digits.slice(0, -1), error: false, done: false };
  }
  // action.type === "digit"
  if (state.done || state.digits.length >= 8) return state;
  const next = state.digits + action.value;
  if (next.length < 8) return { digits: next, error: false, done: false };
  // Eighth digit completes the confirm row — compare the two halves.
  if (next.slice(0, 4) === next.slice(4)) {
    return { digits: next, error: false, done: true };
  }
  return { digits: next.slice(0, 4), error: true, done: false }; // keep first PIN
}

/**
 * PIN Creation (UI/UX spec) — the last onboarding step before "You're In".
 *
 * Manual students set a 4-digit PIN, then re-type it to confirm; a mismatch
 * resets the confirm row with a gentle nudge (no lockouts, no attempt counter).
 * SSO students never set a PIN — they get a calm "you're signed in"
 * confirmation instead. Both paths auto-advance once settled.
 *
 * Input comes from the branded on-screen keypad (touch; shown below lg, matching
 * the design) and from the physical keyboard (desktop), so there is no reliance
 * on the OS keyboard.
 */
export function PinCreationScreen({
  sso = false,
  onComplete,
}: {
  sso?: boolean;
  onComplete: () => void;
}) {
  const [{ digits, error, done }, dispatch] = useReducer(pinReducer, {
    digits: "",
    error: false,
    done: false,
  });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Stable handlers — dispatch never goes stale, so rapid input folds correctly.
  const pressDigit = useCallback((d: string) => {
    dispatch({ type: "digit", value: d });
  }, []);
  const backspace = useCallback(() => dispatch({ type: "backspace" }), []);

  // Physical keyboard (desktop and any attached keyboard).
  useEffect(() => {
    if (sso) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        pressDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sso, pressDigit, backspace]);

  // Auto-advance once the PIN is set (manual) or the SSO confirmation lands.
  useEffect(() => {
    if (!done && !sso) return;
    const t = setTimeout(() => onCompleteRef.current?.(), sso ? 1600 : 1200);
    return () => clearTimeout(t);
  }, [done, sso]);

  const showEntry = !sso && !done;
  const showConfirmation = sso || done;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      {/* Top bar: wordmark only */}
      <div className="flex h-[60px] shrink-0 items-center px-5 sm:px-8">
        <Image
          src="/brand/nevo-wordmark.png"
          alt="Nevo"
          width={344}
          height={116}
          priority
          className="h-[18px] w-auto sm:h-5"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-10 pb-6 text-center">
        {showConfirmation && (
          <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
            <Check className="size-[34px] text-nevo-cream" strokeWidth={2.6} />
          </span>
        )}

        <h2 className="text-[23px] font-semibold tracking-[-0.01em] sm:text-[25px]">
          {sso ? "You're signed in" : done ? "You're all set" : "Create a PIN"}
        </h2>
        <p className="mt-3 text-[15px] text-nevo-near-black/60">
          {sso ? "We'll remember you next time" : "You'll use this to log in next time"}
        </p>

        {showEntry && (
          <>
            <PinRow filled={digits.length} offset={0} caretAt={digits.length} error={false} />
            <p className="mt-7 mb-3 text-sm font-medium">Type it again to confirm</p>
            <PinRow
              filled={digits.length}
              offset={4}
              caretAt={digits.length}
              error={error}
            />
            <p
              role="alert"
              className="mt-4 min-h-5 text-sm text-nevo-violet"
            >
              {error ? "Those didn't match - let's try once more" : ""}
            </p>
          </>
        )}
      </div>

      {showEntry && (
        <NevoKeyboard
          layout="pad"
          onKey={pressDigit}
          onBackspace={backspace}
          className="lg:hidden"
        />
      )}
    </div>
  );
}

/** One row of four PIN boxes. `offset` is the absolute index of its first box. */
function PinRow({
  filled,
  offset,
  caretAt,
  error,
}: {
  filled: number;
  offset: number;
  caretAt: number;
  error: boolean;
}) {
  return (
    <div className={cn("flex gap-3", offset === 0 && "mt-10")}>
      {[0, 1, 2, 3].map((i) => {
        const idx = offset + i;
        const isFilled = filled > idx;
        const isActive = idx === caretAt;
        return (
          <div
            key={idx}
            className={cn(
              "flex size-12 items-center justify-center rounded-[10px] border-[1.5px] bg-nevo-cream shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
              isActive
                ? "border-nevo-navy"
                : error
                  ? "border-nevo-violet"
                  : "border-nevo-near-black/20",
            )}
          >
            {isFilled && <span className="size-3 rounded-full bg-nevo-near-black" />}
          </div>
        );
      })}
    </div>
  );
}

