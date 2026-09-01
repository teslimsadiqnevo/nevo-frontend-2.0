"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { exportApi, type IepExport } from "@/lib/api/export";
import { studentsApi, type AdminStudentRow, type ParentLink } from "@/lib/api/students";
import { cn } from "@/lib/utils";
import {
  Avatar,
  CARD,
  CheckIcon,
  GHOST_BTN,
  PRIMARY_BTN,
  Spinner,
} from "../Roster/primitives";

/**
 * D8 IEP Exporter - a progress report, drafted by Nevo and finalised by a
 * person.
 *
 * THE REVIEW STEP IS NEVER SKIPPABLE. That is the entire design of this
 * screen, and it is a safeguarding property rather than a preference: the
 * draft carries a persistent "Draft - review before sharing" banner, a named
 * member of staff must read and check it, and nothing reaches a family until
 * they do. There is no path from generation to sharing that does not pass
 * through a human, and no shortcut may be added.
 *
 * The register is fixed too: PROSE A PARENT COULD READ. No scores, no clinical
 * shorthand, no confidence figures. The draft covers engagement, how the
 * learner learns best, pacing and working memory, and areas of growth - and
 * the backend composes it that way; this screen must not add a number to it.
 *
 * The reviewer is the signed-in SENCo, taken server-side from the caller
 * rather than picked from a list. D8's tablet frame draws a "Reviewing member
 * of staff" selector, but choosing a colleague to be recorded as having read
 * something they have not read is exactly the attestation this flow exists to
 * prevent - so the field is absent, and the person pressing Finalise is the
 * person named. Raised with design.
 *
 * TODO(api): "Download PDF" has no endpoint. `exports/iep` has no `.pdf`
 * route - the only PDF in the whole API is the compliance audit's - so the
 * action is absent rather than a button that fails. Sharing with the guardian
 * works, which is the path that matters most.
 */

type Phase =
  | "picking"
  | "generating"
  | "draft"
  | "saving"
  | "finalising"
  | "final"
  | "sharing"
  | "shared"
  | "failed";

const LABEL = "mb-[7px] block text-[12.5px] font-semibold text-nevo-near-black/60";

const FIELD =
  "h-[50px] w-full rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream px-[15px] text-[15px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy";

