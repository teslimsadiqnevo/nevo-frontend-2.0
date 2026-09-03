"use client";

import { AdaptationLogView } from "@/components/admin/Adaptations/AdaptationLogView";
import { ComplianceView } from "@/components/admin/Compliance/ComplianceView";
import { OverviewView } from "@/components/admin/Overview/OverviewView";
import { DEMO_ADAPTATION_LOG, DEMO_COMPLIANCE } from "@/lib/demo/adminDemoApi";
import { cn } from "@/lib/utils";
import { ConsoleFrame } from "../ConsoleFrame";
import { DemoLockup } from "../DemoLockup";
import { CountUp, Reveal } from "../chrome";

/**
 * The admin film's scenes.
 *
 * `OverviewView`, `AdaptationLogView` and `ComplianceView` are the shipped
 * components, rendering against the demo's fetch shim rather than a rebuild -
 * see `lib/demo/adminDemoApi.ts` for why that shim exists and what it does not
 * touch.
 *
 * The admin set is drawn at desktop 1440x900 and tablet 1024x768 with no
 * mobile frame anywhere, so the console is framed the same way the teacher
 * film frames it: real screen, real rail, scaled up for a projector.
 */

const ADMIN_NAV = [
  { name: "Overview", href: "/admin/dashboard" },
  { name: "Classes", href: "/admin/classes" },
  { name: "Students", href: "/admin/students" },
  { name: "Learning Support", href: "/admin/senco" },
  { name: "Reports", href: "/admin/reports" },
  { name: "Settings", href: "/admin/settings" },
];

const ADMIN_IDENTITY = {
  initials: "FA",
  name: "Mrs. Adebayo",
  school: "Corona Secondary School",
};

function AdminConsole({
  active,
  pan = 0,
  panWindow,
  children,
}: {
  active: string;
  pan?: number;
  panWindow?: readonly [number, number];
  children: React.ReactNode;
}) {
  return (
    <ConsoleFrame
      active={active}
      nav={ADMIN_NAV}
      identity={ADMIN_IDENTITY}
      scale={1.24}
      pan={pan}
      panWindow={panWindow}
      className="h-full"
    >
      {children}
    </ConsoleFrame>
  );
}

/* --------------------------------------------------------------- 1. INTRO */

export function AdminIntroScene({ progress }: { progress: number }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-nevo-cream">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(1100px 620px at 50% 44%, rgba(154,156,203,0.20) 0%, rgba(247,241,230,0) 70%)",
        }}
      />
      <div className="relative flex flex-col items-center">
        <Reveal show={progress > 0.06}>
          <DemoLockup width={560} priority />
        </Reveal>
        <Reveal show={progress > 0.16} delay={80}>
          <h1 className="m-0 mt-14 text-[86px] font-semibold leading-none tracking-[-0.034em] text-nevo-near-black">
            For the school
          </h1>
        </Reveal>
        <Reveal show={progress > 0.34} delay={120}>
          <p className="m-0 mt-9 text-[36px] leading-none tracking-[-0.014em] text-nevo-near-black/58">
            Adaptation you can account for.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 2. OVERVIEW */

