"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  lessonsOf,
  uploadsApi,
  type StructureLesson,
  type UploadStructure,
} from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

/**
 * C07d for a REAL staged upload: the unit Nevo made, the steering a teacher
 * does to it, and the commit that puts it in the library.
 *
 * WHAT CAN BE STEERED, and why not more. `PUT /uploads/{id}/structure` takes
 * the whole document back, so anything expressible in it is editable here:
 * renaming a lesson or a section, reordering either, moving a section to the
 * lesson beside it, and folding a lesson into the one before it.
 *
 * SPLIT IS NOT HERE, and that is a contract limit rather than a shortcut.
 * Starting a new lesson at a boundary means creating a lesson, and
 * `lessonId` is `format: uuid` - a server-assigned identity. Minting one on
 * this side would either be rejected or, worse, accepted as an orphan. Asked
 * of backend; until it answers, the control is absent rather than broken.
 *
 * The third level is a COUNT, not a list. A module carries `segmentIds` and
 * nothing else, and the status response has no segments, so there is nothing
 * to name beneath a section.
 *
 * NOTHING IS COMMITTED THAT THE SERVER HAS NOT SEEN. Confirm is refused while
 * there are unsaved edits: the commit acts on the stored structure, so
 * committing a draft would add a unit shaped differently from the one on
 * screen.
 */

