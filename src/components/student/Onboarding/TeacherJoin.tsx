"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { NevoKeyboard, useNevoKeyboardDock } from "@/components/shared";
import { cn } from "@/lib/utils";

/** Mock class code. `POST /api/v1/connections/class-code` exists (the code
 *  rides a `class_code` query param on a POST - flagged) but is Bearer-only,
 *  and this step runs before any session exists - so a real join cannot
 *  happen here. The picked class rides the onboarding draft instead; flagged
 *  to backend: either the endpoint accepts the pre-auth flow, or the join
 *  fires after first sign-in. TODO(api). */
const VALID_CODE = "MAP4KZ";
/** Mock validation beat. */
const VALIDATE_MS = 700;
/** Simulated scan phases until real QR capture lands. TODO(api). */
const SCAN_CONNECTING_AT_MS = 2600;
const SCAN_CONNECTED_AT_MS = 4100;
const SCAN_DONE_AT_MS = 5300;

/** After a successful join the manual flow resumes at the name step. */
const NEXT_STEP = "/student/onboarding/name";

type Mode = "scan" | "code";
type CodeStatus = "idle" | "pending" | "success" | "error";
type ScanPhase = "scanning" | "connecting" | "connected";

/**
 * Teacher Join (screen 03 / `Nevo Teacher Join Frame`) - reached from the
 * Welcome screen's teacher-invite sheet. Two ways in, freely switchable:
 * scan the class QR code, or type the six-character code the teacher reads
 * out. Success connects the class and resumes onboarding; a miss is quiet
 * violet, never red, and always points back to the teacher.
 */
export function TeacherJoin() {
  const router = useRouter();
  const params = useSearchParams();
  // A scanned class QR (C12) carries the code, so open straight into it.
  const scannedCode = params.get("code") ?? "";
  const initialMode =
    params.get("mode") === "code" || scannedCode ? "code" : "scan";
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      <header className="flex h-14 shrink-0 items-center px-4 sm:h-16 sm:px-5">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/6"
        >
          <ChevronLeft className="size-6" strokeWidth={2} />
        </button>
        <Image
          src="/brand/nevo-wordmark.png"
          alt="Nevo"
          width={344}
          height={116}
          priority
          className="ml-1.5 h-4 w-auto sm:h-[18px]"
        />
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-4 pb-7 sm:justify-center sm:pt-0 sm:pb-11">
        {mode === "scan" ? (
          <ScanMode onSwitch={() => setMode("code")} onJoined={() => router.push(NEXT_STEP)} />
        ) : (
          <CodeMode initial={scannedCode} onSwitch={() => setMode("scan")} onJoined={() => router.push(NEXT_STEP)} />
        )}
      </div>
    </div>
  );
}

