"use client";

import { useState } from "react";
import type { AdminClass } from "@/lib/api/classes";
import { studentsApi } from "@/lib/api/students";
import { yearGroupLabel } from "@/lib/constants/yearGroups";
import { cn } from "@/lib/utils";
import {
  FailureLine,
  GHOST_BTN,
  PRIMARY_BTN,
  Sheet,
  Spinner,
} from "../Roster/primitives";

/**
 * D7c Move to another class.
 *
 * A MOVE NEVER RESETS ANYTHING. That is the whole reassurance of this sheet,
 * and it is stated before the commit rather than discovered afterwards -
 * progress, profile and history all follow the student across.
 *
 * TODO(api): D7c offers "Move now" or a scheduled date ("Monday, 1 September
 * 2026 · start of next term"). `PATCH /api/v1/students/{id}/class` takes a
 * class id and nothing else, so only "now" is offered. A date picker that
 * silently moved the student immediately would be a lie, and one that queued
 * nothing would be worse.
 */

type Phase = "idle" | "moving" | "failed";

export function MoveStudentSheet({
  studentId,
  studentName,
  currentClass,
  classes,
  onClose,
  onMoved,
}: {
  studentId: string;
  studentName: string;
  currentClass: AdminClass | null;
  classes: AdminClass[];
  onClose: () => void;
  onMoved: () => void;
}) {
  const [destination, setDestination] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  const firstName = studentName.split(" ").filter(Boolean)[0] ?? studentName;
  const options = classes.filter((c) => c.id !== currentClass?.id && !c.archivedAt);
  const dest = options.find((c) => c.id === destination);

  const move = () => {
    if (!destination) return;
    setPhase("moving");
    studentsApi
      .moveToClass(studentId, destination)
      .then(onMoved)
      .catch(() => setPhase("failed"));
  };

  const describe = (c: AdminClass | null | undefined) =>
    c ? [c.name, yearGroupLabel(c.yearGroup)].filter(Boolean).join(" · ") : "No class";

  return (
    <Sheet
      title={`Move ${firstName} to another class`}
      subtitle="Nothing about their learning changes."
      onClose={onClose}
      footer={
        phase === "moving" ? (
          <div className="flex flex-1 items-center justify-center gap-2.5 py-3">
            <Spinner />
            <span className="text-sm text-nevo-near-black/60">Moving {firstName}…</span>
          </div>
        ) : phase === "failed" ? (
          <>
            <FailureLine>
              That didn&rsquo;t go through, and nothing has changed.
              We&rsquo;re on it.
            </FailureLine>
            <button type="button" onClick={move} className={PRIMARY_BTN}>
              Try again
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={move}
              disabled={!destination}
              className={cn(PRIMARY_BTN, "flex-1 justify-center")}
            >
              Move {firstName}
            </button>
            <button type="button" onClick={onClose} className={GHOST_BTN}>
              Cancel
            </button>
          </>
        )
      }
    >
      <div>
        <span className="mb-[7px] block text-[12.5px] font-semibold text-nevo-near-black/60">
          Class now
        </span>
        <p className="m-0 rounded-[10px] bg-nevo-cream-elevated px-[15px] py-3.5 text-[15px] text-nevo-near-black">
          {describe(currentClass)}
        </p>
      </div>

      <div>
        <label
          htmlFor="move-dest"
          className="mb-[7px] block text-[12.5px] font-semibold text-nevo-near-black/60"
        >
          Move to
        </label>
        <select
          id="move-dest"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="h-[50px] w-full cursor-pointer rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream px-[15px] text-[15px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy"
        >
          <option value="">Choose a class</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {describe(c)}
            </option>
          ))}
        </select>
      </div>

      {dest ? (
        <div>
          <span className="mb-[7px] block text-[12.5px] font-semibold text-nevo-near-black/60">
            What this changes
          </span>
          <ul className="m-0 list-none space-y-2 p-0 text-[13.5px] leading-[1.55] text-nevo-near-black/70">
            <li>
              {firstName} joins {dest.name} and their new teachers can see them.
            </li>
            <li>
              {currentClass ? `Their ${currentClass.name} teachers no longer will.` : null}
            </li>
            <li className="font-semibold text-nevo-navy">
              Their progress, profile and history all move with them. Nothing
              resets.
            </li>
          </ul>
        </div>
      ) : null}
    </Sheet>
  );
}
