"use client";

import { useEffect, useState } from "react";
import { classesApi, type AssignedClass } from "@/lib/api/classes";
import { teachersApi, type TeacherDetail, type TeacherSummary } from "@/lib/api/teachers";
import { cn } from "@/lib/utils";
import {
  FailureLine,
  GHOST_BTN,
  PRIMARY_BTN,
  RolePill,
  Sheet,
  Spinner,
} from "../Roster/primitives";

/**
 * D6b Remove admin-side access - the reassignment sheet.
 *
 * SCRUM-40's fourth rule: REMOVING A TEACHER NEVER ORPHANS A CLASS. A teacher
 * who holds classes cannot be removed until every one of those classes has
 * somewhere to go, so the commit does not enable until each row is resolved.
 * With no classes held, the sheet collapses to a calm confirm about access
 * rather than about the person.
 *
 * Where they are Primary, the replacement takes Primary - a class must keep
 * exactly one. Where they are Co-teacher, the row also offers "just remove
 * them from this class", because the class already has a primary and nothing
 * is orphaned by their leaving.
 *
 * WHAT THE SPEC ASKS FOR AND THE API CANNOT DO. SCRUM-40 wants
 * `POST teacher/:id/revoke_access { reassignments: [...] }` applied as ONE
 * transaction, and says a partial apply is not a valid outcome. The deployed
 * API has no such endpoint: `POST /api/v1/teachers/{id}/revoke` takes no body,
 * and reassignment is N separate calls. So this sheet sequences them - every
 * class first, revocation last - and if a step fails it STOPS BEFORE REVOKING
 * and says exactly where it got to.
 *
 * That ordering is deliberate. It preserves the property the rule actually
 * protects - no class is ever left without a teacher - even though it cannot
 * preserve atomicity. A half-applied run leaves some classes handed over and
 * the teacher still holding their console, which is recoverable and visible.
 * The reverse order would not be. Raised with backend; the fix is the endpoint
 * the spec already describes.
 */

type Resolution =
  | { kind: "unresolved" }
  | { kind: "reassign"; toTeacherId: string }
  | { kind: "remove" };

type Phase = "idle" | "working" | "failed" | "partial";

