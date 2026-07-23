"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Switch } from "@/components/shared";
import { MOCK_STUDENT } from "@/components/student/Shell/studentNav";
import { cn } from "@/lib/utils";
import {
  MOCK_CHANNEL_CONFIDENCE,
  NO_CHANNELS_LINE,
  visibleChannelStatements,
} from "./learningChannels";

const TEXT_SIZES = [
  { id: "s", label: "S", px: 14 },
  { id: "m", label: "M", px: 16 },
  { id: "l", label: "L", px: 19 },
  { id: "xl", label: "XL", px: 22 },
] as const;

type TextSize = (typeof TEXT_SIZES)[number]["id"];

/**
 * Profile & Settings (screen 27). Read-only learning preferences (observed, not
 * self-reported), accessibility controls, break preference, and account. Every
 * change is acknowledged with a quiet "Saved" pill.
 *
 * The accessibility controls persist their selection here; applying them across
 * the whole app (reduced-motion override, font scaling, high contrast) is the
 * separate global-wiring story. TODO(a11y-story): wire + persist app-wide.
 */
export function ProfileSettings() {
  const statements = visibleChannelStatements(MOCK_CHANNEL_CONFIDENCE);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [suggestBreaks, setSuggestBreaks] = useState(true);
  const [textSize, setTextSize] = useState<TextSize>("m");

  // Transient "Saved" confirmation.
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);
  const flashSaved = useCallback(() => {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1700);
  }, []);

  const previewPx = TEXT_SIZES.find((s) => s.id === textSize)?.px ?? 16;

  return (
    <div className="mx-auto w-full max-w-[600px] px-5 py-2 pb-8 sm:px-8 sm:py-6">
      <h1 className="text-2xl font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
        Profile &amp; Settings
      </h1>

      {/* How you learn — read-only, observed channels (medium/high only) */}
      <SectionHeading>How you learn</SectionHeading>
      {statements.length === 0 ? (
        <p className="text-[15px] leading-[1.55] text-nevo-near-black/70">
          {NO_CHANNELS_LINE}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {statements.map((statement) => (
              <div
                key={statement}
                className="rounded-[12px] bg-nevo-cream-elevated p-4 text-[15px] leading-[1.5] text-nevo-near-black shadow-elevation-1"
              >
                {statement}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-nevo-near-black/50">
            {NO_CHANNELS_LINE}
          </p>
        </>
      )}

      {/* Accessibility */}
      <SectionHeading>Accessibility</SectionHeading>
      <SettingRow label="Reduced motion">
        <Switch
          checked={reducedMotion}
          onCheckedChange={(v) => {
            setReducedMotion(v);
            flashSaved();
          }}
          aria-label="Reduced motion"
        />
      </SettingRow>

      <div className="py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-nevo-near-black">Text size</span>
          <div className="flex gap-1 rounded-full bg-nevo-near-black/6 p-[3px]">
            {TEXT_SIZES.map((size) => (
              <button
                key={size.id}
                type="button"
                aria-pressed={textSize === size.id}
                onClick={() => {
                  setTextSize(size.id);
                  flashSaved();
                }}
                className={cn(
                  "min-w-8 cursor-pointer rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  textSize === size.id
                    ? "bg-nevo-navy text-nevo-cream"
                    : "text-nevo-near-black",
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
        <p
          className="mt-3 text-nevo-near-black/72"
          style={{ fontSize: `${previewPx}px` }}
        >
          The quick brown fox
        </p>
      </div>

      <SettingRow label="High contrast">
        <Switch
          checked={highContrast}
          onCheckedChange={(v) => {
            setHighContrast(v);
            flashSaved();
          }}
          aria-label="High contrast"
        />
      </SettingRow>

      {/* Breaks */}
      <SectionHeading>Breaks</SectionHeading>
      <div className="flex items-center justify-between py-1.5">
        <span className="text-[15px] text-nevo-near-black">
          Suggest breaks automatically
        </span>
        <Switch
          checked={suggestBreaks}
          onCheckedChange={(v) => {
            setSuggestBreaks(v);
            flashSaved();
          }}
          aria-label="Suggest breaks automatically"
        />
      </div>
      <p className="mt-1 text-[13px] text-nevo-near-black/60">
        Nevo will still check in during moments that really call for a break
      </p>

      {/* Account */}
      <SectionHeading>Account</SectionHeading>
      <div className="flex items-center gap-3.5 py-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-nevo-navy text-xl font-semibold text-nevo-cream">
          {MOCK_STUDENT.initials}
        </span>
        <button
          type="button"
          className="cursor-pointer text-[15px] font-medium text-nevo-navy"
          // TODO(account): edit name/avatar flow.
        >
          Change
        </button>
      </div>
      <button
        type="button"
        // TODO(pin): open the Change PIN flow (reuses the onboarding PIN pattern).
        className="flex w-full cursor-pointer items-center justify-between border-t border-nevo-near-black/8 py-4 text-left"
      >
        <span className="text-[15px] text-nevo-near-black">Change PIN</span>
        <ChevronRight className="size-5 text-nevo-near-black/40" strokeWidth={2} />
      </button>

      {/* Saved confirmation — quiet, transient, non-blocking */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-nevo-cream-elevated px-4 py-2 shadow-elevation-3 transition-all duration-200",
          saved ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-nevo-navy">
          <Check className="size-3 text-nevo-cream" strokeWidth={2.8} />
        </span>
        <span className="text-sm font-medium text-nevo-near-black">Saved</span>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 text-base font-semibold text-nevo-near-black">
      {children}
    </h2>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-[15px] text-nevo-near-black">{label}</span>
      {children}
    </div>
  );
}
