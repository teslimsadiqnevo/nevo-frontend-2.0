"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COMPOSE_CLASS_FILTERS,
  COMPOSE_STUDENTS,
  type ComposeStudent,
} from "@/lib/mocks/teacherConnect";
import { cn } from "@/lib/utils";

/**
 * C10b Compose Message - a modal over Connect. Two steps in one card: choose
 * a student (search + class filter, each row showing whether a parent is
 * linked), then write, with the option to include that student's parent.
 *
 * Send stays pressable and honest-disabled only while the message is empty.
 */

const PersonGlyph = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
);

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-[26px] w-11 shrink-0 cursor-pointer rounded-full transition-colors",
        on ? "bg-nevo-navy" : "bg-nevo-navy/25",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] size-5 rounded-full bg-nevo-cream transition-[left]",
          on ? "left-[21px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

export function ComposeModal({
  presetStudent,
  onClose,
  onSend,
}: {
  presetStudent?: string;
  onClose: () => void;
  onSend: (student: ComposeStudent, text: string, includeParent: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(COMPOSE_CLASS_FILTERS[0]);
  const [picked, setPicked] = useState<ComposeStudent | null>(
    () => COMPOSE_STUDENTS.find((s) => s.name === presetStudent) ?? null,
  );
  const [includeParent, setIncludeParent] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMPOSE_STUDENTS.filter(
      (s) =>
        (filter === "All classes" || s.className === filter) &&
        (!q || s.name.toLowerCase().includes(q)),
    );
  }, [query, filter]);

  const firstName = picked?.name.split(" ")[0] ?? "";
  const canSend = Boolean(picked) && text.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-nevo-near-black/28 p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New message"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-2xl bg-nevo-cream p-7 shadow-[0_8px_32px_rgba(0,0,0,0.16)] motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200 xl:max-w-[520px] xl:p-[30px]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-nevo-near-black xl:text-[22px]">
            New message
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 cursor-pointer items-center justify-center rounded-[9px] text-nevo-near-black/50 transition-colors hover:bg-nevo-near-black/5 xl:size-[34px]"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="xl:size-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {!picked ? (
          <>
            <div className="relative mt-4 xl:mt-[18px]">
              <span className="absolute top-1/2 left-[15px] -translate-y-1/2 text-nevo-near-black/45">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" />
                </svg>
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your students"
                className="h-12 w-full rounded-[10px] border-[1.5px] border-nevo-near-black/14 bg-nevo-cream-elevated pr-4 pl-[42px] text-[15px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-[7px]">
              {COMPOSE_CLASS_FILTERS.map((f) => {
                const on = f === filter;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "cursor-pointer rounded-full px-[13px] py-1.5 text-[12.5px] font-medium transition-[filter]",
                      on
                        ? "bg-nevo-navy text-nevo-cream"
                        : "border border-nevo-near-black/8 bg-nevo-cream-elevated text-nevo-near-black/70 hover:brightness-[0.985]",
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5 max-h-[300px] overflow-y-auto">
              {shown.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setPicked(s)}
                  className="flex w-full cursor-pointer items-center gap-[13px] rounded-[10px] px-2 py-[11px] text-left transition-colors hover:bg-nevo-navy/6"
                >
                  <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-nevo-navy/10 text-[12.5px] font-semibold text-nevo-navy">
                    {s.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-nevo-near-black">
                      {s.name}
                    </span>
                    <span className="mt-px block text-[12.5px] text-nevo-near-black/55">
                      {s.className}
                    </span>
                  </span>
                  {s.hasParent && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-nevo-near-black/50">
                      <PersonGlyph />
                      Parent linked
                    </span>
                  )}
                </button>
              ))}
              {shown.length === 0 && (
                <p className="px-2 py-4 text-[13px] text-nevo-near-black/50">
                  {`No students match “${query.trim()}”.`}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="mt-4 block text-[13px] font-semibold text-nevo-near-black/70 xl:mt-[18px]">
              To
            </span>
            <div className="mt-2 flex items-center gap-[11px] rounded-[10px] bg-nevo-cream-elevated px-3.5 py-2.5">
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-nevo-navy text-xs font-semibold text-nevo-cream">
                {picked.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-[14.5px] font-semibold text-nevo-near-black">
                  {picked.name}
                </span>
                <span className="ml-2 text-[12.5px] text-nevo-near-black/55">
                  {picked.className}
                </span>
              </span>
              <button
                type="button"
                aria-label="Choose a different student"
                onClick={() => {
                  setPicked(null);
                  setIncludeParent(false);
                }}
                className="shrink-0 cursor-pointer text-nevo-near-black/45 transition-colors hover:text-nevo-near-black/70"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Parent inclusion is only offerable when a contact exists. */}
            {picked.hasParent ? (
              <div className="mt-4 flex items-center justify-between rounded-[10px] bg-nevo-violet/14 px-[15px] py-3">
                <span className="flex items-center gap-[9px]">
                  <span className="text-nevo-navy">
                    <PersonGlyph size={16} />
                  </span>
                  <span className="text-sm text-nevo-near-black/78">
                    {`Include ${firstName}'s parent`}
                  </span>
                </span>
                <Toggle
                  on={includeParent}
                  onChange={setIncludeParent}
                  label={`Include ${firstName}'s parent`}
                />
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-[10px] bg-nevo-near-black/5 px-[13px] py-[9px]">
                <span className="shrink-0 text-nevo-near-black/50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </span>
                <span className="text-[12.5px] leading-[1.4] text-nevo-near-black/60">
                  No parent contact on file - your school admin can update
                  enrolment records.
                </span>
              </div>
            )}

            <label className="mt-4 block text-[13px] font-semibold text-nevo-near-black/70">
              Message
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your message…"
                className="mt-2 h-[110px] w-full resize-none rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream-elevated px-3.5 py-3 text-[14.5px] leading-[1.5] font-normal text-nevo-near-black outline-none transition-colors focus:border-nevo-navy"
              />
            </label>

            <div className="mt-[18px] flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex h-[50px] flex-1 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-nevo-navy/30 text-[15px] font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSend}
                onClick={() => canSend && onSend(picked, text.trim(), includeParent)}
                className={cn(
                  "flex h-[50px] flex-[2] items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold",
                  canSend
                    ? "cursor-pointer bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-93"
                    : "cursor-not-allowed bg-nevo-navy/18 text-nevo-near-black/40",
                )}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4z" />
                </svg>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
