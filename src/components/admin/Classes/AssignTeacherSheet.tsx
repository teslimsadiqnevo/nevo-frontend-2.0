"use client";

import { useEffect, useState } from "react";
import {
  classesApi,
  type AssignedTeacher,
  type TeacherAssignmentRole,
} from "@/lib/api/classes";
import { teachersApi, type TeacherSummary } from "@/lib/api/teachers";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  FailureLine,
  GHOST_BTN,
  PRIMARY_BTN,
  Sheet,
  Spinner,
} from "../Roster/primitives";

/**
 * D5c Teacher-class assignment - the many-to-many join.
 *
 * SCRUM-40 calls this the highest-risk interaction in the ticket, and says why:
 * a mis-assignment sends a teacher into the wrong students' console. So every
 * commit states its consequence in plain words BEFORE it happens, which is
 * what the primary-conflict notice below is for.
 *
 * Exactly one teacher per class is Primary. Choosing Primary where one already
 * exists demotes the incumbent, so the notice names them and the commit label
 * changes to say what the button will actually do. Not a modal, not a blocker -
 * the admin is allowed to mean it.
 *
 * This sheet is the one on CLASS DETAIL, which the spec names as the primary
 * flow. Teacher detail mirrors it with the same role cards and identical
 * wording; where the two would diverge, class detail wins.
 *
 * TODO(api): the backend does not demote the previous primary as part of this
 * call, and offers no transaction that would. The notice therefore describes an
 * intent the API does not yet guarantee. Raised with backend - until it is
 * settled, a school can end up with two primaries, and only the backend can
 * prevent that.
 */

const LABEL = "mb-[7px] block text-[12.5px] font-semibold text-nevo-near-black/60";

type Phase = "idle" | "assigning" | "assigned" | "failed";

const ROLES: {
  value: TeacherAssignmentRole;
  title: string;
  detail: string;
}[] = [
  {
    value: "co_teacher",
    title: "Co-teacher",
    detail: "Sees the class and supports; the primary teacher leads.",
  },
  {
    value: "primary",
    title: "Primary teacher",
    detail: "Leads the class. Only one primary per class.",
  },
];

export function AssignTeacherSheet({
  classId,
  className,
  classSubtitle,
  assigned,
  onClose,
  onAssigned,
}: {
  classId: string;
  className: string;
  /** "Year 8" etc, for the sheet's second line. */
  classSubtitle: string | null;
  /** Who already teaches this class - drives the primary-conflict notice. */
  assigned: AssignedTeacher[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [role, setRole] = useState<TeacherAssignmentRole | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    teachersApi
      .list()
      .then(setTeachers)
      .catch(() => setTeachers([]));
  }, []);

  // Somebody already assigned cannot be assigned again from here; the row's own
  // "Remove from this class" is how a role changes.
  const assignable = teachers.filter(
    (t) => !assigned.some((a) => a.teacher_id === t.id),
  );

  const currentPrimary = assigned.find((a) => a.role === "primary");
  const primaryConflict = role === "primary" && Boolean(currentPrimary);
  const primaryName = currentPrimary
    ? [currentPrimary.first_name, currentPrimary.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      currentPrimary.email ||
      "the current primary teacher"
    : null;

  const chosen = assignable.find((t) => t.id === teacherId);
  const ready = Boolean(teacherId && role);

  const submit = () => {
    if (!ready || !role) return;
    setPhase("assigning");
    classesApi
      .createAssignment({ teacher_id: teacherId, class_id: classId, role })
      .then(() => {
        setPhase("assigned");
        // Let the confirmation be read before the sheet goes.
        setTimeout(onAssigned, 1100);
      })
      .catch(() => setPhase("failed"));
  };

  return (
    <Sheet
      title="Assign a teacher"
      subtitle={classSubtitle ? `to ${className} · ${classSubtitle}` : `to ${className}`}
      onClose={onClose}
      footer={
        phase === "assigning" ? (
          <div className="flex flex-1 items-center justify-center gap-2.5 py-3">
            <Spinner />
            <span className="text-sm text-nevo-near-black/60">Assigning…</span>
          </div>
        ) : phase === "assigned" ? (
          <div className="flex flex-1 items-center justify-center gap-2.5 py-3">
            <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-nevo-navy text-nevo-cream motion-safe:animate-nevo-pop">
              <CheckIcon />
            </span>
            <span className="text-[14.5px] font-semibold text-nevo-navy">
              {chosen?.name} added to {className}
            </span>
          </div>
        ) : phase === "failed" ? (
          <>
            <FailureLine>
              That didn&rsquo;t go through. We&rsquo;re on it - your choices are
              still here.
            </FailureLine>
            <button type="button" onClick={submit} className={PRIMARY_BTN}>
              Try again
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={submit}
              disabled={!ready}
              className={cn(PRIMARY_BTN, "flex-1 justify-center")}
            >
              {primaryConflict ? "Assign and make Primary" : "Assign teacher"}
            </button>
            <button type="button" onClick={onClose} className={GHOST_BTN}>
              Cancel
            </button>
          </>
        )
      }
    >
      <div>
        <label htmlFor="assign-teacher" className={LABEL}>
          Teacher
        </label>
        <select
          id="assign-teacher"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="h-[50px] w-full cursor-pointer rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream px-[15px] text-[15px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy"
        >
          <option value="">Choose a teacher</option>
          {assignable.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {assignable.length === 0 ? (
          <p className="mt-2 text-[12.5px] leading-[1.5] text-nevo-near-black/55">
            Everyone on staff already teaches this class.
          </p>
        ) : null}
      </div>

      <fieldset className="border-none p-0">
        <legend className={LABEL}>Role in this class</legend>
        <div className="flex flex-col gap-2.5">
          {ROLES.map((r) => {
            const selected = role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                aria-pressed={selected}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl bg-nevo-cream-elevated px-4 py-[15px] text-left transition-colors",
                  selected
                    ? "border-2 border-nevo-navy bg-nevo-navy/[0.06]"
                    : "border-[1.5px] border-nevo-near-black/14",
                )}
              >
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-nevo-near-black">
                    {r.title}
                  </span>
                  <span className="block text-[13px] leading-[1.45] text-nevo-near-black/62">
                    {r.detail}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-6 flex-none items-center justify-center rounded-full",
                    selected
                      ? "bg-nevo-navy text-nevo-cream"
                      : "border-2 border-nevo-near-black/22",
                  )}
                >
                  {selected ? <CheckIcon /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {primaryConflict ? (
        <p className="m-0 rounded-[10px] bg-nevo-violet/24 px-4 py-3 text-[13.5px] leading-[1.5] text-nevo-navy">
          {primaryName} is the primary teacher for {className}. Making{" "}
          {chosen?.name ?? "this teacher"} primary moves {primaryName} to
          co-teacher.
        </p>
      ) : null}
    </Sheet>
  );
}