/** ISO yyyy-mm-dd, which is what the endpoint's `date` format wants. */
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function IepExporterView() {
  const [phase, setPhase] = useState<Phase>("picking");
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [draft, setDraft] = useState<IepExport | null>(null);
  const [content, setContent] = useState("");
  const [guardians, setGuardians] = useState<ParentLink[]>([]);
  const [savedAt, setSavedAt] = useState(false);

  // The clock is read in an effect, never during render. Default period is the
  // last four months, which is about a Nigerian half-term.
  //
  // Scheduled rather than set synchronously in the effect body: the house
  // pattern (react-hooks/set-state-in-effect), same as PermissionContext.
  useEffect(() => {
    const t = setTimeout(() => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 4);
      setPeriodEnd(iso(end));
      setPeriodStart(iso(start));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    studentsApi
      .list()
      .then(setStudents)
      .catch(() => setStudents([]));
  }, []);

  const student = students.find((s) => s.id === studentId);
  const firstName = student?.name.split(" ").filter(Boolean)[0] ?? "this learner";

  const loadGuardians = useCallback((id: string) => {
    studentsApi
      .parentLinks(id)
      .then(setGuardians)
      .catch(() => setGuardians([]));
  }, []);

  const generate = () => {
    if (!studentId || !periodStart || !periodEnd) return;
    setPhase("generating");
    exportApi
      .create({ studentId, periodStart, periodEnd })
      .then((d) => {
        setDraft(d);
        setContent(d.exportContent);
        setPhase(d.status === "final" ? "final" : "draft");
        loadGuardians(studentId);
      })
      .catch(() => setPhase("failed"));
  };

  const saveDraft = () => {
    if (!draft) return;
    setPhase("saving");
    exportApi
      .update(draft.id, { exportContent: content })
      .then((d) => {
        setDraft(d);
        setSavedAt(true);
        setPhase("draft");
        setTimeout(() => setSavedAt(false), 2000);
      })
      .catch(() => setPhase("failed"));
  };

  const finalise = () => {
    if (!draft) return;
    setPhase("finalising");
    // The edited wording goes with the review, so what is finalised is what
    // the reviewer actually read on screen.
    exportApi
      .review(draft.id, { exportContent: content })
      .then((d) => {
        setDraft(d);
        setContent(d.exportContent);
        setPhase("final");
      })
      .catch(() => setPhase("failed"));
  };

  const share = (parentId: string) => {
    if (!draft) return;
    setPhase("sharing");
    exportApi
      .share(draft.id, { parentId })
      .then(() => setPhase("shared"))
      .catch(() => setPhase("failed"));
  };

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[780px]">
        <Link
          href="/admin/senco"
          className="text-[13.5px] font-semibold text-nevo-navy hover:opacity-75"
        >
          &larr; Learning Support
        </Link>

        {/* -------------------------------------------------------- PICKING */}
        {phase === "picking" || phase === "generating" ? (
          <>
            <h2 className="m-0 mt-3 text-[28px] font-semibold tracking-[-0.018em] text-nevo-near-black">
              Create a progress report
            </h2>
            <p className="mt-2 max-w-[62ch] text-[14.5px] leading-[1.6] text-nevo-near-black/62">
              Nevo drafts from what it has seen this period. You review and edit
              every word before anything is shared - nothing is sent
              automatically.
            </p>

            {phase === "generating" ? (
              <div className={cn(CARD, "mt-7 flex flex-col items-center gap-3 px-6 py-16 text-center")}>
                <Spinner />
                <h3 className="m-0 mt-1 text-[17px] font-semibold text-nevo-near-black">
                  Drafting {firstName}&rsquo;s report
                </h3>
                <p className="m-0 max-w-[46ch] text-sm leading-[1.6] text-nevo-near-black/62">
                  Reading this period&rsquo;s sessions and putting them into
                  plain language. This takes a few seconds.
                </p>
              </div>
            ) : (
              <div className={cn(CARD, "mt-7 px-6 py-[26px]")}>
                <div className="flex flex-col gap-5">
                  <div>
                    <label htmlFor="iep-student" className={LABEL}>
                      Student
                    </label>
                    <select
                      id="iep-student"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className={cn(FIELD, "cursor-pointer")}
                    >
                      <option value="">Choose a student</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4 max-lg:flex-col">
                    <div className="flex-1">
                      <label htmlFor="iep-from" className={LABEL}>
                        Reporting period from
                      </label>
                      <input
                        id="iep-from"
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className={FIELD}
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="iep-to" className={LABEL}>
                        to
                      </label>
                      <input
                        id="iep-to"
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className={FIELD}
                      />
                    </div>
                  </div>

                  <p className="m-0 text-[13px] leading-[1.55] text-nevo-near-black/58">
                    The draft covers engagement, how {firstName} learns best,
                    pacing and working memory, and areas of growth. It never
                    includes scores.
                  </p>

                  <button
                    type="button"
                    onClick={generate}
                    disabled={!studentId || !periodStart || !periodEnd}
                    className={cn(PRIMARY_BTN, "self-start")}
                  >
                    Generate draft
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* ---------------------------------------------------------- DRAFT */}
        {draft && (phase === "draft" || phase === "saving" || phase === "finalising") ? (
          <>
            {/* Persistent, and it does not scroll away. */}
            <div className="mt-4 rounded-xl bg-nevo-violet/24 px-5 py-4">
              <p className="m-0 text-[14.5px] font-semibold text-nevo-navy">
                Draft - review before sharing
              </p>
              <p className="m-0 mt-1 text-[13.5px] leading-[1.55] text-nevo-navy/85">
                A named member of staff must read and check this before
                it&rsquo;s finalised. Not shared with anyone.
              </p>
            </div>

            <div className={cn(CARD, "mt-4 px-6 py-[26px]")}>
              <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
                Individual learning summary
              </h3>
              <p className="m-0 mt-1 text-[13px] text-nevo-near-black/58">
                {student?.name} · {periodStart} to {periodEnd}
              </p>

              <label htmlFor="iep-content" className="sr-only">
                Report wording
              </label>
              <textarea
                id="iep-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="mt-4 w-full resize-y rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream p-4 text-[15px] leading-[1.7] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={finalise}
                  disabled={phase !== "draft"}
                  className={PRIMARY_BTN}
                >
                  {phase === "finalising" ? "Finalising…" : "Finalise report"}
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={phase !== "draft"}
                  className={GHOST_BTN}
                >
                  {phase === "saving" ? "Saving…" : "Save draft"}
                </button>
                {savedAt ? (
                  <span className="text-[13px] font-semibold text-nevo-navy motion-safe:animate-nevo-reveal">
                    Saved just now
                  </span>
                ) : null}
                <p className="m-0 w-full text-[13px] text-nevo-near-black/55">
                  Finalising locks the wording. You can still share it
                  afterwards.
                </p>
              </div>
            </div>
          </>
        ) : null}

        {/* ---------------------------------------------------------- FINAL */}
        {draft && (phase === "final" || phase === "sharing" || phase === "shared") ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-nevo-navy px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-nevo-cream">
                Final
              </span>
              <span className="text-[13.5px] text-nevo-near-black/62">
                {draft.reviewedAt
                  ? `Finalised ${new Date(draft.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Finalised"}
              </span>
            </div>

            <div className={cn(CARD, "mt-4 px-6 py-[26px]")}>
              <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
                Individual learning summary
              </h3>
              <p className="m-0 mt-1 text-[13px] text-nevo-near-black/58">
                {student?.name} · {draft.periodStart} to {draft.periodEnd}
              </p>
              <p className="m-0 mt-4 whitespace-pre-wrap text-[15px] leading-[1.7] text-nevo-near-black/85">
                {content}
              </p>
            </div>

            <div className={cn(CARD, "mt-5 px-6 py-[26px]")}>
              <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
                Share with parent / guardian
              </h3>
              <p className="m-0 mt-1.5 text-[13.5px] leading-[1.55] text-nevo-near-black/62">
                Sends a copy to {firstName}&rsquo;s linked guardian.
                They&rsquo;ll see it in their Nevo account.
              </p>

              {phase === "shared" ? (
                <div className="mt-5 flex items-center gap-2.5">
                  <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-nevo-navy text-nevo-cream motion-safe:animate-nevo-pop">
                    <CheckIcon />
                  </span>
                  <span className="text-[14.5px] font-semibold text-nevo-navy">
                    Shared. It&rsquo;s in their account now.
                  </span>
                </div>
              ) : guardians.length === 0 ? (
                <p className="m-0 mt-4 text-sm text-nevo-near-black/62">
                  There&rsquo;s no guardian account on {firstName}&rsquo;s
                  record yet, so there&rsquo;s nobody to send this to.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  {guardians.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-3.5 rounded-xl border-[1.5px] border-nevo-near-black/14 px-4 py-3.5"
                    >
                      <Avatar name={g.parent_name} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold text-nevo-near-black">
                          {g.parent_name}
                        </div>
                        <div className="truncate text-[13px] text-nevo-near-black/62">
                          Guardian ·{" "}
                          {g.account_created ? "account active" : "no account yet"}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!g.parent_id || phase === "sharing"}
                        onClick={() => g.parent_id && share(g.parent_id)}
                        className={PRIMARY_BTN}
                      >
                        {phase === "sharing" ? "Sending…" : "Share"}
                      </button>
                    </div>
                  ))}
                  {guardians.some((g) => !g.parent_id) ? (
                    <p className="m-0 text-[13px] leading-[1.5] text-nevo-near-black/55">
                      A guardian without an account can&rsquo;t receive this
                      yet. It becomes available once they confirm consent and
                      their account is created.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* --------------------------------------------------------- FAILED */}
        {phase === "failed" ? (
          <div className={cn(CARD, "mt-6 px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              Something went wrong. We&rsquo;re on it.
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has been shared, and anything you had written is still
              here. Please give it another try.
            </p>
            <button
              type="button"
              onClick={() => setPhase(draft ? "draft" : "picking")}
              className={cn(PRIMARY_BTN, "mt-5")}
            >
              Go back
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