type Saving = "idle" | "saving" | "saved" | "failed";

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
  const [draft, setDraft] = useState<StructureLesson[]>(() =>
    lessonsOf(structure),
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<Saving>("idle");
  const [canUndo, setCanUndo] = useState(false);
  const [phase, setPhase] = useState<"idle" | "confirm" | "committing">("idle");
  const [error, setError] = useState("");

  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

  const totals = draft.reduce(
    (acc, l) => ({
      modules: acc.modules + l.modules.length,
      segments:
        acc.segments + l.modules.reduce((n, m) => n + m.segmentIds.length, 0),
    }),
    { modules: 0, segments: 0 },
  );

  const summary = [
    plural(draft.length, "lesson", "lessons"),
    plural(totals.modules, "section", "sections"),
    plural(totals.segments, "segment", "segments"),
  ].join(" · ");

  /** Every edit goes through here, so nothing changes without marking dirty. */
  const edit = (next: StructureLesson[]) => {
    setDraft(next);
    setDirty(true);
    setSaving("idle");
    setError("");
  };

  const renameLesson = (li: number, title: string) =>
    edit(draft.map((l, i) => (i === li ? { ...l, title } : l)));

  const renameModule = (li: number, mi: number, title: string) =>
    edit(
      draft.map((l, i) =>
        i === li
          ? {
              ...l,
              modules: l.modules.map((m, j) =>
                j === mi ? { ...m, title } : m,
              ),
            }
          : l,
      ),
    );

  const moveLesson = (li: number, by: -1 | 1) => {
    const to = li + by;
    if (to < 0 || to >= draft.length) return;
    const next = [...draft];
    [next[li], next[to]] = [next[to], next[li]];
    edit(next);
  };

  /** Fold a lesson's sections into the one before it. */
  const mergeLessonUp = (li: number) => {
    if (li === 0) return;
    const next = [...draft];
    next[li - 1] = {
      ...next[li - 1],
      modules: [...next[li - 1].modules, ...next[li].modules],
    };
    next.splice(li, 1);
    edit(next);
  };

  const moveModule = (li: number, mi: number, by: -1 | 1) => {
    const to = mi + by;
    const mods = draft[li].modules;
    if (to < 0 || to >= mods.length) return;
    const nextMods = [...mods];
    [nextMods[mi], nextMods[to]] = [nextMods[to], nextMods[mi]];
    edit(draft.map((l, i) => (i === li ? { ...l, modules: nextMods } : l)));
  };

  /** Move a section into the lesson above or below it. */
  const moveModuleAcross = (li: number, mi: number, by: -1 | 1) => {
    const to = li + by;
    if (to < 0 || to >= draft.length) return;
    const moving = draft[li].modules[mi];
    const next = draft.map((l, i) => {
      if (i === li) {
        return { ...l, modules: l.modules.filter((_, j) => j !== mi) };
      }
      if (i === to) {
        return {
          ...l,
          modules: by === -1 ? [...l.modules, moving] : [moving, ...l.modules],
        };
      }
      return l;
    });
    // A lesson emptied by the move is no longer a lesson.
    edit(next.filter((l) => l.modules.length > 0));
  };

  /** Renumber before sending: `sequenceOrder` is the order, not a label. */
  const normalised = (): UploadStructure => {
    const lessons = draft.map((l, i) => ({
      ...l,
      sequenceOrder: i + 1,
      modules: l.modules.map((m, j) => ({ ...m, sequenceOrder: j + 1 })),
    }));
    return {
      ...structure,
      lessons,
      // The legacy mirror is the first lesson; keeping it coherent means a
      // reader of either shape sees the same unit.
      lessonId: lessons[0]?.lessonId ?? structure.lessonId,
      modules: lessons[0]?.modules ?? [],
    };
  };

  const save = async () => {
    if (saving === "saving") return;
    setSaving("saving");
    setError("");
    try {
      const res = await uploadsApi.updateStructure(uploadId, normalised());
      setDraft(lessonsOf(res.structure));
      setCanUndo(Boolean(res.canUndo));
      setDirty(false);
      setSaving("saved");
    } catch {
      setSaving("failed");
      setError(
        "We couldn’t save that just now. Your changes are still here – try again in a moment.",
      );
    }
  };

  const undo = async () => {
    try {
      const res = await uploadsApi.undo(uploadId);
      setDraft(lessonsOf(res.structure));
      setCanUndo(Boolean(res.canUndo));
      setDirty(false);
      setSaving("idle");
    } catch {
      setError("We couldn’t undo that just now.");
    }
  };

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

  const iconBtn =
    "inline-flex size-[26px] shrink-0 cursor-pointer items-center justify-center rounded-lg text-nevo-near-black/45 transition-colors hover:bg-nevo-navy/8 hover:text-nevo-near-black/75 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";
  const titleInput =
    "min-w-0 flex-1 rounded-[6px] bg-transparent px-1 py-0.5 outline-none focus:bg-nevo-cream focus:ring-2 focus:ring-nevo-navy/30";

  const Arrow = ({ up }: { up: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={up ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M18 13l-6 6-6-6"} />
    </svg>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-[22px] xl:px-8 xl:py-7">
        <div className="mb-3.5 flex items-center gap-3 rounded-xl bg-nevo-navy px-[18px] py-[15px]">
          <span className="shrink-0 text-nevo-violet" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

        {draft.map((lesson, li) => (
          <div
            key={lesson.lessonId}
            className="mb-3 rounded-[12px] bg-nevo-cream-elevated px-[18px] py-4 shadow-elevation-1"
          >
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 font-mono text-[10.5px] font-bold tracking-[0.12em] text-nevo-violet">
                {`LESSON ${li + 1}`}
              </span>
              <input
                value={lesson.title}
                onChange={(e) => renameLesson(li, e.target.value)}
                aria-label={`Lesson ${li + 1} title`}
                placeholder="Untitled lesson"
                className={cn(
                  titleInput,
                  "text-[15.5px] font-semibold text-nevo-near-black",
                )}
              />
              <span className="shrink-0 text-[12.5px] text-nevo-near-black/55">
                {plural(lesson.modules.length, "section", "sections")}
              </span>
              <button type="button" onClick={() => moveLesson(li, -1)} disabled={li === 0} aria-label="Move lesson up" title="Move up" className={iconBtn}>
                <Arrow up />
              </button>
              <button type="button" onClick={() => moveLesson(li, 1)} disabled={li === draft.length - 1} aria-label="Move lesson down" title="Move down" className={iconBtn}>
                <Arrow up={false} />
              </button>
              <button type="button" onClick={() => mergeLessonUp(li)} disabled={li === 0} aria-label="Merge into the lesson above" title="Merge into the lesson above" className={iconBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 9h14M5 15h14M9 5l3-3 3 3" />
                </svg>
              </button>
            </div>

            <div className="mt-2.5 flex flex-col gap-2">
              {lesson.modules.map((m, mi) => (
                <div
                  key={`${lesson.lessonId}-${mi}`}
                  className="flex items-center gap-2.5 rounded-[10px] bg-nevo-cream-inset px-3.5 py-2.5"
                >
                  <span className="shrink-0 font-mono text-[10px] font-bold tracking-[0.1em] text-nevo-near-black/45">
                    {`SECTION ${mi + 1}`}
                  </span>
                  <input
                    value={m.title}
                    onChange={(e) => renameModule(li, mi, e.target.value)}
                    aria-label={`Section ${mi + 1} title`}
                    placeholder="Untitled section"
                    className={cn(titleInput, "text-[14px] text-nevo-near-black")}
                  />
                  {/* A count, not a list: the contract gives ids, not titles. */}
                  <span className="shrink-0 text-[12.5px] text-nevo-near-black/55">
                    {plural(m.segmentIds.length, "segment", "segments")}
                  </span>
                  <button type="button" onClick={() => moveModule(li, mi, -1)} disabled={mi === 0} aria-label="Move section up" title="Move up" className={iconBtn}>
                    <Arrow up />
                  </button>
                  <button type="button" onClick={() => moveModule(li, mi, 1)} disabled={mi === lesson.modules.length - 1} aria-label="Move section down" title="Move down" className={iconBtn}>
                    <Arrow up={false} />
                  </button>
                  <button type="button" onClick={() => moveModuleAcross(li, mi, -1)} disabled={li === 0} aria-label="Move to the lesson above" title="Move to the lesson above" className={iconBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 14l-4-4 4-4M5 10h9a5 5 0 0 1 5 5v4" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => moveModuleAcross(li, mi, 1)} disabled={li === draft.length - 1} aria-label="Move to the lesson below" title="Move to the lesson below" className={iconBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 10l-4 4 4 4M5 14h9a5 5 0 0 0 5-5V5" />
                    </svg>
                  </button>
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

      <div className="flex shrink-0 items-center gap-3 border-t border-nevo-near-black/10 bg-nevo-cream px-6 py-3 xl:px-8 xl:py-3.5">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving === "saving"}
          className={cn(
            "inline-flex h-[42px] items-center rounded-[10px] border-[1.5px] px-4 text-[13.5px] font-semibold transition-colors",
            dirty && saving !== "saving"
              ? "cursor-pointer border-nevo-navy/35 text-nevo-navy hover:bg-nevo-navy/6"
              : "cursor-not-allowed border-nevo-near-black/12 text-nevo-near-black/35",
          )}
        >
          {saving === "saving"
            ? "Saving…"
            : saving === "failed"
              ? "Try again"
              : saving === "saved" && !dirty
                ? "Saved"
                : "Save changes"}
        </button>

        {canUndo && !dirty && (
          <button
            type="button"
            onClick={() => void undo()}
            className="inline-flex h-[42px] cursor-pointer items-center rounded-[10px] px-3 text-[13.5px] font-semibold text-nevo-navy transition-colors hover:bg-nevo-navy/6"
          >
            Undo
          </button>
        )}

        <span className="min-w-0 flex-1 truncate text-[12.5px] text-nevo-near-black/60">
          {dirty ? "Unsaved changes" : summary}
        </span>

        <button
          type="button"
          onClick={() => setPhase("confirm")}
          disabled={phase === "committing" || dirty}
          title={
            dirty ? "Save your changes before adding this to your library" : undefined
          }
          className={cn(
            "flex h-[46px] items-center rounded-[10px] px-[26px] text-[15px] font-semibold",
            phase === "committing" || dirty
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
