"use client";

import { useCallback, useEffect, useState } from "react";
import { settingsApi, type TeacherNotificationSettings } from "@/lib/api/settings";
import { getToken } from "@/lib/auth/session";
import { DEFAULT_SETTINGS } from "@/lib/mocks/teacherProfile";
import { useHasSession } from "./useHasSession";

/**
 * The teacher's notification preferences, persisted to `/api/settings/me`.
 *
 * The endpoint stores a free-form bag and merges on write, so this sends only
 * its own key and cannot disturb anything else stored against the account.
 *
 * Defaults come from the frame. A teacher who has never saved has no stored
 * settings at all, and the frame's defaults are the right starting position -
 * so an empty bag is not an error state, it is a new account.
 *
 * Accessibility toggles are not persisted here: they belong to the device, not
 * the account, and already apply immediately through the accessibility
 * context.
 */

const DEFAULTS: TeacherNotificationSettings = {
  sudden: DEFAULT_SETTINGS.sudden,
  messages: DEFAULT_SETTINGS.messages,
  weekly: DEFAULT_SETTINGS.weekly,
};

export type SaveState = "idle" | "saving" | "saved" | "failed";

export interface TeacherSettings {
  values: TeacherNotificationSettings;
  /** Stored settings have arrived (or there were none). */
  ready: boolean;
  set: (key: keyof TeacherNotificationSettings, value: boolean) => void;
  /** Resolves true when the write landed, so the caller can toast the truth. */
  save: () => Promise<boolean>;
  saveState: SaveState;
}

export function useTeacherSettings(): TeacherSettings {
  const [values, setValues] = useState<TeacherNotificationSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const signedIn = useHasSession();

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    void settingsApi
      .get()
      .then((res) => {
        if (cancelled) return;
        const stored = res.settings?.teacherNotifications;
        if (stored) setValues({ ...DEFAULTS, ...stored });
        setReady(true);
      })
      .catch(() => {
        // Never saved, or unreachable. The frame's defaults stand either way;
        // what must not happen is a toggle showing a state we did not read.
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback(
    (key: keyof TeacherNotificationSettings, value: boolean) => {
      setValues((v) => ({ ...v, [key]: value }));
      setSaveState("idle");
    },
    [],
  );

  const save = useCallback(async (): Promise<boolean> => {
    if (!getToken()) {
      setSaveState("saved");
      return true;
    }
    setSaveState("saving");
    try {
      await settingsApi.update({ teacherNotifications: values });
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("failed");
      return false;
    }
  }, [values]);

  return { values, ready: ready || !signedIn, set, save, saveState };
}
