"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { classesApi, type AdminClass } from "@/lib/api/classes";
import {
  studentsApi,
  type AdminStudentDetail,
  type ParentLink,
} from "@/lib/api/students";
import { yearGroupLabel } from "@/lib/constants/yearGroups";
import { cn } from "@/lib/utils";
import {
  Avatar,
  CARD,
  GHOST_BTN,
  Modal,
  PRIMARY_BTN,
  ROW_DIVIDER,
  Spinner,
  TEXT_ACTION,
} from "../Roster/primitives";
import { EraseRecordModal } from "./EraseRecordModal";
import { MoveStudentSheet } from "./MoveStudentSheet";

/**
 * D7b Student detail - the admin-scoped record for one student.
 *
 * The spec's test for this page is a good one: A SENCO SHOULD BE ABLE TO SHOW
 * IT TO A PARENT WITHOUT EMBARRASSMENT. It holds enrolment, class, guardians
 * and the two administrative actions, and it holds no learning detail at all.
 * The boundary line at the foot of the enrolment card says so in plain words
 * and stays visible rather than hiding in a tooltip - it is a trust feature.
 *
 * REMOVAL IS TWO STEPS IN TWO SITTINGS. Deactivation is the only action
 * available on an active student; erasing appears only once they are already
 * deactivated, and is gated on the typed name. Nothing goes from live to
 * erased in a single pass.
 *
 * TODO(api): the CONSENT card is not built. `GET /api/v1/students/{id}`
 * carries no consent state, no giver, no date and no channel, and
 * `parent-links` carries `account_created`, which answers a different
 * question. The card is a record a school may have to stand behind, so it is
 * absent rather than assembled from the nearest-looking fields. This also
 * removes the header's consent pill and the "View record" link.
 *
 * TODO(api): three enrolment fields the frame draws have no source - the
 * ENROLLED date, the "Added by" line (hand-enrolled vs roster sync), and the
 * per-guardian relationship, "Primary contact" flag and last-active line.
 */

type Phase = "loading" | "ready" | "failed";