/** The QR viewfinder - simulated phases until real capture lands (TODO(api)). */
function ScanMode({ onSwitch, onJoined }: { onSwitch: () => void; onJoined: () => void }) {
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const onJoinedRef = useRef(onJoined);
  useEffect(() => {
    onJoinedRef.current = onJoined;
  }, [onJoined]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("connecting"), SCAN_CONNECTING_AT_MS);
    const t2 = setTimeout(() => setPhase("connected"), SCAN_CONNECTED_AT_MS);
    const t3 = setTimeout(() => onJoinedRef.current(), SCAN_DONE_AT_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const hint =
    phase === "scanning"
      ? "Looking for a code…"
      : phase === "connecting"
        ? "Found it - connecting you…"
        : "You're in - opening your class…";

  const bracket =
    "absolute size-[34px] border-nevo-violet";

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center text-center">
      <h1 className="text-[21px] leading-[1.25] font-semibold tracking-[-0.01em] sm:text-2xl">
        Point your camera at the QR code
      </h1>
      <p className="mt-3 max-w-[320px] text-[15px] leading-[1.55] text-nevo-near-black/66 sm:text-base">
        Ask your teacher to show it, then hold your device steady.
      </p>

      <div
        className="relative mt-8 size-[258px] shrink-0 overflow-hidden rounded-[20px] bg-nevo-near-black shadow-[0_8px_32px_rgba(0,0,0,0.16)] sm:size-[300px]"
        style={{ "--scan-travel": "214px" } as React.CSSProperties}
      >
        {phase === "scanning" && (
          <div className="absolute inset-x-4 top-[22px] h-0.5 rounded-full bg-nevo-violet/85 shadow-[0_0_18px_2px_rgba(154,156,203,0.5)] motion-safe:animate-nevo-scanline" />
        )}
        <span className={cn(bracket, "top-4 left-4 rounded-tl-[10px] border-t-[3px] border-l-[3px]")} />
        <span className={cn(bracket, "top-4 right-4 rounded-tr-[10px] border-t-[3px] border-r-[3px]")} />
        <span className={cn(bracket, "bottom-4 left-4 rounded-bl-[10px] border-b-[3px] border-l-[3px]")} />
        <span className={cn(bracket, "right-4 bottom-4 rounded-br-[10px] border-r-[3px] border-b-[3px]")} />
        {phase !== "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center bg-nevo-near-black/62">
            {phase === "connecting" ? (
              <span className="block size-9 rounded-full border-[3px] border-nevo-cream/25 border-t-nevo-cream motion-safe:animate-spin motion-safe:[animation-duration:720ms]" />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-full bg-nevo-violet motion-safe:animate-nevo-pop">
                <Check className="size-7 text-nevo-cream" strokeWidth={2.6} />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-[22px] flex items-center gap-2.5">
        <span
          className={cn(
            "size-2 rounded-full",
            phase === "connected" ? "bg-nevo-navy" : "bg-nevo-violet",
          )}
        />
        <span className="text-sm text-nevo-near-black/66">{hint}</span>
      </div>

      <button
        type="button"
        onClick={onSwitch}
        className="mt-7 h-11 cursor-pointer rounded-[10px] px-[18px] text-[15px] font-medium text-nevo-navy transition-colors hover:bg-nevo-near-black/5"
      >
        Enter a code instead
      </button>
    </div>
  );
}

/** Six underline boxes, auto-advancing, validating quietly once full. */
function CodeMode({
  initial = "",
  onSwitch,
  onJoined,
}: {
  /** Prefilled when the student arrived by scanning the class QR. */
  initial?: string;
  onSwitch: () => void;
  onJoined: () => void;
}) {
  const prefilled = initial.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const scannedComplete = prefilled.length === 6;
  const [code, setCode] = useState<string[]>(() =>
    Array.from({ length: 6 }, (_, i) => prefilled[i] ?? ""),
  );
  // Seeded here rather than set inside the effect, so the effect body stays
  // free of synchronous setState.
  const [status, setStatus] = useState<CodeStatus>(
    scannedComplete ? "pending" : "idle",
  );
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusedIndex = useRef(0);
  const validateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kb = useNevoKeyboardDock();

  useEffect(() => () => {
    if (validateTimer.current) clearTimeout(validateTimer.current);
  }, []);

  const validate = (next: string[]) => {
    setStatus("pending");
    if (validateTimer.current) clearTimeout(validateTimer.current);
    // TODO(api): roster lookup replaces the mock class code.
    validateTimer.current = setTimeout(() => {
      setStatus(next.join("") === VALID_CODE ? "success" : "error");
    }, VALIDATE_MS);
  };

  // A scanned code arrives complete, so resolve it without making the student
  // retype a character to wake the check up.
  useEffect(() => {
    if (!scannedComplete) return;
    // TODO(api): roster lookup replaces the mock class code.
    const t = setTimeout(() => {
      setStatus(prefilled === VALID_CODE ? "success" : "error");
    }, VALIDATE_MS);
    return () => clearTimeout(t);
  }, [scannedComplete, prefilled]);

  const setChar = (i: number, raw: string) => {
    const ch = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const next = code.slice();
    next[i] = ch;
    if (validateTimer.current) clearTimeout(validateTimer.current);
    setCode(next);
    setStatus("idle");
    if (ch && i < 5) boxRefs.current[i + 1]?.focus();
    if (next.every((c) => c !== "")) validate(next);
  };

  const backspace = () => {
    const i = focusedIndex.current;
    const next = code.slice();
    if (next[i]) next[i] = "";
    else if (i > 0) {
      next[i - 1] = "";
      boxRefs.current[i - 1]?.focus();
    }
    setCode(next);
    setStatus("idle");
  };

  const continueTap = () => {
    if (status === "success") {
      onJoined();
      return;
    }
    // Pressable, not disabled: an early tap helpfully points at the gap.
    const firstEmpty = code.findIndex((c) => c === "");
    boxRefs.current[firstEmpty === -1 ? 0 : firstEmpty]?.focus();
  };

  const borderTone =
    status === "success"
      ? "border-nevo-navy"
      : status === "error"
        ? "border-nevo-violet"
        : "border-nevo-near-black/16";
  const boxTone =
    status === "success"
      ? "border-b-nevo-navy"
      : status === "error"
        ? "border-b-nevo-violet"
        : "border-b-nevo-near-black/32";

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center text-center">
      <h1 className="text-[21px] leading-[1.25] font-semibold tracking-[-0.01em] sm:text-2xl">
        Enter your class code
      </h1>
      <p className="mt-3 max-w-[320px] text-[15px] leading-[1.55] text-nevo-near-black/66 sm:text-base">
        Your teacher will read this out to you.
      </p>

      <div
        className={cn(
          "relative mt-8 flex h-16 w-full items-center justify-center rounded-[10px] border-[1.5px] bg-nevo-cream pr-4 pl-4 shadow-elevation-1 transition-colors sm:h-[72px]",
          borderTone,
          (status === "pending" || status === "success") && "pr-[46px]",
        )}
      >
        <div className="flex gap-2 sm:gap-3">
          {code.map((value, i) => (
            <input
              key={i}
              ref={(el) => {
                boxRefs.current[i] = el;
              }}
              value={value}
              maxLength={1}
              autoComplete="off"
              // A.12: the Nevo Keyboard drives entry on touch.
              inputMode="none"
              aria-label={`Code character ${i + 1}`}
              onChange={(e) => setChar(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  e.preventDefault();
                  backspace();
                }
              }}
              onFocus={() => {
                focusedIndex.current = i;
                kb.onFocus();
              }}
              onBlur={kb.onBlur}
              className={cn(
                "h-9 w-9 border-0 border-b-2 bg-transparent text-center text-[22px] font-bold tracking-[0.02em] text-nevo-near-black uppercase outline-none transition-colors sm:h-10 sm:w-11 sm:text-[26px]",
                boxTone,
              )}
            />
          ))}
        </div>
        {(status === "pending" || status === "success") && (
          <span className="absolute top-1/2 right-3.5 flex size-7 -translate-y-1/2 items-center justify-center">
            {status === "pending" ? (
              <span className="block size-5 rounded-full border-[2.5px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:700ms]" />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
                <Check className="size-4 text-nevo-cream" strokeWidth={2.6} />
              </span>
            )}
          </span>
        )}
      </div>

      <div className="mt-3 min-h-[22px]">
        {status === "success" && (
          <p className="text-sm text-nevo-navy">
            That&apos;s it - connecting you to your class…
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-nevo-violet">
            That code doesn&apos;t match a class. Check it with your teacher.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={continueTap}
        className={cn(
          "mt-5 flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[10px] bg-nevo-navy text-base font-medium text-nevo-cream transition-[opacity,filter] hover:brightness-106 active:scale-[0.99]",
          status !== "success" && "opacity-40",
        )}
      >
        Continue
      </button>

      <button
        type="button"
        onClick={onSwitch}
        className="mt-[18px] h-11 cursor-pointer rounded-[10px] px-[18px] text-[15px] font-medium text-nevo-navy transition-colors hover:bg-nevo-near-black/5"
      >
        Scan a QR code instead
      </button>

      {kb.open && (
        <NevoKeyboard
          layout="qwerty"
          onKey={(c) => setChar(focusedIndex.current, c)}
          onBackspace={backspace}
          onReturn={kb.close}
          className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        />
      )}
    </div>
  );
}
