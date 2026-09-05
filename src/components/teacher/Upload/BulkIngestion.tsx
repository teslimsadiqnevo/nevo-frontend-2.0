"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { uploadsApi, type BatchResult } from "@/lib/api/uploads";
import { getToken } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

/**
 * C07h Bulk Curriculum Ingestion: a whole term's scheme of work at once.
 * Linear - upload, parse, results. The results heading is warm ("Here's what
 * we found") and anything needing attention is "a quick look", never
 * "errors". Lesson-level outcomes only.
 *
 * A STANDALONE takeover screen per the frame (no sidebar): rendered as a
 * fixed full-viewport layer over the console shell. The top bar carries the
 * close X on idle only - the frame drops it while parsing - and swaps to the
 * "Add all to library" commit action on results.
 *
 * DESIGN FLAG (in the PR): this linear term flow sits beside the C07 wizard's
 * SCRUM-102 term path (staged parse + tree). Nothing in the C07g audit
 * supersedes C07h, so it ships as designed; which affordance opens it is
 * design's call.
 *
 * THE BATCH IS REAL. `POST /api/v1/uploads/batch` shipped 1 Sep - up to 20
 * files, each reporting its own outcome - so the sorting beat that stood in
 * for it is gone for a signed-in teacher. The signed-out demo keeps it.
 *
 * WHAT THE RESULTS ACTUALLY ARE. The frame lists LESSONS ("Introduction to
 * Algebra - Week 1"); the batch endpoint reports FILES - a filename, whether
 * it was accepted, and the server's reason when it was not.
 *
 * The lesson TITLE now arrives too. `lessonTitle` landed on the upload status
 * response on 3 Sep, so each accepted upload can be asked what the parse
 * decided it was called, and a teacher sees "Simplifying Expressions" rather
 * than "wk2-final-v3.docx".
 *
 * That is still one read per upload. It is done ONCE, after the batch settles,
 * and every failure is absorbed - a title is an improvement on the filename,
 * never a precondition for showing the row. A file whose title cannot be
 * fetched keeps its filename, which is what the screen showed before.
 *
 * TODO(api): Drive/OneDrive imports remain blocked on per-school credentials.
 */

type Phase = "idle" | "parsing" | "results";

const TOTAL = 13;
const SORT_MS = 460;

const READY: { title: string; wk: string }[] = [
  { title: "Introduction to Algebra", wk: "Week 1" },
  { title: "Simplifying Expressions", wk: "Week 2" },
  { title: "Solving Linear Equations", wk: "Week 3" },
  { title: "Simplifying Algebraic Fractions", wk: "Week 4" },
  { title: "Angles & Triangles", wk: "Week 5" },
  { title: "Introduction to Statistics", wk: "Week 6" },
];

const REVIEW: { title: string; reason: string }[] = [
  {
    title: "Quadratic Patterns",
    reason: "The diagrams came through as images - a quick check that the labels read correctly.",
  },
  {
    title: "Word Problems: Rates & Ratios",
    reason: "A couple of sections ran together. Worth confirming where one question ends and the next begins.",
  },
];

const importBtn =
  "inline-flex h-[50px] flex-1 cursor-pointer items-center justify-center gap-[9px] rounded-[10px] border-[1.5px] border-nevo-near-black/14 bg-nevo-cream-elevated text-sm font-medium text-nevo-near-black transition-[filter] hover:brightness-[0.985] xl:h-[52px] xl:gap-2.5 xl:text-[14.5px]";

