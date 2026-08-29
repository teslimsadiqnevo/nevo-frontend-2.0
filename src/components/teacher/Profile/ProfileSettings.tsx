"use client";

import { useEffect, useRef, useState } from "react";
import { Toggle } from "@/components/teacher/shared/Toggle";
import { useAccessibility } from "@/context/AccessibilityContext";
import {
  ACCESSIBILITY_SETTINGS,
  DEFAULT_SETTINGS,
  NOTIFICATION_SETTINGS,
  TEACHER_PROFILE,
  type TeacherProfile,
} from "@/lib/mocks/teacherProfile";
import { cn } from "@/lib/utils";
import { useHasSession } from "@/hooks/useHasSession";
import { useTeacherIdentity } from "@/hooks/useTeacherIdentity";
import { EditProfileModal } from "./EditProfileModal";
import { SignOutModal } from "./SignOutModal";

/**
 * C11 Profile & account - the teacher's own details, notification choices and
 * accessibility preferences.
 *
 * The save model comes from C14 B6, which C11 itself never draws: a "Save
 * changes" button sits in the header, stays disabled until something is
 * actually dirty, and on save a toast confirms while the page stays exactly
 * where it was. Flagged - C11's header is a bare heading.
 *
 * The Accessibility rows drive the app-wide AccessibilityContext, so they do
 * what their own sub-copy promises - "across Nevo", "across the console" -
 * and persist. They apply on tap and stay out of the dirty/Save cycle:
 * preferences that live on this device take effect now, while the
 * Notifications rows (server-persisted) keep the C14 B6 save model.
 *
 * Two flagged divergences from C11: the frame draws "Reduce motion" ON by
 * default, but the toggle now reflects the real stored preference, which
 * starts OFF and is shared with the student app; and "Larger text" uses the
 * shared text-size scale (1.1) rather than the frame's one-off zoom 1.15.
 */

const SECTION_H3 =
  "mt-7 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase xl:mt-8 xl:text-sm";

const CARD =
  "mt-3.5 overflow-hidden rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

const TOAST_MS = 3000;

export function ProfileSettings() {
  const a11y = useAccessibility();
  const [profile, setProfile] = useState<TeacherProfile>(TEACHER_PROFILE);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // The session carries a user_id and a role. Name, email, school and subjects
  // are all fixture values, and this is the page where a teacher would most
  // reasonably read them as their own account details - a fabricated email
  // worst of all, since it looks like where their notifications go.
  const signedIn = useHasSession();
  // Name and email come back from the class roster when they can - school and
  // subjects still have no source anywhere.
  const identity = useTeacherIdentity();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flip = (id: string) => {
    setSettings((s) => ({ ...s, [id]: !s[id] }));
    setDirty(true);
  };

  // Accessibility rows read and write the global preference directly.
  const valueOf = (id: string): boolean =>
    id === "reduceMotion"
      ? a11y.reducedMotion
      : id === "largerText"
        ? a11y.textSize !== "m"
        : settings[id];

  const toggle = (id: string) => {
    if (id === "reduceMotion") {
      a11y.setReducedMotion(!a11y.reducedMotion);
      return;
    }
    if (id === "largerText") {
      a11y.setTextSize(a11y.textSize === "m" ? "l" : "m");
      return;
    }
    flip(id);
  };

  const save = () => {
    if (!dirty) return;
    // TODO(api): persist profile + settings.
    setDirty(false);
    setToast("Settings saved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), TOAST_MS);
  };

  const rows = (list: typeof NOTIFICATION_SETTINGS) =>
    list.map((r, i) => (
      <div
        key={r.id}
        className={cn(
          "flex items-center justify-between gap-3.5 px-[18px] py-3.5 xl:gap-4 xl:px-5 xl:py-4",
          i < list.length - 1 && "border-b border-nevo-near-black/7",
        )}
      >
        <div className="min-w-0">
          <span className="text-[15px] font-medium text-nevo-near-black">
            {r.label}
          </span>
          <div className="mt-0.5 text-[13px] text-nevo-near-black/58">
            {r.sub}
          </div>
        </div>
        <Toggle
          on={valueOf(r.id)}
          onChange={() => toggle(r.id)}
          label={r.label}
        />
      </div>
    ));

  return (
    <div className="relative mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[680px]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
            Profile &amp; account
          </h2>
          {/* C14 B6: disabled until something is actually dirty. */}
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className={cn(
              "inline-flex h-11 shrink-0 items-center rounded-[10px] px-[22px] text-[14.5px] font-semibold",
              dirty
                ? "cursor-pointer bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-93"
                : "cursor-default bg-nevo-navy/16 text-nevo-navy/50",
            )}
          >
            Save changes
          </button>
        </div>

        {/* Identity */}
        <div className="mt-5 flex items-center gap-4 rounded-xl bg-nevo-cream-elevated px-[22px] py-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] xl:mt-6 xl:gap-[18px] xl:px-[26px] xl:py-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-nevo-navy text-xl font-semibold text-nevo-cream xl:size-16 xl:text-[22px]">
            {signedIn && identity?.initials ? (
              identity.initials
            ) : signedIn ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </svg>
            ) : (
              profile.initials
            )}
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[17px] font-semibold text-nevo-near-black xl:text-[19px]">
              {signedIn ? (identity?.name ?? "Teacher") : profile.name}
            </span>
            {signedIn ? (
              <>
                {identity?.email && (
                  <div className="mt-[3px] truncate text-[13.5px] text-nevo-near-black/50">
                    {identity.email}
                  </div>
                )}
                <div className="mt-[3px] max-w-[420px] text-sm leading-[1.5] text-nevo-near-black/60">
                  {identity?.name
                    ? "Your school holds these details. Subjects and school name aren’t connected here yet."
                    : "Your details aren’t connected yet – your name and contact details come from your school."}
                </div>
              </>
            ) : (
              <>
                <div className="mt-[3px] text-sm text-nevo-near-black/60">
                  <span className="xl:hidden">{profile.subjects}</span>
                  <span className="hidden xl:inline">
                    {`${profile.subjects} · ${profile.school}`}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[13.5px] text-nevo-near-black/50">
                  {profile.email}
                </div>
              </>
            )}
          </div>
          {/* Nothing to edit while there is nothing to show, and no endpoint
              to persist it to either. */}
          {!signedIn && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/35 px-4 text-sm font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
            >
              Edit
            </button>
          )}
        </div>

        <h3 className={SECTION_H3}>Notifications</h3>
        <div className={CARD}>{rows(NOTIFICATION_SETTINGS)}</div>

        <h3 className={SECTION_H3}>Accessibility</h3>
        <div className={CARD}>{rows(ACCESSIBILITY_SETTINGS)}</div>

        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="mt-7 inline-flex cursor-pointer items-center gap-2.5 text-[15px] font-medium text-nevo-navy transition-colors hover:text-nevo-navy/80 xl:mt-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Sign out
        </button>
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onCancel={() => setEditOpen(false)}
          onSave={(next) => {
            setProfile(next);
            setEditOpen(false);
            setDirty(true);
          }}
        />
      )}

      {signOutOpen && <SignOutModal onStay={() => setSignOutOpen(false)} />}

      {/* C14 NevoToast */}
      {toast && (
        <div
          role="status"
          className="fixed top-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-nevo-navy py-3 pr-[22px] pl-[15px] shadow-[0_12px_32px_rgba(0,0,0,0.22)] motion-safe:animate-nevo-pop xl:top-6"
        >
          <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-nevo-cream/20 text-nevo-cream">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <span className="text-[14.5px] font-semibold whitespace-nowrap text-nevo-cream">
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
