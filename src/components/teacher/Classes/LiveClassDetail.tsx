"use client";

import Link from "next/link";
import { useState } from "react";
import type { AssignedClass } from "@/lib/api";
import { ClassQrDialog, ClassQrScreen } from "./ClassQr";

/**
 * A class the school has assigned that the console has no detail for yet -
 * the backend serves assignments but no roster, lessons or activity. Rather
 * than dead-ending (or inventing a roster), this gives the teacher the one
 * thing that genuinely works today: the real class code, projectable, so
 * students can join.
 *
 * TODO(api): folds into the full class detail once roster/lesson endpoints
 * exist.
 */
export function LiveClassDetail({ klass }: { klass: AssignedClass }) {
  const [qr, setQr] = useState<"none" | "dialog" | "screen">("none");
  const role = klass.role === "co_teacher" ? "Co-teacher" : "Primary teacher";

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[880px]">
        <Link
          href="/teacher/classes"
          className="inline-flex cursor-pointer items-center gap-[7px] text-sm text-nevo-near-black/60 transition-transform active:scale-[0.99]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
          My Classes
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
              {klass.class_name}
            </h2>
            <span className="mt-[5px] block text-[14.5px] text-nevo-near-black/60">
              {`${role} · Synced from your school`}
            </span>
          </div>
          {klass.class_code && (
            <button
              type="button"
              onClick={() => setQr("dialog")}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-nevo-navy/35 px-4 text-sm font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 20h1" />
              </svg>
              Class code
            </button>
          )}
        </div>

        <div className="mt-6 flex max-w-[620px] items-start gap-3.5 rounded-[12px] bg-nevo-cream-elevated px-[22px] py-5 shadow-elevation-1">
          <span className="mt-px shrink-0 text-nevo-navy">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8h.01M11 12h1v4h1" />
            </svg>
          </span>
          <div>
            <h3 className="text-[15.5px] font-semibold text-nevo-near-black xl:text-base">
              We don&rsquo;t have this class&rsquo;s roster yet
            </h3>
            <p className="mt-1.5 text-sm leading-[1.55] text-nevo-near-black/68 xl:text-[14.5px]">
              {klass.class_code
                ? "Nevo knows your school assigned it to you, and nothing more yet. You can still share the class code so students can join."
                : "Nevo knows your school assigned it to you, and nothing more yet. Student work will appear here as it arrives."}
            </p>
          </div>
        </div>
      </div>

      {qr === "dialog" && klass.class_code && (
        <ClassQrDialog
          className={klass.class_name}
          code={klass.class_code}
          onClose={() => setQr("none")}
          onProject={() => setQr("screen")}
        />
      )}
      {qr === "screen" && klass.class_code && (
        <ClassQrScreen
          className={klass.class_name}
          code={klass.class_code}
          onClose={() => setQr("none")}
        />
      )}
    </div>
  );
}