export function StudentDetailView({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [student, setStudent] = useState<AdminStudentDetail | null>(null);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [guardians, setGuardians] = useState<ParentLink[]>([]);
  const [moving, setMoving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(() => {
    Promise.all([studentsApi.get(studentId), classesApi.list(true)])
      .then(([s, cls]) => {
        setStudent(s);
        setClasses(cls);
        setPhase("ready");
        // Guardians are their own card and their own failure - a roster record
        // is still worth showing when the parent list does not answer.
        studentsApi
          .parentLinks(studentId)
          .then(setGuardians)
          .catch(() => setGuardians([]));
      })
      .catch(() => setPhase("failed"));
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (phase === "loading") {
    return (
      <Wrapper>
        <div className={cn(CARD, "h-[420px] animate-pulse")} />
      </Wrapper>
    );
  }

  if (phase === "failed" || !student) {
    return (
      <Wrapper>
        <div className={cn(CARD, "px-[26px] py-7")}>
          <h3 className="text-[17px] font-semibold text-nevo-near-black">
            We couldn&rsquo;t load this student
          </h3>
          <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
            Nothing has changed - this is only about showing you the record. Try
            again in a moment.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setPhase("loading");
                load();
              }}
              className={PRIMARY_BTN}
            >
              Try again
            </button>
            <Link href="/admin/students" className={GHOST_BTN}>
              Back to students
            </Link>
          </div>
        </div>
      </Wrapper>
    );
  }

  const name =
    [student.firstName, student.lastName].filter(Boolean).join(" ").trim() ||
    student.loginIdentifier ||
    "This student";
  const firstName = student.firstName ?? name.split(" ")[0];
  const deactivated = student.status.toLowerCase() !== "active";
  const currentClass = classes.find((c) => student.classIds.includes(c.id)) ?? null;

  return (
    <Wrapper>
      <Link
        href="/admin/students"
        className="text-[13.5px] font-semibold text-nevo-navy hover:opacity-75"
      >
        &larr; All students
      </Link>

      <div className="mt-3 flex items-center gap-4">
        <Avatar name={name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="m-0 text-[26px] font-semibold tracking-[-0.018em] text-nevo-near-black max-lg:text-[22px]">
              {name}
            </h2>
            {deactivated ? (
              <span className="inline-flex items-center rounded-full bg-nevo-near-black/[0.07] px-[11px] py-1 text-[11.5px] font-semibold text-nevo-near-black/60">
                Deactivated
              </span>
            ) : null}
          </div>
          <div className="mt-[3px] truncate text-[14.5px] text-nevo-near-black/62">
            {currentClass
              ? `${deactivated ? "Was in " : ""}${currentClass.name}`
              : "No class"}
          </div>
        </div>
      </div>

      <SectionLabel>Enrolment</SectionLabel>
      <div className={cn(CARD, "mt-2.5 px-6 py-[22px]")}>
        <dl className="m-0 grid grid-cols-2 gap-x-10 gap-y-[22px] max-lg:grid-cols-1">
          <Field
            label="Class"
            value={
              currentClass
                ? [
                    currentClass.name,
                    currentClass.subjects.length > 0
                      ? currentClass.subjects.join(", ")
                      : yearGroupLabel(currentClass.yearGroup),
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Not in a class"
            }
          />
          <Field label="Username" value={student.loginIdentifier ?? "Not set"} />
          <Field
            label="Status"
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 flex-none rounded-full",
                    deactivated ? "bg-nevo-near-black/35" : "bg-nevo-navy",
                  )}
                />
                {deactivated ? "Deactivated" : "Active"}
              </span>
            }
          />
          <Field label="Age band" value={student.ageBand ?? "Not set"} />
        </dl>

        <div className="mt-[22px] border-t border-nevo-near-black/8 pt-4">
          <p className="m-0 flex items-start gap-2 text-[13px] leading-[1.55] text-nevo-near-black/60">
            <LockGlyph />
            <span>
              How {firstName} {deactivated ? "was" : "is"} getting on
              isn&rsquo;t shown here. That belongs to their teachers, and to
              Learning Support where a teacher has shared it.
            </span>
          </p>
        </div>
      </div>

      <SectionLabel>Parent / guardian accounts</SectionLabel>
      <div className={cn(CARD, "mt-2.5")}>
        {guardians.length === 0 ? (
          <div className="px-6 py-[22px]">
            <p className="m-0 text-[15px] font-semibold text-nevo-near-black">
              No guardian on the record
            </p>
            <p className="m-0 mt-1.5 text-[13.5px] leading-[1.55] text-nevo-near-black/62">
              A parent account is created automatically once a guardian
              confirms consent.
            </p>
          </div>
        ) : (
          guardians.map((g, i) => (
            <div
              key={g.id}
              className={cn(
                "flex items-center gap-3.5 px-6 py-[18px]",
                i < guardians.length - 1 && ROW_DIVIDER,
              )}
            >
              <Avatar name={g.parent_name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-nevo-near-black">
                  {g.parent_name}
                </div>
                <div className="truncate text-[13.5px] text-nevo-near-black/62">
                  {g.parent_contact}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex flex-none items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-semibold",
                  g.account_created
                    ? "bg-nevo-navy/12 text-nevo-navy"
                    : "bg-nevo-near-black/[0.07] text-nevo-near-black/60",
                )}
              >
                {g.account_created ? (
                  <span aria-hidden="true" className="size-[7px] rounded-full bg-nevo-navy" />
                ) : null}
                {g.account_created ? "Account active" : "No account yet"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* THE ACTIONS FOOT. Deactivate is the only action on an active student;
          erase only appears once they are already deactivated. */}
      <div className="mt-8 border-t border-nevo-near-black/10 pt-5">
        {deactivated ? (
          <>
            <button
              type="button"
              disabled={working}
              onClick={() => {
                setWorking(true);
                studentsApi
                  .restore(student.id)
                  .then(load)
                  .catch(() => undefined)
                  .finally(() => setWorking(false));
              }}
              className={TEXT_ACTION}
            >
              Restore this student
            </button>
            <p className="mt-1.5 max-w-[520px] text-[13px] leading-[1.5] text-nevo-near-black/55">
              They pick up exactly where they left off, in the same class unless
              you move them.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setErasing(true)}
                className={TEXT_ACTION}
              >
                Erase this record permanently
              </button>
              <p className="mt-1.5 max-w-[520px] text-[13px] leading-[1.5] text-nevo-near-black/55">
                Only possible now they&rsquo;re deactivated. This one
                can&rsquo;t be undone.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-8">
            <div>
              <button type="button" onClick={() => setMoving(true)} className={TEXT_ACTION}>
                Move to another class
              </button>
              <p className="mt-1.5 max-w-[420px] text-[13px] leading-[1.5] text-nevo-near-black/55">
                Nothing about their learning changes.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setConfirmDeactivate(true)}
                className={TEXT_ACTION}
              >
                Remove {firstName} from the school
              </button>
              <p className="mt-1.5 max-w-[420px] text-[13px] leading-[1.5] text-nevo-near-black/55">
                Everything they have built is kept, and you can bring them back.
              </p>
            </div>
          </div>
        )}
      </div>

      {moving ? (
        <MoveStudentSheet
          studentId={student.id}
          studentName={name}
          currentClass={currentClass}
          classes={classes}
          onClose={() => setMoving(false)}
          onMoved={() => {
            setMoving(false);
            load();
          }}
        />
      ) : null}

      {confirmDeactivate ? (
        <Modal
          title={`Remove ${firstName} from the school`}
          subtitle={name}
          onClose={() => setConfirmDeactivate(false)}
          footer={
            working ? (
              <div className="flex flex-1 items-center justify-center gap-2.5 py-3">
                <Spinner />
                <span className="text-sm text-nevo-near-black/60">Deactivating…</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setWorking(true);
                    studentsApi
                      .deactivate(student.id)
                      .then(() => {
                        setConfirmDeactivate(false);
                        load();
                      })
                      .catch(() => undefined)
                      .finally(() => setWorking(false));
                  }}
                  className={cn(PRIMARY_BTN, "flex-1 justify-center")}
                >
                  Deactivate {firstName}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeactivate(false)}
                  className={GHOST_BTN}
                >
                  Keep them active
                </button>
              </>
            )
          }
        >
          <p className="m-0 text-[14.5px] leading-[1.6] text-nevo-near-black/72">
            {firstName} will stop having access, and their seat frees up.
            Everything they have built is kept, and you can bring them back
            whenever you need to.
          </p>
        </Modal>
      ) : null}

      {erasing ? (
        <EraseRecordModal
          studentId={student.id}
          studentName={name}
          onClose={() => setErasing(false)}
          onErased={() => router.push("/admin/students")}
        />
      ) : null}
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[780px]">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-0 mt-7 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-nevo-near-black/45">
      {children}
    </h3>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.03em] text-nevo-near-black/42">
        {label}
      </dt>
      <dd className="m-0 mt-1 text-[15px] font-medium text-nevo-near-black">{value}</dd>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-[3px] flex-none text-nevo-violet/90"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
