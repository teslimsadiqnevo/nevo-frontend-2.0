"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { contentApi, type ParseContentResponse } from "@/lib/api/content";
import { ApiError } from "@/lib/api/client";
import { getToken } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import {
  FALLBACK_HEADINGS,
  ParseFallback,
  type FallbackKind,
} from "./ParseFallback";
import { PARSE_STAGES, ParseProgress } from "./ParseProgress";
import { SectionReview } from "./SectionReview";
import { UploadResult } from "./UploadResult";

/**
 * Lesson Upload wizard (SCRUM-102.6 reconciled flow, C07g): one flow, two
 * honest paths. Scope declaration is Step 1 for every entry point; a single
 * lesson stays light (3 steps), a unit/term switches on the staged parse
 * (5 steps). The "Step N of M" line is dynamic - an honest count for the
 * chosen path, "N" until a path exists.
 *
 * Chrome per C07c (SCRUM-102.1): step line + progress in the head, the
 * question as the heading, Back / route-note / Continue in the foot. Step
 * copy per the reconciled `Nevo Teacher Upload` frame. The disabled Continue
 * is the one honest disabled case - nothing chosen yet - with the live
 * outstanding line beside it.
 *
 * The single path's Step 3 is the SCRUM-101 section review (SectionReview) -
 * per C07g it replaces the straight-to-done demo of the component frame. Its
 * "STEP 3 OF 4 / 75%" chrome predates the reconciliation; here it reads
 * 3 OF 3 at 85% (between processing's 70% and done's 100%).
 *
 * The block path's processing is the C07e staged parse (ParseProgress), and
 * its failure shapes are C07f (ParseFallback). That path's outcome is still
 * mocked from the file: an extension outside the accepted set reads as
 * unreadable (real validation - drag-and-drop bypasses the picker's accept
 * filter), and for demos a filename containing "partial" or "continuous"
 * walks the matching fallback.
 *
 * THE UPLOAD IS LIVE. `POST /api/content/upload` takes the file itself and
 * extracts server-side, so PDF, Word, PowerPoint, Markdown and plain text all
 * work - the browser-side pdfjs extraction this flow used to need could never
 * cover Word or PowerPoint, and is gone.
 *
 * The response is the parsed lesson, and the lesson exists from that moment:
 * there is no separate commit on this path, so step 3 reviews what came back
 * rather than asking for approval it does not need.
 *
 * The block path's staged parse is still the designed demo beat, but the
 * reason changed on 31 Aug and the copy says the new one. The staged
 * endpoints are real AND the structure is now typed - `POST /api/v1/uploads`
 * takes the file with its scope and subject, and `GET /api/v1/uploads/{id}`
 * returns `{lessonId, modules[...]}`.
 *
 * What is missing is a level. That structure describes ONE lesson and its
 * modules; the block path exists to turn a unit into SEVERAL lessons, and the
 * contract has nowhere to put them. So the staged call would succeed and
 * still not answer the question this path asks, which is why it is not made:
 * a request whose answer we cannot show is not honesty, it is just traffic.
 *
 * TODO(api): a block-level structure. See StructureTree for the exact ask.
 */

type ScopeId = "single" | "unit" | "term";
type Phase =
  | "scope"
  | "file"
  | "processing"
  | "review"
  | "done"
  | "blockParsed"
  | "fallback";

const SCOPES: {
  id: ScopeId;
  title: string;
  sub: string;
  passes: string;
  route: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "single",
    title: "A single lesson",
    sub: "One lesson's worth of notes or a slide deck. We'll split it into segments.",
    passes: "ONE QUICK REVIEW",
    route: "the short path - segment review, then done.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M14 3v6h6" />
        <path d="M9 14h6" />
      </svg>
    ),
  },
  {
    id: "unit",
    title: "A unit or scheme - several lessons",
    sub: "A set of related lessons. We'll find the lessons, then the sections inside each.",
    passes: "A FEW REVIEW PASSES",
    route: "the staged parse - lessons, sections, then segments.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="4" y="4" width="16" height="5" rx="1.5" />
        <rect x="4" y="12" width="16" height="5" rx="1.5" />
        <path d="M8 19h8" />
      </svg>
    ),
  },
  {
    id: "term",
    title: "A term or textbook chapter",
    sub: "A whole term or chapter. We'll break it into lessons, sections and segments.",
    passes: "GUIDED, LEVEL BY LEVEL",
    route: "the full staged parse - we'll guide you level by level.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" />
        <path d="M20 5v14a2 2 0 0 0-2-2" />
      </svg>
    ),
  },
];

