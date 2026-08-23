"use client";

import { useEffect, useState } from "react";
import type { TeacherProfile } from "@/lib/mocks/teacherProfile";

/**
 * C11 Edit profile. Name and subjects are the teacher's to change; the email
 * is school-managed and shown read-only rather than as a disabled input, so
 * it reads as "not yours to edit" instead of "broken".
 */
export function EditProfileModal({
  profile,
  onCancel,
  onSave,
}: {
  profile: TeacherProfile;
  onCancel: () => void;
  onSave: (next: TeacherProfile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [subjects, setSubjects] = useState(profile.subjects);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const field =
    "mt-1.5 h-12 w-full rounded-[10px] border border-nevo-near-black/14 bg-nevo-cream-elevated px-3.5 text-[15px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy";
  const label =
    "text-xs font-semibold tracking-[0.03em] text-nevo-near-black/55 uppercase";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-nevo-near-black/50 p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] rounded-2xl bg-nevo-cream px-[30px] py-7 shadow-[0_24px_60px_rgba(0,0,0,0.3)] motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-nevo-near-black">
            Edit profile
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex cursor-pointer text-nevo-near-black/40 transition-colors hover:text-nevo-near-black/70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-[22px] flex items-center gap-4">
          <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-nevo-navy text-xl font-semibold text-nevo-cream">
            {profile.initials}
          </span>
          {/* TODO(api): photo upload - the frame draws the affordance only. */}
          <button
            type="button"
            className="inline-flex h-[38px] cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/35 px-[15px] text-[13.5px] font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
          >
            Change photo
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <label className="block">
            <span className={label}>Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Subjects</span>
            <input
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              className={field}
            />
          </label>
          <div>
            <span className={label}>Email</span>
            <div className="mt-1.5 flex h-12 items-center justify-between gap-3 rounded-[10px] border border-nevo-near-black/10 bg-nevo-near-black/5 px-3.5 text-[15px] text-nevo-near-black/55">
              <span className="min-w-0 truncate">{profile.email}</span>
              <span className="shrink-0 text-xs whitespace-nowrap text-nevo-near-black/40">
                Managed by your school
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() =>
              onSave({ ...profile, name: name.trim(), subjects: subjects.trim() })
            }
            className="h-12 flex-1 cursor-pointer rounded-[10px] bg-nevo-navy text-[15px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-12 shrink-0 cursor-pointer rounded-[10px] px-[22px] text-sm font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
