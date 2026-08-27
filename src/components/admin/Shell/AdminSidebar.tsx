"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useHasSession } from "@/hooks/useHasSession";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { activeNavLabel, navForScopes, scopeSummary } from "./adminNav";

/**
 * School Admin rail (`Nevo Admin Sidebar`) - imported by every admin screen,
 * never a screen itself. 248px expanded, 64px collapsed, with the group
 * headings giving way to hairline dividers on the way down.
 *
 * The nav is scope-filtered (Product Arch D.3): an admin sees the sections
 * their scopes actually grant, which is why a bursar's rail is four rows and a
 * proprietor's is eleven. Scopes come from `permissions/me` through the
 * provider the admin layout already mounts.
 *
 * Identity follows the same rule as the teacher console: the session carries a
 * `user_id` and a role and no name, so a signed-in admin gets their scope
 * summary over a neutral glyph rather than the frame's fixture persona.
 *
 * TODO(api): a profile endpoint, after which the name and job title are real.
 * TODO(screen): the bell routes to D13 Notifications, which is not built.
 */

const GLYPH = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, React.ReactNode> = {
  Overview: (
    <svg {...GLYPH} strokeWidth={1.9} aria-hidden>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  Classes: (
    <svg {...GLYPH} aria-hidden>
      <rect x="3" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="14" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="14" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  ),
  Teachers: (
    <svg {...GLYPH} aria-hidden>
      <circle cx="9.5" cy="8" r="3.2" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M16 10.5l1.8 1.8L21.5 8.5" />
    </svg>
  ),
  Students: (
    <svg {...GLYPH} aria-hidden>
      <path d="M22 9.5L12 5 2 9.5l10 4.5 10-4.5z" />
      <path d="M6 11.6V16c0 1.2 2.7 3 6 3s6-1.8 6-3v-4.4" />
    </svg>
  ),
  Invitations: (
    <svg {...GLYPH} aria-hidden>
      <path d="M22 12V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
      <path d="M22 7l-10 6L2 7" />
      <path d="M19 16v6M16 19h6" />
    </svg>
  ),
  "Learning Support": (
    <svg {...GLYPH} aria-hidden>
      <path d="M12 20s-6.5-4.2-9-8A4.7 4.7 0 0 1 12 6.3 4.7 4.7 0 0 1 21 12c-2.5 3.8-9 8-9 8z" />
    </svg>
  ),
  Reports: (
    <svg {...GLYPH} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  ),
  "Admin Team": (
    <svg {...GLYPH} aria-hidden>
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Billing: (
    <svg {...GLYPH} aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </svg>
  ),
  "IT & SSO": (
    <svg {...GLYPH} aria-hidden>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2L19 4" />
      <path d="M16 5l3 3" />
      <path d="M14 7l2.4 2.4" />
    </svg>
  ),
  Settings: (
    <svg {...GLYPH} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-2.87 1.2V19a2 2 0 1 1-4 0v-.06a1.7 1.7 0 0 0-2.87-1.2l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 13a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.14-2.87l-.05-.05A2 2 0 1 1 8.52 3.3l.05.05A1.7 1.7 0 0 0 11 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.87 1.14l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 11z" />
    </svg>
  ),
};

/** 38px square, navy-filled when the row is the current one. */
function IconWrap({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-[38px] shrink-0 items-center justify-center rounded-[10px]",
        on ? "bg-nevo-navy text-nevo-cream" : "text-nevo-near-black/70",
      )}
    >
      {children}
    </span>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { scopes, resolved } = usePermissions();
  const signedIn = useHasSession();
  const [expanded, setExpanded] = useState(true);

  const active = activeNavLabel(pathname);
  // Until scopes land there is nothing truthful to filter by, so the rail
  // shows its chrome and no rows rather than a nav that rearranges itself
  // under the reader a moment later.
  const items = resolved ? navForScopes(scopes) : [];

  return (
    <aside
      aria-label="Admin"
      className={cn(
        "flex h-full shrink-0 flex-col overflow-y-auto border-r border-nevo-near-black/6 bg-nevo-cream-elevated py-[22px] transition-[width] duration-200 ease-in-out",
        expanded ? "w-[248px] px-3.5" : "w-16 px-3",
      )}
    >
      <nav className="flex flex-1 flex-col">
        {items.map((item, i) => {
          const on = item.label === active;
          const startsGroup = i > 0 && item.group !== items[i - 1].group;
          return (
            <div key={item.label} className="contents">
              {startsGroup &&
                (expanded ? (
                  <span className="shrink-0 px-3 pt-3.5 pb-[5px] text-[10.5px] font-semibold tracking-[0.08em] text-nevo-near-black/40 uppercase">
                    {item.group}
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="mx-2 my-2 h-px shrink-0 bg-nevo-near-black/9"
                  />
                ))}
              <Link
                href={item.href}
                aria-current={on ? "page" : undefined}
                title={expanded ? undefined : item.label}
                className={cn(
                  "relative flex h-11 shrink-0 cursor-pointer items-center gap-[13px] rounded-[10px] transition-colors duration-[130ms] ease-out",
                  expanded ? "px-3" : "justify-center",
                  on ? "bg-nevo-navy/8" : "hover:bg-nevo-navy/5",
                )}
              >
                {on && (
                  <span
                    aria-hidden
                    className="absolute top-[9px] bottom-[9px] left-0 w-[3px] rounded-full bg-nevo-violet"
                  />
                )}
                <IconWrap on={on}>{ICONS[item.label]}</IconWrap>
                {expanded && (
                  <span
                    className={cn(
                      "text-[14.5px] tracking-[-0.005em] whitespace-nowrap",
                      on
                        ? "font-semibold text-nevo-near-black"
                        : "font-medium text-nevo-near-black/76",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* TODO(screen): D13 Notifications. */}
      <button
        type="button"
        aria-label="Notifications"
        className={cn(
          "relative mt-2 flex h-11 shrink-0 cursor-pointer items-center gap-[13px] rounded-[10px] transition-colors duration-[130ms] ease-out hover:bg-nevo-navy/5",
          expanded ? "px-3" : "justify-center",
        )}
      >
        <span className="relative flex size-[38px] shrink-0 items-center justify-center rounded-[10px] text-nevo-near-black/70">
          <svg {...GLYPH} strokeWidth={1.9} aria-hidden>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </span>
        {expanded && (
          <span className="text-[14.5px] font-medium text-nevo-near-black/76">
            Notifications
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={expanded}
        className={cn(
          "flex h-11 shrink-0 cursor-pointer items-center gap-[13px] rounded-[10px] transition-colors duration-[130ms] ease-out hover:bg-nevo-navy/5",
          expanded ? "px-3" : "justify-center",
        )}
      >
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] text-nevo-near-black/50">
          <svg {...GLYPH} strokeWidth={2} aria-hidden>
            <path d={expanded ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
          </svg>
        </span>
        {expanded && (
          <span className="text-[14.5px] font-medium text-nevo-near-black/66">
            Collapse
          </span>
        )}
      </button>

      <div
        className={cn(
          "mt-1 flex shrink-0 items-center gap-[13px] border-t border-nevo-near-black/8 pt-3.5",
          expanded ? "px-3" : "justify-center",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nevo-navy text-[13px] font-semibold text-nevo-cream">
          {signedIn ? (
            <svg {...GLYPH} width={17} height={17} strokeWidth={1.9} aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20a8 8 0 0 1 16 0" />
            </svg>
          ) : (
            "AA"
          )}
        </span>
        {expanded && (
          <span className="flex min-w-0 flex-col text-left">
            {!signedIn && (
              <span className="truncate text-sm font-semibold text-nevo-near-black">
                Mrs. Adebayo
              </span>
            )}
            <span
              className={
                signedIn
                  ? "truncate text-sm font-semibold text-nevo-near-black"
                  : "truncate text-xs text-nevo-near-black/55"
              }
            >
              {signedIn ? scopeSummary(scopes) : "Proprietor · General oversight"}
            </span>
          </span>
        )}
      </div>
    </aside>
  );
}