export function AdminOverviewScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[52px]">
      <Reveal show={progress > 0.02}>
        <div className="flex items-end justify-between gap-10">
          <div>
            <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
              Corona Secondary School
            </p>
            <h2 className="m-0 mt-2.5 text-[42px] font-semibold leading-none tracking-[-0.022em] text-nevo-near-black">
              The school, this morning
            </h2>
          </div>
          <div className="flex gap-11">
            {[
              { label: "Learners profiled", value: DEMO_COMPLIANCE.studentsProfiled },
              { label: "Adaptations this term", value: DEMO_COMPLIANCE.adaptationEventsLogged },
            ].map((s, i) => (
              <Reveal key={s.label} show={progress > 0.04} delay={140 + i * 110}>
                <div className="text-right">
                  <div className="text-[46px] font-semibold leading-none tracking-[-0.028em] text-nevo-navy tabular-nums">
                    <CountUp value={s.value} progress={Math.max(0, progress - 0.05)} window={0.26} />
                  </div>
                  <div className="mt-2 text-[17px] font-medium text-nevo-near-black/58">
                    {s.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal show={progress > 0.12} delay={200} className="mt-9 min-h-0 flex-1">
        {/* Panned early and hard. The Overview leads with its board-narrative
            card, which carries an honest "this summary is a sample" note - the
            right thing in the product, and a line that undercuts the film if a
            room reads it. The compliance card below is what this scene is
            about, so the pan reaches it quickly and rests there. */}
        <AdminConsole active="Overview" pan={progress} panWindow={[0.06, 0.5]}>
          <OverviewView />
        </AdminConsole>
      </Reveal>
    </div>
  );
}

/* ----------------------------------------------------------------- 3. LOG */

export function AdminLogScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[52px]">
      <Reveal show={progress > 0.02}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          Every change, written down
        </p>
        <h2 className="m-0 mt-2.5 text-[42px] font-semibold leading-none tracking-[-0.022em] text-nevo-near-black">
          The adaptation log
        </h2>
      </Reveal>

      <Reveal show={progress > 0.1} delay={200} className="mt-8 min-h-0 flex-1">
        <AdminConsole active="Overview" pan={progress}>
          <AdaptationLogView />
        </AdminConsole>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------ 4. REGISTER */

/**
 * The argument scene: what the wording is, and what it deliberately is not.
 *
 * The left column is real rows from the log. The right is the same rows
 * rewritten the way most systems would write them - and that column is
 * labelled as an example of what Nevo does NOT store, because a screenshot of
 * plausible-looking labels is exactly the thing that gets quoted out of
 * context.
 */
const CONTRAST = [
  {
    real: "Slower on written segments, three sessions running",
    not: "Weak reader",
  },
  {
    real: "Two wrong attempts on the same step",
    not: "Struggles with fractions",
  },
  {
    real: "Fourteen minutes without a pause",
    not: "Poor attention span",
  },
];

export function AdminRegisterScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[62px]">
      <Reveal show={progress > 0.02}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          The register the record is kept in
        </p>
        <h2 className="m-0 mt-3 max-w-[1300px] text-[50px] font-semibold leading-[1.1] tracking-[-0.026em] text-nevo-near-black">
          What happened in a moment, never what a child is
        </h2>
      </Reveal>

      <div className="mt-11 grid flex-1 grid-cols-2 content-center gap-x-16 gap-y-5">
        <Reveal show={progress > 0.08}>
          <p className="m-0 text-[19px] font-semibold uppercase tracking-[0.1em] text-nevo-navy">
            What Nevo records
          </p>
        </Reveal>
        <Reveal show={progress > 0.08} delay={120}>
          <p className="m-0 text-[19px] font-semibold uppercase tracking-[0.1em] text-nevo-near-black/40">
            What it never writes
          </p>
        </Reveal>

        {CONTRAST.map((row, i) => (
          <div key={row.real} className="contents">
            <Reveal show={progress > 0.14} delay={180 + i * 190}>
              <div className="rounded-2xl border-l-[3px] border-nevo-violet bg-nevo-cream-elevated px-8 py-7">
                <p className="m-0 text-[25px] leading-[1.45] text-nevo-near-black/85">
                  {row.real}
                </p>
              </div>
            </Reveal>
            <Reveal show={progress > 0.14} delay={260 + i * 190}>
              <div className="rounded-2xl border border-dashed border-nevo-near-black/20 px-8 py-7">
                <p className="m-0 text-[25px] leading-[1.45] text-nevo-near-black/35 line-through">
                  {row.not}
                </p>
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- 5. ZERO-TAG */

export function AdminZeroTagScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-nevo-cream px-[110px] pb-[190px]">
      <Reveal show={progress > 0.04}>
        <p className="m-0 text-center text-[24px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          Diagnostic labels stored about a child
        </p>
      </Reveal>

      <Reveal show={progress > 0.1} delay={140}>
        <div className="mt-8 text-center text-[280px] font-semibold leading-none tracking-[-0.04em] text-nevo-navy tabular-nums">
          {DEMO_COMPLIANCE.diagnosticLabelsStored}
        </div>
      </Reveal>

      <Reveal show={progress > 0.3} delay={200}>
        <p className="m-0 mt-10 max-w-[68ch] text-center text-[28px] leading-[1.5] text-nevo-near-black/70">
          Across {DEMO_COMPLIANCE.studentsProfiled} learners and{" "}
          {DEMO_COMPLIANCE.adaptationEventsLogged.toLocaleString()} adaptations
          this term. The system changes what it teaches without ever deciding
          what a child is.
        </p>
      </Reveal>
    </div>
  );
}

/* ---------------------------------------------------------- 6. COMPLIANCE */

export function AdminComplianceScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[52px]">
      <Reveal show={progress > 0.02}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          Nigeria Data Protection Act 2023
        </p>
        <h2 className="m-0 mt-2.5 text-[42px] font-semibold leading-none tracking-[-0.022em] text-nevo-near-black">
          Checkable, by the school, on demand
        </h2>
      </Reveal>

      <Reveal show={progress > 0.1} delay={200} className="mt-8 min-h-0 flex-1">
        <AdminConsole active="Overview" pan={progress}>
          <ComplianceView />
        </AdminConsole>
      </Reveal>
    </div>
  );
}

/* ----------------------------------------------------------- 7. RETENTION */

const RETENTION = [
  {
    k: "While they are with you",
    v: "Their record supports the adaptation, and nothing else reads it.",
  },
  {
    k: "When they leave",
    v: "Kept for the period the school sets - not a default we chose.",
  },
  {
    k: "After that",
    v: "Permanently deleted. Teachers' notes stay with the class, with the name removed.",
  },
];

export function AdminRetentionScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[62px]">
      <Reveal show={progress > 0.02}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          Data retention
        </p>
        <h2 className="m-0 mt-3 text-[50px] font-semibold leading-none tracking-[-0.026em] text-nevo-near-black">
          The school decides, in plain words
        </h2>
      </Reveal>

      <div className="mt-12 flex flex-1 flex-col justify-center gap-5">
        {RETENTION.map((row, i) => (
          <Reveal key={row.k} show={progress > 0.1} delay={170 + i * 190}>
            <div
              className={cn(
                "flex items-baseline gap-10 rounded-2xl bg-nevo-cream-elevated px-10 py-8",
                "shadow-[0_2px_10px_rgba(43,43,47,0.06)]",
              )}
            >
              <span className="w-[330px] flex-none text-[24px] font-semibold text-nevo-navy">
                {row.k}
              </span>
              <span className="text-[25px] leading-[1.45] text-nevo-near-black/78">
                {row.v}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- 8. CLOSING */

export function AdminClosingScene({ progress }: { progress: number }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-nevo-cream">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(1100px 620px at 50% 46%, rgba(154,156,203,0.20) 0%, rgba(247,241,230,0) 70%)",
        }}
      />
      <div className="relative flex flex-col items-center text-center">
        <Reveal show={progress > 0.05}>
          <p className="m-0 text-[52px] font-semibold leading-[1.22] tracking-[-0.026em] text-nevo-near-black">
            Adaptation you can
          </p>
        </Reveal>
        <Reveal show={progress > 0.2} delay={100}>
          <p className="m-0 mt-3 text-[52px] font-semibold leading-[1.22] tracking-[-0.026em] text-nevo-near-black/50">
            account for.
          </p>
        </Reveal>
        <Reveal show={progress > 0.42} delay={160}>
          <div className="mt-[86px] flex items-center gap-6">
            <DemoLockup width={300} />
            <span className="h-[46px] w-px bg-nevo-near-black/20" />
            <span className="text-[38px] font-semibold tracking-[-0.024em] text-nevo-near-black">
              For schools
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export { DEMO_ADAPTATION_LOG };