export function BulkIngestion() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [sorted, setSorted] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [batch, setBatch] = useState<BatchResult | null>(null);
  /** uploadId -> the parse's own title for it. Absent until it arrives. */
  const [titles, setTitles] = useState<Record<string, string>>({});

  /**
   * Ask each accepted upload what the parse called it.
   *
   * Every read is settled independently and failures are swallowed: this is
   * an improvement on the filename, not a precondition for showing the row,
   * and one slow or missing title must not hold up the other twelve. Titles
   * are merged in as a batch so the list does not repaint per response.
   */
  const loadTitles = async (res: BatchResult) => {
    const accepted = res.uploads.filter((u) => u.accepted && u.uploadId);
    if (accepted.length === 0) return;
    const settled = await Promise.allSettled(
      accepted.map((u) => uploadsApi.status(u.uploadId as string)),
    );
    const found: Record<string, string> = {};
    settled.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      const title = r.value.lessonTitle?.trim();
      if (title) found[accepted[i].uploadId as string] = title;
    });
    if (Object.keys(found).length > 0) {
      setTitles((prev) => ({ ...prev, ...found }));
    }
  };
  const [batchError, setBatchError] = useState("");
  const [committing, setCommitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /** The designed demo beat - signed-out only. */
  const runDemo = () => {
    setPhase("parsing");
    setSorted(0);
    let n = 0;
    const tick = () => {
      n += 1;
      if (n <= TOTAL) {
        setSorted(n);
        timer.current = setTimeout(tick, SORT_MS);
      } else {
        setPhase("results");
      }
    };
    timer.current = setTimeout(tick, SORT_MS);
  };

  const startParse = (files: File[]) => {
    if (!getToken()) {
      runDemo();
      return;
    }
    setPhase("parsing");
    setBatch(null);
    setTitles({});
    setBatchError("");
    // `scope: "term"` - this screen is the term flow by definition.
    void uploadsApi
      .batch(files, "term")
      .then((res) => {
        setBatch(res);
        setPhase("results");
        void loadTitles(res);
      })
      .catch(() => {
        setBatchError(
          "We couldn’t send those just now. Nothing has been added - try again in a moment.",
        );
        setPhase("idle");
      });
  };

  /**
   * One confirm per accepted upload, with `allSettled` so a single failure
   * does not report the whole batch as unsent - and so a partial outcome can
   * name what did land.
   */
  const addAll = async () => {
    const accepted = (batch?.uploads ?? []).filter((u) => u.accepted && u.uploadId);
    if (accepted.length === 0) return;
    setCommitting(true);
    setBatchError("");
    const results = await Promise.allSettled(
      accepted.map((u) => uploadsApi.confirm(u.uploadId as string)),
    );
    setCommitting(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed === 0) {
      close();
      return;
    }
    if (failed === accepted.length) {
      setBatchError(
        "We couldn’t add those to your library just now. Nothing has changed - try again in a moment.",
      );
      return;
    }
    setBatchError(
      `Added ${accepted.length - failed} of ${accepted.length}. The rest didn’t go through - reopen this to try them again.`,
    );
  };

  const close = () => router.push("/teacher/lessons");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-nevo-cream text-nevo-near-black">
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-nevo-near-black/8 px-7 xl:h-[72px] xl:px-8">
        {phase === "results" ? (
          <>
            <span className="text-[14.5px] font-medium text-nevo-near-black/70 xl:text-[15px]">
              Add a term&rsquo;s material
            </span>
            <button
              type="button"
              onClick={() => (batch ? void addAll() : close())}
              disabled={committing || (batch !== null && batch.acceptedCount === 0)}
              className={cn(
                "flex h-[42px] items-center rounded-[10px] px-5 text-sm font-semibold xl:h-11 xl:px-[22px] xl:text-[14.5px]",
                committing || (batch !== null && batch.acceptedCount === 0)
                  ? "cursor-not-allowed bg-nevo-navy/18 text-nevo-near-black/40"
                  : "cursor-pointer bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-93",
              )}
            >
              <span className="xl:hidden">
                {committing ? "Adding…" : "Add all"}
              </span>
              <span className="hidden xl:inline">
                {committing ? "Adding…" : "Add all to library"}
              </span>
            </button>
          </>
        ) : (
          <>
            {phase === "idle" ? (
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] text-nevo-near-black/60 transition-colors hover:bg-nevo-near-black/5"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            ) : (
              <span className="w-10" />
            )}
            <span className="text-[15px] font-medium text-nevo-near-black/70">
              Add a term&rsquo;s material
            </span>
            <span className="w-10" />
          </>
        )}
      </div>

      {phase === "idle" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-7 py-6 xl:px-8">
          <div className="w-full max-w-[560px] xl:max-w-[620px]">
            <h2 className="mb-1.5 text-[23px] font-semibold tracking-[-0.015em] xl:text-[26px]">
              Upload your term&rsquo;s material
            </h2>
            <p className="mb-5 text-[14.5px] leading-[1.55] text-nevo-near-black/66 xl:mb-[22px] xl:text-[15.5px]">
              Drop the whole scheme of work in - Nevo will sort it into
              individual lessons for you.
            </p>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) startParse(files);
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
                const dropped = Array.from(e.dataTransfer.files ?? []);
                if (dropped.length) startParse(dropped);
              }}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center rounded-[16px] border-2 border-dashed bg-nevo-violet/8 px-7 py-9 text-center transition-[filter,border-color] hover:brightness-[0.99] xl:px-8 xl:py-11",
                dragOver ? "border-nevo-navy" : "border-nevo-violet/75",
              )}
            >
              <span className="flex size-[58px] items-center justify-center rounded-[16px] bg-nevo-violet/24 text-nevo-navy xl:size-16">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 16V4" />
                  <path d="M7 9l5-5 5 5" />
                  <path d="M5 20h14" />
                </svg>
              </span>
              <p className="mt-4 text-base font-medium xl:mt-[18px] xl:text-[17px]">
                Drop your files here, or click to browse
              </p>
              <p className="mt-[7px] text-[13.5px] text-nevo-near-black/55 xl:mt-2 xl:text-sm">
                PDF, Word, or PowerPoint &middot; several at once is fine
              </p>
            </button>
            <div className="mt-4 flex items-center gap-3.5 xl:mt-[18px]">
              <div className="h-px flex-1 bg-nevo-near-black/12" />
              <span className="text-[12.5px] text-nevo-near-black/50 xl:text-[13px]">
                or bring it from
              </span>
              <div className="h-px flex-1 bg-nevo-near-black/12" />
            </div>
            {/* TODO(api): Drive/OneDrive integrations - rendered per the
                frame, not yet wired. */}
            <div className="mt-3.5 flex gap-3 xl:mt-4">
              <button type="button" className={importBtn}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3b3f6e" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 20l6-10 6 10z" />
                  <path d="M9 4l6 10" />
                  <path d="M4 14h9" />
                </svg>
                <span className="xl:hidden">Google Drive</span>
                <span className="hidden xl:inline">Import from Google Drive</span>
              </button>
              <button type="button" className={importBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b3f6e" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 18 18z" />
                </svg>
                <span className="xl:hidden">OneDrive</span>
                <span className="hidden xl:inline">Import from OneDrive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "parsing" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-7 py-6 xl:px-8">
          <div className="flex flex-col items-center text-center">
            <span className="block size-[42px] rounded-full border-[3px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:1s] xl:size-11" />
            <h2 className="mt-[22px] text-[21px] font-semibold tracking-[-0.01em] xl:mt-6 xl:text-[23px]">
              Working through your material&hellip;
            </h2>
            <p className="mt-[9px] max-w-[360px] text-[14.5px] leading-[1.55] text-nevo-near-black/66 xl:mt-2.5 xl:max-w-[380px] xl:text-[15.5px]">
              This one&rsquo;s a bigger read - a term&rsquo;s worth. Feel free
              to carry on elsewhere; we&rsquo;ll have it ready shortly.
            </p>
            <div className="mt-[22px] h-1.5 w-[300px] overflow-hidden rounded-full bg-nevo-navy/14 xl:mt-6 xl:w-[320px]">
              <span
                className="block h-full rounded-full bg-nevo-navy transition-[width] duration-[300ms] ease-out"
                style={{ width: `${Math.round((sorted / TOTAL) * 100)}%` }}
              />
            </div>
            <span className="mt-[11px] text-[13px] text-nevo-near-black/55 xl:mt-3 xl:text-[13.5px]">
              {sorted} of {TOTAL} lessons sorted
            </span>
          </div>
        </div>
      )}

      {phase === "results" && (
        <div className="flex min-h-0 flex-1 justify-center overflow-y-auto px-7 pt-6 pb-7 xl:px-8 xl:pb-8">
          <div className="w-full max-w-[600px] xl:max-w-[660px]">
            <h2 className="text-[23px] font-semibold tracking-[-0.015em] xl:mt-2 xl:text-[26px]">
              Here&rsquo;s what we found
            </h2>
            {batch ? (
              <>
                <p className="mt-[9px] text-[14.5px] leading-[1.55] text-nevo-near-black/66 xl:mt-2.5 xl:text-[15.5px]">
                  {batch.rejectedCount === 0
                    ? `All ${batch.acceptedCount} came through cleanly.`
                    : `${batch.acceptedCount} came through cleanly. ${batch.rejectedCount} ${batch.rejectedCount === 1 ? "needs" : "need"} a quick look.`}
                </p>

                {batchError && (
                  <p className="mt-3 rounded-[10px] bg-nevo-violet/14 px-[15px] py-3 text-[13px] leading-[1.5] text-nevo-near-black/78">
                    {batchError}
                  </p>
                )}

                {/* Per FILE, because that is what the endpoint reports. A
                    rejected file carries the server's own reason and sits on
                    its own line - it has not sunk the others. */}
                <div className="mt-[22px] overflow-hidden rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)] xl:mt-6">
                  {batch.uploads.map((u, i) => (
                    <div
                      key={`${u.filename}-${i}`}
                      className={cn(
                        "flex items-start gap-3 px-[18px] py-3.5",
                        i < batch.uploads.length - 1 &&
                          "border-b border-nevo-near-black/7",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-px shrink-0",
                          u.accepted ? "text-nevo-navy" : "text-nevo-violet",
                        )}
                      >
                        {u.accepted ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v5M12 16h.01" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        {/* The parse's own title when it has one, with the
                            filename kept beneath it - a teacher recognises
                            what they dragged in, and sees what Nevo made of
                            it. Filename alone until the title arrives. */}
                        <div className="truncate text-[14.5px] font-medium text-nevo-near-black">
                          {(u.uploadId && titles[u.uploadId]) || u.filename}
                        </div>
                        {u.uploadId && titles[u.uploadId] && (
                          <div className="mt-[3px] truncate text-[12.5px] text-nevo-near-black/50">
                            {u.filename}
                          </div>
                        )}
                        {!u.accepted && (
                          <div className="mt-[3px] text-[13px] leading-[1.45] text-nevo-near-black/62">
                            {u.error ?? "Nevo couldn’t read this one."}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
            <p className="mt-[9px] text-[14.5px] leading-[1.55] text-nevo-near-black/66 xl:mt-2.5 xl:text-[15.5px]">
              <span className="xl:hidden">
                Eleven came through cleanly. Two need a quick look.
              </span>
              <span className="hidden xl:inline">
                Eleven lessons came through cleanly. Two just need a quick look
                from you before they&rsquo;re ready.
              </span>
            </p>
            )}

            {/* The frame's 13 lessons back the signed-out demo only - a
                real batch reports files, and those render above. */}
            {!batch && (
            <>
            <div className="mt-[22px] flex items-center gap-2.5 xl:mt-6">
              <span className="text-nevo-navy">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <h3 className="text-[13.5px] font-semibold tracking-[0.02em] text-nevo-near-black/60 uppercase xl:text-sm">
                <span className="xl:hidden">Ready &middot; 11</span>
                <span className="hidden xl:inline">Ready to go &middot; 11 lessons</span>
              </h3>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)] xl:mt-3.5">
              {READY.map((r, i) => (
                <div
                  key={r.title}
                  className={cn(
                    "flex items-center gap-3 px-[18px] py-3 xl:gap-3.5 xl:px-5 xl:py-3.5",
                    i < READY.length - 1 && "border-b border-nevo-near-black/7",
                  )}
                >
                  <span className="shrink-0 text-nevo-navy">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="flex-1 text-[14.5px] font-medium xl:text-[15px]">
                    {r.title}
                  </span>
                  <span className="shrink-0 text-[12.5px] text-nevo-near-black/50 xl:text-[13px]">
                    {r.wk}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-[22px] flex items-center gap-2.5 xl:mt-[26px]">
              <span className="flex size-[17px] items-center justify-center rounded-full border-2 border-nevo-violet text-nevo-navy xl:size-[18px]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>
              </span>
              <h3 className="text-[13.5px] font-semibold tracking-[0.02em] text-nevo-near-black/60 uppercase xl:text-sm">
                <span className="xl:hidden">A quick look &middot; 2</span>
                <span className="hidden xl:inline">A quick look needed &middot; 2 lessons</span>
              </h3>
            </div>
            <div className="mt-3 flex flex-col gap-2.5 xl:mt-3.5 xl:gap-[11px]">
              {REVIEW.map((v) => (
                <div
                  key={v.title}
                  className="flex cursor-pointer items-center gap-4 rounded-xl border-l-[3px] border-nevo-violet bg-nevo-cream-elevated px-[18px] py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] xl:px-5 xl:py-4"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[14.5px] font-semibold xl:text-[15px]">
                      {v.title}
                    </span>
                    <p className="mt-1 text-[13px] leading-[1.45] text-nevo-near-black/66 xl:text-[13.5px]">
                      {v.reason}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-[13.5px] font-medium text-nevo-navy xl:inline">
                    Take a look &rarr;
                  </span>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
