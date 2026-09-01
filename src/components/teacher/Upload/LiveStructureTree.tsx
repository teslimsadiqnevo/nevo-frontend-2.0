"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { lessonsOf, uploadsApi, type UploadStructure } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

/**
 * C07d for a REAL staged upload: the unit Nevo made, and the commit that puts
 * it in the library.
 *
 * WHAT IS AND IS NOT HERE. The contract gained `structure.lessons[]` on
 * 1 Sep, so a unit becoming several lessons can finally be expressed, and this
 * renders whatever the parser returns - one lesson or four. Backend was clear
 * that the parser still emits one today, so it will usually show one; that is
 * the parse being honest, not the screen hiding anything.
 *
 * The third level is a COUNT, not a list. A module carries `segmentIds` and
 * nothing else, and the upload status response has no segments on it, so
 * there are no titles to draw beneath a section. C07d draws named segment
 * rows; they return when the upload can hand back its segments.
 *
 * Steering - drag, split, merge, rename - is NOT wired here. Those edits go
 * through `PUT /uploads/{id}/structure`, and doing them properly means
 * mapping the whole tree in both directions; that is its own piece of work.
 * What this screen does, it does for real: it shows the parse, and it commits
 * it. Nothing on it reports something that has not happened.
 */
export function LiveStructureTree({
  uploadId,
  structure,
  blockName,
}: {
  uploadId: string;
  structure: UploadStructure;
  blockName: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "confirm" | "committing">("idle");
  const [error, setError] = useState("");
  const lessons = lessonsOf(structure);

  const totals = lessons.reduce(
    (acc, l) => ({
      modules: acc.modules + l.modules.length,
      segments:
        acc.segments + l.modules.reduce((n, m) => n + m.segmentIds.length, 0),
    }),
    { modules: 0, segments: 0 },
  );

  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

  const summary = [
    plural(lessons.length, "lesson", "lessons"),
    plural(totals.modules, "section", "sections"),
    plural(totals.segments, "segment", "segments"),
  ].join(" · ");

  const commit = async () => {
    setPhase("committing");
    setError("");
    try {
      await uploadsApi.confirm(uploadId);
      router.push("/teacher/lessons");
    } catch {
      setPhase("idle");
      setError(
        "We couldn’t add that to your library just now. Nothing has changed – try again in a moment.",
      );
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-[22px] xl:px-8 xl:py-7">
        <div className="mb-3.5 flex items-center gap-3 rounded-xl bg-nevo-navy px-[18px] py-[15px]">
          <span className="shrink-0 text-nevo-violet" aria-hidden>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-nevo-violet/80">
              THE BLOCK YOU UPLOADED
            </div>
            <div className="truncate text-[17px] font-semibold text-nevo-cream">
              {blockName}
            </div>
          </div>
          <span className="shrink-0 text-[13px] text-nevo-cream/70">
            {summary}
          </span>
        </div>

        {lessons.map((lesson, li) => (
          <div
            key={lesson.lessonId}
            className="mb-3 rounded-[12px] bg-nevo-cream-elevated px-[18px] py-4 shadow-elevation-1"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-nevo-violet">
                {`LESSON ${li + 1}`}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15.5px] font-semibold text-nevo-near-black">
                {lesson.title || "Untitled lesson"}
              </span>
              <span className="shrink-0 text-[12.5px] text-nevo-near-black/55">
                {plural(lesson.modules.length, "section", "sections")}
              </span>
            </div>

            <div className="mt-2.5 flex flex-col gap-2">
              {lesson.modules.map((m) => (
                <div
                  key={`${lesson.lessonId}-${m.sequenceOrder}`}
                  className="flex items-baseline gap-3 rounded-[10px] bg-nevo-cream-inset px-3.5 py-2.5"
                >
                  <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-nevo-near-black/45">
                    {`SECTION ${m.sequenceOrder}`}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-nevo-near-black">
                    {m.title || "Untitled section"}
                  </span>
                  {/* A count, not a list: the contract gives segment ids and
                      no titles, so there is nothing to name here. */}
                  <span className="shrink-0 text-[12.5px] text-nevo-near-black/55">
                    {plural(m.segmentIds.length, "segment", "segments")}
                  </span>
                </div>
              ))}
              {lesson.modules.length === 0 && (
                <p className="text-[13px] text-nevo-near-black/55">
                  Nevo didn&rsquo;t split this lesson into sections.
                </p>
              )}
            </div>
          </div>
        ))}

        {error && (
          <p className="mt-3 max-w-[600px] rounded-[10px] bg-nevo-violet/14 px-[15px] py-3 text-[13px] leading-[1.5] text-nevo-near-black/78">
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3.5 border-t border-nevo-near-black/10 bg-nevo-cream px-6 py-3 xl:px-8 xl:py-3.5">
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-nevo-near-black/60">
          {summary}
        </span>
        <button
          type="button"
          onClick={() => setPhase("confirm")}
          disabled={phase === "committing"}
          className={cn(
            "flex h-[46px] items-center rounded-[10px] px-[26px] text-[15px] font-semibold",
            phase === "committing"
              ? "cursor-not-allowed bg-nevo-navy/18 text-nevo-near-black/40"
              : "cursor-pointer bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-93",
          )}
        >
          {phase === "committing"
            ? "Adding…"
            : "Looks right - add to my library"}
        </button>
      </div>

      {phase === "confirm" && (
        <div className="absolute inset-0 z-5 flex items-end justify-center bg-nevo-near-black/32 p-6">
          <div className="w-full max-w-[520px] rounded-2xl bg-nevo-cream px-[26px] py-6 shadow-[0_20px_56px_rgba(0,0,0,0.24)] motion-safe:animate-nevo-rise">
            <span className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-nevo-violet">
              ADD TO LIBRARY
            </span>
            <p className="mt-2.5 text-base leading-[1.55] font-medium text-nevo-near-black">
              {`This will add ${summary.replace(/ · /g, ", ")} to your library.`}
            </p>
            <p className="mt-2 text-[13px] leading-[1.5] text-nevo-near-black/60">
              You can still edit any lesson later.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void commit()}
                className="flex h-[46px] cursor-pointer items-center rounded-[10px] bg-nevo-navy px-5 text-[15px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
              >
                Yes, add them
              </button>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="flex h-[46px] cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-near-black/18 px-5 text-[15px] font-semibold text-nevo-near-black transition-colors hover:bg-nevo-near-black/5"
              >
                Let me review first
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
