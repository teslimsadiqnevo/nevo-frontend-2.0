import Link from "next/link";
import type { TeacherFlag } from "@/hooks/useTeacherFlags";
import { cn } from "@/lib/utils";

/**
 * One live "Worth your attention" card.
 *
 * C03's card pairs the note with a five-bar evidence sparkline, a caption
 * under it, and two actions. The flag endpoint carries none of that - no
 * series, no target - so this card keeps what is real: the accent, who it is
 * about, what Nevo noticed, when, and the one action that works.
 *
 * The student profile is not linked. `/teacher/students/{id}` resolves against
 * fixtures and would 404 on a real student id, and a flag that dead-ends is
 * worse than a flag that only offers what it can.
 */

const DROP_GLYPH = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v9" />
    <path d="M8 11l4 4 4-4" />
  </svg>
);

function noticedWhen(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return "just now";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

export function LiveFlagCard({ flag }: { flag: TeacherFlag }) {
  return (
    <div className="relative flex gap-3.5 rounded-[12px] bg-nevo-cream-elevated py-4 pr-[18px] pl-[22px] shadow-elevation-1 xl:gap-[18px] xl:py-[22px] xl:pr-6 xl:pl-7">
      {/* Navy for a sudden change, violet for a pattern - C03's own rule. */}
      <span
        className={cn(
          "absolute inset-y-4 left-0 w-[3px] rounded-full",
          flag.isSudden ? "bg-nevo-navy" : "bg-nevo-violet",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 xl:gap-[9px]">
          {flag.isSudden && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-nevo-navy text-nevo-cream xl:size-[22px]">
              {DROP_GLYPH}
            </span>
          )}
          <span className="text-[15.5px] font-semibold tracking-[-0.01em] text-nevo-near-black xl:text-[16.5px]">
            {flag.name ?? "One of your students"}
          </span>
          <span className="text-[12.5px] text-nevo-near-black/50 xl:text-[13px]">
            {[flag.context, `noticed ${noticedWhen(flag.generatedAt)}`]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        <p className="mt-[7px] text-[14.5px] leading-[1.5] text-nevo-near-black/82 xl:mt-[9px] xl:text-[15.5px] xl:leading-[1.55]">
          {flag.note}
        </p>
        <div className="mt-3 xl:mt-[18px]">
          <Link
            href="/teacher/connect"
            className="text-[13.5px] font-semibold text-nevo-navy transition-transform active:scale-[0.985] xl:text-[14.5px]"
          >
            Send them a message
            <span className="ml-1.5">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
