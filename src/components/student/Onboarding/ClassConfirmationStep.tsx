"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { IllustrationWrapper } from "@/components/shared";
import { OnboardingShell } from "./OnboardingShell";

const NEXT_STEP = "/student/onboarding/sequence";

// TODO(api): replace with the school's actual class roster. Auto-skip when a
// single class matches; show the searchable list when several do.
const DEMO_CLASSES = [
  "Year 2 Wrens",
  "Year 2 Sparrows",
  "Year 3 Robins",
  "Year 3 Swifts",
  "Year 3 Larks",
  "Year 4 Falcons",
  "Year 4 Kingfishers",
  "Year 4 Herons",
  "Year 5 Otters",
  "Year 5 Badgers",
  "Year 5 Voles",
  "Year 6 Foxes",
  "Year 6 Hawks",
  "Year 6 Ravens",
];

/**
 * Onboarding Step 3 — Class Confirmation (UI/UX spec B.2 Step 3). One class →
 * auto-skip (brief confirming toast, then advance). Several → a searchable list;
 * tapping a class highlights it and advances. Class names come from the school
 * roster verbatim (no Nevo-imposed naming).
 */
export function ClassConfirmationStep({
  classes = DEMO_CLASSES,
}: {
  classes?: string[];
}) {
  const router = useRouter();
  const mode = classes.length === 1 ? "autoskip" : "select";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const navT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (navT.current) clearTimeout(navT.current);
  }, []);

  // Auto-skip: show the confirmation briefly, then advance.
  useEffect(() => {
    if (mode !== "autoskip") return;
    const t = setTimeout(() => router.push(NEXT_STEP), 1400);
    return () => clearTimeout(t);
  }, [mode, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === "" ? classes : classes.filter((c) => c.toLowerCase().includes(q));
  }, [classes, query]);

  const pick = (name: string) => {
    setSelected(name);
    if (navT.current) clearTimeout(navT.current);
    navT.current = setTimeout(() => router.push(NEXT_STEP), 480);
  };

  if (mode === "autoskip") {
    return (
      <OnboardingShell step={3} backHref="/student/onboarding/school" fill>
        <div className="fixed top-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-nevo-cream py-2 pr-5 pl-2 shadow-elevation-2 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 sm:top-7">
          <span className="flex size-[26px] items-center justify-center rounded-full bg-nevo-navy sm:size-[30px]">
            <Check className="size-[15px] text-nevo-cream sm:size-[17px]" strokeWidth={2.6} />
          </span>
          <span className="text-[15px] font-medium whitespace-nowrap text-nevo-near-black sm:text-[17px]">
            You&apos;re in {classes[0]}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <IllustrationWrapper
            src="/illustrations/onboarding-class.png"
            alt="Three friendly classmates standing together"
            width={941}
            height={912}
            priority
            className="w-[92px] sm:w-[120px] lg:w-[138px]"
          />
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step={3} backHref="/student/onboarding/school" fill>
      <div className="flex shrink-0 justify-center">
        <IllustrationWrapper
          src="/illustrations/onboarding-class.png"
          alt="Three friendly classmates standing together"
          width={941}
          height={912}
          priority
          className="mt-2 w-[92px] sm:w-[120px] lg:w-[138px]"
        />
      </div>

      <h2 className="mt-[18px] shrink-0 text-[23px] font-medium leading-[1.25] tracking-[-0.01em] text-nevo-near-black sm:mt-6 sm:text-[26px] lg:mt-[18px]">
        Which class are you in?
      </h2>

      <div className="mt-4 flex h-13 shrink-0 items-center gap-2.5 rounded-[10px] border-[1.5px] border-nevo-near-black/[0.16] bg-nevo-cream px-4 shadow-elevation-1">
        <Search
          className="size-5 shrink-0 text-nevo-near-black/45"
          strokeWidth={2}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for your class"
          autoComplete="off"
          aria-label="Search for your class"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-nevo-near-black outline-none placeholder:text-nevo-near-black/40"
        />
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {filtered.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => pick(name)}
            className={cn(
              "flex h-15 shrink-0 items-center justify-between rounded-xl border-[1.5px] bg-nevo-cream-elevated px-[18px] text-left shadow-elevation-1 transition hover:brightness-[0.97] active:brightness-[0.94] sm:h-16",
              selected === name ? "border-nevo-navy" : "border-transparent",
            )}
          >
            <span className="text-base font-medium text-nevo-near-black sm:text-[17px]">
              {name}
            </span>
            <ChevronRight
              className="size-5 shrink-0 text-nevo-navy"
              strokeWidth={2}
            />
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="mt-2 px-1 text-sm leading-[1.5] text-nevo-near-black/55">
            No classes match that. Check the spelling, or ask your teacher for the
            exact name.
          </p>
        )}
      </div>
    </OnboardingShell>
  );
}