const SCOPE_CHIP: Record<ScopeId, string> = {
  single: "A single lesson",
  unit: "A unit or scheme",
  term: "A term or chapter",
};

/** Mock parse beats - the block path only; the single path uploads for real. */
const PROCESS_MS = 2400;
const BLOCK_STAGE_MS = 1150;
const ACCEPTED = /\.(pdf|docx?|pptx?)$/i;

/** Mock outcome of the block parse, read from the file (see header note). */
function mockBlockOutcome(name: string): FallbackKind | "parsed" {
  if (!ACCEPTED.test(name)) return "unreadable";
  if (/partial/i.test(name)) return "partial";
  if (/continuous/i.test(name)) return "noBoundary";
  return "parsed";
}

export function UploadWizard() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("scope");
  const [scope, setScope] = useState<ScopeId | null>(null);
  const [fileName, setFileName] = useState("");
  // The File itself, not just its name: "Try again" on a server fault must
  // resend the same upload, not reopen the picker and ask a teacher to find
  // their file a second time for a failure that was ours.
  const lastFile = useRef<File | null>(null);
  const [parseStage, setParseStage] = useState(0);
  const [fallbackKind, setFallbackKind] = useState<FallbackKind>("unreadable");
  const [dragOver, setDragOver] = useState(false);
  /** The screen is showing fixture content, never the teacher's own file. */
  const [sample, setSample] = useState(false);
  /** What the upload actually returned, when it was live. */
  const [parsed, setParsed] = useState<ParseContentResponse | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const isBlock = scope !== null && scope !== "single";
  const stepTotal = scope === null ? "N" : scope === "single" ? 3 : 5;
  const stepNum = {
    scope: 1,
    file: 2,
    processing: 3,
    review: 3,
    done: 3,
    blockParsed: 4,
    fallback: 3,
  }[phase];
  const progress = {
    scope: scope ? (scope === "single" ? "33%" : "20%") : "8%",
    file: scope === "single" ? "40%" : "24%",
    processing: scope === "single" ? "70%" : "50%",
    review: "85%",
    done: "100%",
    blockParsed: "80%",
    fallback: "55%",
  }[phase];

  const blockName = fileName.replace(/\.[^.]+$/, "");
  const heading = {
    scope: "What are you uploading?",
    // C07e's dedicated screen: "Breaking down '<block>'" supersedes the
    // component frame's generic "While we read your block" head.
    processing: isBlock ? `Breaking down '${blockName}'` : "Getting it ready",
    file: "Choose a file",
    review: "How should this lesson be split up?",
    done: "Added to your library",
    blockParsed: "Here's how we've broken it up",
    fallback: FALLBACK_HEADINGS[fallbackKind],
  }[phase];

  const stopTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const startFile = (file: File) => {
    stopTimer();
    lastFile.current = file;
    setFileName(file.name);
    setSample(false);
    setParsed(null);
    setPhase("processing");

    // The block path has no BLOCK-level structure to render, and a signed-out
    // visitor has no token - both keep the designed demo beat, each labelled
    // with its own reason below.
    if (isBlock || !getToken()) {
      runMockBeats(file.name);
      return;
    }

    void contentApi
      .upload(file)
      .then((lesson) => {
        setParsed(lesson);
        setPhase("review");
      })
      .catch((err: unknown) => {
        // WHOSE FAULT IS IT? Any 4xx is the server's ANSWER about this file -
        // it read the request and rejected it. Only a 5xx, or no status at
        // all (the network never got there), is ours.
        //
        // This used to test `status === 400` alone, and `/api/content/upload`
        // documents 200 and 422 only - so the file-fault branch never fired
        // and every unreadable file was reported as "we couldn't reach Nevo",
        // blaming our infrastructure for a file the backend had read and
        // answered on.
        const status = err instanceof ApiError ? err.status : undefined;
        const ourFault = status === undefined || status >= 500;
        setFallbackKind(ourFault ? "unreachable" : "unreadable");
        setPhase("fallback");
      });
  };

  const runMockBeats = (name: string) => {
    setSample(true);
    if (!isBlock) {
      timer.current = setTimeout(() => setPhase("review"), PROCESS_MS);
      return;
    }
    setParseStage(0);
    const outcome = mockBlockOutcome(name);
    if (outcome === "unreadable") {
      // An unreadable file fails on the first rung, not after the ladder.
      timer.current = setTimeout(() => {
        setFallbackKind("unreadable");
        setPhase("fallback");
      }, BLOCK_STAGE_MS);
      return;
    }
    let stage = 0;
    const tick = () => {
      stage += 1;
      if (stage < PARSE_STAGES.length) {
        setParseStage(stage);
        timer.current = setTimeout(tick, BLOCK_STAGE_MS);
      } else if (outcome === "parsed") {
        setPhase("blockParsed");
      } else {
        setFallbackKind(outcome);
        setPhase("fallback");
      }
    };
    timer.current = setTimeout(tick, BLOCK_STAGE_MS);
  };

  const reset = () => {
    stopTimer();
    setPhase("scope");
    setScope(null);
    setFileName("");
    setSample(false);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Head - step line, progress, the question (C07c) */}
      <div className="shrink-0 border-b border-nevo-near-black/9 px-6 pt-[18px] pb-4 xl:px-8 xl:pt-[22px] xl:pb-5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] font-semibold tracking-[0.08em] whitespace-nowrap text-nevo-violet">
            STEP {stepNum} OF {stepTotal}
          </span>
          <div className="h-1 flex-1 rounded-full bg-nevo-near-black/10">
            <div
              className="h-full rounded-full bg-nevo-violet transition-[width] duration-[220ms] ease-out"
              style={{ width: progress }}
            />
          </div>
        </div>
        <h2 className="mt-3 text-[21px] font-semibold tracking-[-0.014em] text-nevo-near-black xl:text-2xl">
          {heading}
        </h2>
        {phase === "scope" && (
          <p className="mt-1.5 max-w-[560px] text-sm leading-[1.55] text-nevo-near-black/62">
            This just tells us how deeply to break it up. You can change any of
            it later.
          </p>
        )}
        {phase === "review" && (
          <p className="mt-1.5 max-w-[560px] text-sm leading-[1.55] text-nevo-near-black/62">
            We&rsquo;ve broken this lesson into modules that flow well. Adjust
            anything, rename a section, or keep it as one continuous flow.
          </p>
        )}
        {sample && (phase === "review" || phase === "blockParsed") && (
          <p className="mt-1.5 max-w-[560px] text-[13px] leading-[1.5] text-nevo-near-black/55 italic">
            {/* Two different reasons, and a teacher deserves the right one:
                a whole unit cannot be split into lessons yet, whereas a
                signed-out visitor simply has nothing to read the file with. */}
            {isBlock
              ? "We can’t split a unit into separate lessons yet, so this is a sample - nothing below comes from what you uploaded."
              : "We can’t read your file yet, so this is a sample lesson - nothing below comes from what you uploaded."}
          </p>
        )}
      </div>

      {phase === "review" &&
        (parsed ? (
          <UploadResult
            lesson={parsed}
            fileName={fileName}
            onUploadAnother={() => {
              setParsed(null);
              setPhase("file");
            }}
          />
        ) : (
          <SectionReview
            onBack={() => setPhase("file")}
            onDone={() => setPhase("done")}
          />
        ))}

      {phase === "fallback" && (
        <ParseFallback
          kind={fallbackKind}
          blockName={blockName}
          onBack={() => setPhase("file")}
          onTryAnother={() => setPhase("file")}
          onContinueAnyway={() => setPhase("blockParsed")}
          onRetrySameFile={() => {
            // Read at click time, never during render.
            const f = lastFile.current;
            if (f) startFile(f);
            else setPhase("file");
          }}
        />
      )}

      {/* Body */}
      {phase !== "review" && phase !== "fallback" && (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-[22px] xl:px-8 xl:py-7">
          {phase === "scope" && (
            <div className="flex max-w-[640px] flex-col gap-3.5">
              {SCOPES.map((s) => {
                const on = scope === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScope(s.id)}
                    aria-pressed={on}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-[15px] rounded-[12px] border-2 bg-nevo-cream-elevated p-[18px] text-left transition-[border-color,box-shadow] xl:px-5",
                      on
                        ? "border-nevo-navy shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
                        : "border-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-[42px] shrink-0 items-center justify-center rounded-[11px]",
                        on
                          ? "bg-nevo-navy text-nevo-cream"
                          : "bg-nevo-navy/10 text-nevo-navy",
                      )}
                    >
                      {s.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold tracking-[-0.008em] text-nevo-near-black xl:text-[17px]">
                        {s.title}
                      </span>
                      <span className="mt-1 block text-[13.5px] leading-[1.5] text-nevo-near-black/66">
                        {s.sub}
                      </span>
                      <span className="mt-[7px] block font-mono text-[11px] tracking-[0.02em] text-nevo-violet">
                        {s.passes}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-nevo-cream",
                        on
                          ? "bg-nevo-violet motion-safe:animate-nevo-pop"
                          : "border-[1.5px] border-nevo-near-black/16 opacity-0",
                      )}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M5 12l4 4L19 6" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {phase === "file" && scope && (
            <div className="max-w-[720px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-nevo-violet/16 py-1.5 pr-[13px] pl-[13px]">
                <span className="text-[12.5px] font-semibold text-nevo-navy">
                  {SCOPE_CHIP[scope]}
                </span>
                <button
                  type="button"
                  onClick={() => setPhase("scope")}
                  className="cursor-pointer text-xs text-nevo-navy underline underline-offset-2"
                >
                  change
                </button>
              </div>
              <p className="mt-3 text-[15.5px] leading-[1.55] text-nevo-near-black/66">
                {isBlock
                  ? "Drop in the file. Nevo reads it, finds the lessons inside, then the sections and segments - you'll review each level."
                  : "Drop in a PDF, Word doc or slides. Nevo reads it, then builds the read, listen and watch versions your students can choose from."}
              </p>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) startFile(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) startFile(f);
                }}
                className={cn(
                  "mt-5 w-full cursor-pointer rounded-[16px] border-2 border-dashed bg-nevo-cream-elevated px-8 py-[52px] text-center transition-[filter,border-color] hover:brightness-[0.985]",
                  dragOver ? "border-nevo-navy" : "border-nevo-navy/35",
                )}
              >
                <span className="inline-flex size-16 items-center justify-center rounded-[16px] bg-nevo-navy/10 text-nevo-navy">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 16V4" />
                    <path d="M7 9l5-5 5 5" />
                    <path d="M5 20h14" />
                  </svg>
                </span>
                <p className="mt-[18px] text-[17px] font-semibold text-nevo-near-black">
                  Choose a file or drag it here
                </p>
                <p className="mt-1.5 text-[13.5px] text-nevo-near-black/55">
                  {isBlock
                    ? "PDF, Word, or clear scans · up to ~40 pages per upload"
                    : "PDF, Word, or PowerPoint · up to 25 MB"}
                </p>
              </button>
            </div>
          )}

          {phase === "processing" && isBlock && (
            <ParseProgress stage={parseStage} />
          )}

          {phase === "processing" && !isBlock && (
            <div className="flex max-w-[720px] items-center gap-5 rounded-[16px] bg-nevo-cream-elevated p-9 shadow-elevation-1">
              <span className="size-11 shrink-0 rounded-full border-4 border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:800ms]" />
              <div>
                <h3 className="text-lg font-semibold text-nevo-near-black">
                  {`Getting "${fileName}" ready`}
                </h3>
                <p className="mt-1.5 text-[14.5px] leading-[1.5] text-nevo-near-black/66">
                  Reading the content and building the read, listen and watch
                  versions. This usually takes under a minute.
                </p>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="max-w-[720px] rounded-[16px] bg-nevo-cream-elevated p-8 shadow-elevation-1">
              <div className="flex items-center gap-4">
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f7f1e6"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-[19px] font-semibold text-nevo-near-black">
                    {`"${fileName.replace(/\.[^.]+$/, "")}" is ready`}
                  </h3>
                  <p className="mt-1 text-[14.5px] text-nevo-near-black/66">
                    Read, listen and watch versions are all built. It&rsquo;s in
                    your library now.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/teacher/lessons"
                  className="inline-flex h-12 cursor-pointer items-center rounded-[10px] bg-nevo-navy px-[22px] text-[15px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
                >
                  See it in the library
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-12 cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/30 px-5 text-[15px] font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
                >
                  Upload another
                </button>
              </div>
            </div>
          )}

          {phase === "blockParsed" && (
            <div className="max-w-[720px] rounded-[16px] bg-nevo-cream-elevated p-8 shadow-elevation-1">
              <div className="flex items-center gap-4">
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f7f1e6"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M4 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" />
                    <path d="M20 5v14a2 2 0 0 0-2-2" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-[19px] font-semibold text-nevo-near-black">
                    We&rsquo;ve broken it into 3 lessons
                  </h3>
                  <p className="mt-1 text-[14.5px] leading-[1.5] text-nevo-near-black/66">
                    7 sections and 21 segments in all. Have a look and adjust
                    anything before it goes to your library.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/teacher/lessons/upload/structure"
                  className="inline-flex h-12 cursor-pointer items-center rounded-[10px] bg-nevo-navy px-[22px] text-[15px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
                >
                  Review the structure
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-12 cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/30 px-5 text-[15px] font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
                >
                  Start over
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Foot - Back / route line / Continue (C07c). Only the choosing steps
          carry the foot; working and terminal states own their actions -
          the review step brings its own (inside SectionReview). */}
      {(phase === "scope" || phase === "file") && (
        <div className="flex shrink-0 items-center gap-3.5 border-t border-nevo-near-black/10 px-6 py-3.5 xl:px-8 xl:py-4">
          <button
            type="button"
            onClick={() =>
              phase === "scope"
                ? router.push("/teacher/lessons")
                : setPhase("scope")
            }
            className="inline-flex cursor-pointer items-center gap-[7px] rounded-[10px] border-[1.5px] border-nevo-near-black/18 px-[15px] py-[9px] text-[13.5px] font-semibold text-nevo-near-black transition-colors hover:bg-nevo-near-black/5"
          >
            Back
          </button>
          <span
            className={cn(
              "flex-1 text-[12.5px]",
              phase === "scope" && !scope
                ? "text-nevo-navy"
                : "text-nevo-near-black/60",
            )}
          >
            {phase === "scope" &&
              (scope
                ? `Continue takes you to ${SCOPES.find((s) => s.id === scope)!.route}`
                : "Choose what you're uploading to continue.")}
          </span>
          {phase === "scope" && (
            <button
              type="button"
              onClick={() => scope && setPhase("file")}
              disabled={!scope}
              className={cn(
                "inline-flex items-center gap-2 rounded-[10px] border-none px-[18px] py-[11px] text-sm font-semibold",
                scope
                  ? "cursor-pointer bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-93"
                  : "cursor-not-allowed bg-nevo-navy/18 text-nevo-near-black/40",
              )}
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}
