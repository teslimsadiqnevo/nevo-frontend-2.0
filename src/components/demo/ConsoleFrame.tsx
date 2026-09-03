"use client";

import { useEffect, useRef } from "react";
import { MOCK_TEACHER, TEACHER_NAV } from "@/components/teacher/Shell/teacherNav";
import { cn } from "@/lib/utils";

/**
 * The console, framed for a stage.
 *
 * The content inside this frame is the REAL teacher console - the same
 * components the product ships, rendering their own fixtures. What this adds
 * is two things a laptop UI does not need and a projector does:
 *
 * 1. SCALE. The console is composed for a ~1040px content column at 14-16px
 *    type. Dropped into a 1920-wide stage unchanged, it reads as a screenshot
 *    of something small. Rendering it at its natural width and scaling the
 *    whole surface up keeps every proportion the designers chose while making
 *    the smallest label legible from the back of a room.
 *
 * 2. AN INERT RAIL. The real `TeacherSidebar` is live: it carries a sign-out,
 *    an account menu and a notifications popover, and on `/demo` its
 *    `usePathname` would highlight nothing. A stray click mid-presentation
 *    opening a sign-out sheet is a bad way to lose a room. So the rail here
 *    mirrors the real one's visual language exactly - the same nav model, the
 *    same active treatment, the same violet edge marker - and does nothing.
 *
 * 3. A PAN. The console's screens are taller than any stage - the dashboard
 *    alone runs to ~2170px of content. Showing only its top third would
 *    misrepresent the product, and shrinking it to fit would defeat the point
 *    of scaling it up. So the frame drifts slowly down the screen across the
 *    scene, the way a person reads it. The motion is driven by the demo clock,
 *    so it pauses when the presenter pauses and rewinds when they step back -
 *    an independent animation would drift out of step with the narration.
 *
 * This is presentation chrome around the product, not a reimplementation of
 * it. The moment the frame starts making design decisions the console does not
 * make, it has gone wrong.
 */

/** Ease-in-out, so the pan starts and ends gently rather than jerking. */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

const RAIL_ICONS: Record<string, React.ReactNode> = {
  Home: (
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
  ),
  Classes: (
    <>
      <path d="M4 5h16v12H4z" />
      <path d="M9 20h6" />
    </>
  ),
  Library: (
    <>
      <path d="M5 4h9a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H5z" />
      <path d="M5 4v14" />
    </>
  ),
  Insights: (
    <>
      <path d="M12 3a5 5 0 0 0-3 9c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a5 5 0 0 0-3-9z" />
      <path d="M10 20h4" />
    </>
  ),
  Connect: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z" />,
};

/** The rail's model. Defaults to the teacher console's five tabs. */
export interface RailIdentity {
  initials: string;
  name: string;
  school: string;
}

export function ConsoleFrame({
  /** Which rail tab reads as current, per scene. */
  active,
  /** Override the rail for a different console - the admin demo passes its own. */
  nav,
  identity,
  /** How much to enlarge the console. 1.3 keeps 14px type at ~18px on stage. */
  scale = 1.3,
  /**
   * 0..1 through the scene. Drives the downward pan, and only if the content
   * is actually taller than the frame.
   */
  pan = 0,
  /** Fraction of the scene the pan occupies, so it can settle before the cut. */
  panWindow = [0.25, 0.9] as const,
  children,
  className,
}: {
  active: string;
  nav?: { name: string; href: string }[];
  identity?: RailIdentity;
  scale?: number;
  pan?: number;
  panWindow?: readonly [number, number];
  children: React.ReactNode;
  className?: string;
}) {
  const railNav = nav ?? TEACHER_NAV;
  const who = identity ?? MOCK_TEACHER;
  const viewport = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  // Written straight to the DOM rather than held in state: this changes on
  // every tick, and a setState per tick would re-render the whole console
  // subtree twenty times a second for a value only the transform needs.
  useEffect(() => {
    const vp = viewport.current;
    const el = inner.current;
    if (!vp || !el) return;
    const overflow = Math.max(0, vp.scrollHeight - vp.clientHeight);
    const [from, to] = panWindow;
    const t = Math.max(0, Math.min(1, (pan - from) / Math.max(0.0001, to - from)));
    const y = -overflow * easeInOut(t);
    el.style.transform = `scale(${scale}) translate3d(0, ${y / scale}px, 0)`;
  }, [pan, scale, panWindow]);
  return (
    <div
      className={cn(
        "flex h-full w-full overflow-hidden rounded-[18px] bg-nevo-cream shadow-[0_30px_90px_rgba(43,43,47,0.28)]",
        className,
      )}
    >
      {/* Rail - a mirror of TeacherSidebar's expanded state, and inert. */}
      <aside className="flex w-[248px] flex-none flex-col bg-nevo-cream-sidebar px-4 py-6">
        <div className="flex items-center gap-3 px-2">
          <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-nevo-navy text-[15px] font-semibold text-nevo-cream">
            {who.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-nevo-near-black">
              {who.name}
            </span>
            <span className="block text-[12px] leading-[1.35] text-nevo-near-black/55">
              {who.school}
            </span>
          </span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {railNav.map((item) => {
            const on = item.name === active;
            return (
              <span
                key={item.name}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-[46px] shrink-0 items-center gap-3.5 rounded-[10px] px-3.5 transition-colors duration-300",
                  on && "bg-nevo-navy/8",
                )}
              >
                {on && (
                  <span className="absolute inset-y-[9px] left-0 w-[3px] rounded-full bg-nevo-violet" />
                )}
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-300",
                    on ? "bg-nevo-navy text-nevo-cream" : "text-nevo-near-black/72",
                  )}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {RAIL_ICONS[item.name] ?? <circle cx="12" cy="12" r="7" />}
                  </svg>
                </span>
                <span
                  className={cn(
                    "text-[15px]",
                    on
                      ? "font-semibold text-nevo-near-black"
                      : "text-nevo-near-black/72",
                  )}
                >
                  {item.name}
                </span>
              </span>
            );
          })}
        </nav>
      </aside>

      {/* The real console content, scaled. `overflow-hidden` rather than
          `auto`: a scrollbar appearing mid-scene is a visible artefact, and
          every scene is composed to fit its frame. */}
      <main ref={viewport} className="relative min-w-0 flex-1 overflow-hidden">
        <div
          ref={inner}
          style={{
            width: `${100 / scale}%`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
