"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared shell for onboarding Steps 1–3 (UI/UX spec B.2): a thin progress line,
 * a back-chevron + wordmark header, and a centered single-column content area.
 * Full-viewport, no chrome, solid cream.
 */
export function OnboardingShell({
  step,
  totalSteps = 3,
  backHref,
  children,
}: {
  step: number;
  totalSteps?: number;
  backHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pct = (step / totalSteps) * 100;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      {/* Progress — position `step` of `totalSteps` */}
      <div className="h-[3px] w-full shrink-0 bg-nevo-navy/[0.12]">
        <div
          className="h-full bg-nevo-violet transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Header: back + wordmark */}
      <header className="flex h-14 shrink-0 items-center px-4 sm:h-16 sm:px-5 lg:px-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push(backHref)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/[0.06] active:bg-nevo-near-black/[0.12]"
        >
          <ChevronLeft className="size-6" strokeWidth={2} />
        </button>
        <Image
          src="/brand/nevo-wordmark.png"
          alt="Nevo"
          width={344}
          height={116}
          className="ml-1.5 h-5 w-auto sm:h-[22px] lg:h-6"
        />
      </header>

      {/* Content — single-column, packed to the top of the remaining space */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 pb-6 sm:pb-10">
        <div className="flex w-full max-w-full flex-col sm:max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}