export function RemoveAccessSheet({
  teacher,
  held,
  onClose,
  onRemoved,
}: {
  teacher: TeacherDetail;
  held: AssignedClass[];
  onClose: () => void;
  onRemoved: () => void;
}) {
  const [staff, setStaff] = useState<TeacherSummary[]>([]);
  const [plan, setPlan] = useState<Record<string, Resolution>>(() =>
    Object.fromEntries(held.map((h) => [h.assignment_id, { kind: "unresolved" } as Resolution])),
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [applied, setApplied] = useState(0);

  useEffect(() => {
    teachersApi
      .list()
      .then((rows) => setStaff(rows.filter((t) => t.id !== teacher.id)))
      .catch(() => setStaff([]));
  }, [teacher.id]);

  const firstName = teacher.name.split(" ").filter(Boolean).slice(-1)[0] ?? teacher.name;
  const outstanding = held.filter((h) => plan[h.assignment_id]?.kind === "unresolved").length;
  const ready = outstanding === 0;

  const apply = async () => {
    setPhase("working");
    let done = 0;
    try {
      // Classes first, always. Only once every one of them has a teacher does
      // the console access go.
      for (const h of held) {
        const r = plan[h.assignment_id];
        if (r.kind === "reassign") {
          await classesApi.reassign(h.assignment_id, {
            new_teacher_id: r.toTeacherId,
            role: h.role,
          });
        } else if (r.kind === "remove") {
          await classesApi.removeAssignment(h.assignment_id);
        }
        done += 1;
        setApplied(done);
      }
      await teachersApi.revoke(teacher.id);
      onRemoved();
    } catch {
      // Nothing was revoked - that call is last and only runs if the loop
      // completed. Say which it is rather than claiming nothing changed.
      setPhase(done > 0 ? "partial" : "failed");
    }
  };

  // No classes held: a calm confirm about access, not about the person.
  if (held.length === 0) {
    return (
      <Sheet
        title="Remove access?"
        subtitle={teacher.name}
        onClose={onClose}
        footer={
          phase === "working" ? (
            <div className="flex flex-1 items-center justify-center gap-2.5 py-3">
              <Spinner />
              <span className="text-sm text-nevo-near-black/60">Removing access…</span>
            </div>
          ) : phase === "failed" ? (
            <>
              <FailureLine>
                That didn&rsquo;t complete, and nothing has changed.
                We&rsquo;re on it.
              </FailureLine>
              <button type="button" onClick={apply} className={PRIMARY_BTN}>
                Try again
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={apply}
                className={cn(PRIMARY_BTN, "flex-1 justify-center")}
              >
                Remove access
              </button>
              <button type="button" onClick={onClose} className={GHOST_BTN}>
                Cancel
              </button>
            </>
          )
        }
      >
        <p className="m-0 text-[14.5px] leading-[1.6] text-nevo-near-black/72">
          {teacher.name} will no longer be able to open their Nevo console.
          Their classes and notes stay with the school, and you can restore
          access later.
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Remove admin-side access"
      subtitle={teacher.name}
      onClose={onClose}
      widthClass="max-w-[472px]"
      footer={
        phase === "working" ? (
          <div className="flex flex-1 items-center justify-center gap-2.5 py-3">
            <Spinner />
            <span className="text-sm text-nevo-near-black/60">
              Handing over {applied} of {held.length}…
            </span>
          </div>
        ) : phase === "partial" ? (
          <>
            <FailureLine>
              {applied} of {held.length} classes were handed over before this
              stopped. {firstName} still has access - nothing was revoked. You
              can pick up where it left off.
            </FailureLine>
            <button type="button" onClick={onClose} className={PRIMARY_BTN}>
              Close
            </button>
          </>
        ) : phase === "failed" ? (
          <>
            <FailureLine>
              That didn&rsquo;t complete, and nothing has changed. We&rsquo;re
              on it.
            </FailureLine>
            <button type="button" onClick={apply} className={PRIMARY_BTN}>
              Try again
            </button>
          </>
        ) : ready ? (
          <>
            <button
              type="button"
              onClick={apply}
              className={cn(PRIMARY_BTN, "flex-1 justify-center")}
            >
              Reassign and remove access
            </button>
            <button type="button" onClick={onClose} className={GHOST_BTN}>
              Cancel
            </button>
          </>
        ) : (
          <>
            {/* Neutral, not a warning: a count of what is left to decide. */}
            <p className="m-0 flex-1 text-[13.5px] text-nevo-near-black/60">
              {outstanding} of {held.length}{" "}
              {held.length === 1 ? "class" : "classes"} still{" "}
              {outstanding === 1 ? "needs" : "need"} a teacher.
            </p>
            <button type="button" disabled className={PRIMARY_BTN}>
              Reassign and remove access
            </button>
          </>
        )
      }
    >
      <p className="m-0 text-[14.5px] leading-[1.6] text-nevo-near-black/72">
        {teacher.name} teaches {held.length}{" "}
        {held.length === 1 ? "class" : "classes"}. Choose who takes each one,
        and we&rsquo;ll hand them over as they go.
      </p>

      <div className="flex flex-col gap-3">
        {held.map((h) => {
          const r = plan[h.assignment_id];
          const value =
            r.kind === "reassign" ? r.toTeacherId : r.kind === "remove" ? "__remove" : "";
          return (
            <div
              key={h.assignment_id}
              className="rounded-xl border-[1.5px] border-nevo-near-black/14 bg-nevo-cream-elevated px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-nevo-near-black">
                  {h.class_name}
                </span>
                <RolePill role={h.role} />
              </div>
              <label className="mt-3 block">
                <span className="sr-only">Who takes {h.class_name}?</span>
                <select
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPlan((prev) => ({
                      ...prev,
                      [h.assignment_id]:
                        v === ""
                          ? { kind: "unresolved" }
                          : v === "__remove"
                            ? { kind: "remove" }
                            : { kind: "reassign", toTeacherId: v },
                    }));
                  }}
                  className="h-[46px] w-full cursor-pointer rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream px-3.5 text-sm text-nevo-near-black outline-none transition-colors focus:border-nevo-navy"
                >
                  <option value="">Choose who takes this class</option>
                  {staff.map((t) => (
                    <option key={t.id} value={t.id}>
                      {h.role === "primary" ? `${t.name} — as Primary` : t.name}
                    </option>
                  ))}
                  {/* Only offered where the class keeps its primary regardless. */}
                  {h.role === "co_teacher" ? (
                    <option value="__remove">
                      Just remove {firstName} from this class
                    </option>
                  ) : null}
                </select>
              </label>
            </div>
          );
        })}
      </div>

      {ready ? (
        <p className="m-0 rounded-[10px] bg-nevo-violet/24 px-4 py-3 text-[13.5px] leading-[1.55] text-nevo-navy">
          {firstName}&rsquo;s classes will be handed over first, then their
          console access ends. Their notes stay with the school, attributed to
          them, and you can restore access later.
        </p>
      ) : null}
    </Sheet>
  );
}
