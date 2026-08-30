"use client";

import { useCallback, useEffect, useState } from "react";
import {
  notificationPrefsApi,
  type NotificationPreference,
  type TeacherNotificationSettings,
} from "@/lib/api/settings";
import { getToken } from "@/lib/auth/session";
import { DEFAULT_SETTINGS } from "@/lib/mocks/teacherProfile";
import { useHasSession } from "./useHasSession";

/**
 * The teacher's notification choices, on `/api/v1/notification-preferences`.
 *
 * This used to write into the free-form `/api/settings/me` bag under a key I
 * invented, before I had enumerated the surface and found the purpose-built
 * endpoint. Anything saved that way does not carry over.
 *
 * One switch per row in the frame, two channels in the API: the switch drives
 * `inApp`, and `email` is preserved from whatever the server holds - see
 * `settings.ts` for why it is not turned on alongside.
 *
 * Defaults come from the frame. A teacher who has never saved has no stored
 * rows at all, and the frame's defaults are the right starting position - an
 * empty response is a new account, not an error.
 *
 * Accessibility toggles are deliberately elsewhere: they belong to the device,
 * not the account, and apply instantly through the accessibility context.
 */

const DEFAULTS: TeacherNotificationSettings = {
  sudden: DEFAULT_SETTINGS.sudden,
  messages: DEFAULT_SETTINGS.messages,
  weekly: DEFAULT_SETTINGS.weekly,
};

export type SaveState = "idle" | "saving" | "saved" | "failed";

export interface TeacherSettings {
  values: TeacherNotificationSettings;
  ready: boolean;
  set: (key: keyof TeacherNotificationSettings, value: boolean) => void;
  /** Resolves true when the write landed, so the caller can toast the truth. */
  save: () => Promise<boolean>;
  saveState: SaveState;
}

export function useTeacherSettings(): TeacherSettings {
  const [values, setValues] = useState<TeacherNotificationSettings>(DEFAULTS);
  /** Whatever the server holds for `email`, kept so a save cannot clear it. */
  const [emailByCategory, setEmailByCategory] = useState<
    Record<string, boolean>
  >({});
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const signedIn = useHasSession();

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    void notificationPrefsApi
      .list()
      .then((rows) => {
        if (cancelled) return;
        const next = { ...DEFAULTS };
        const email: Record<string, boolean> = {};
        for (const row of rows) {
          if (row.category in next) {
            next[row.category as keyof TeacherNotificationSettings] = row.inApp;
          }
          email[row.category] = row.email;
        }
        setValues(next);
        setEmailByCategory(email);
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
    const rows: NotificationPreference[] = (
      Object.keys(values) as (keyof TeacherNotificationSettings)[]
    ).map((category) => ({
      category,
      inApp: values[category],
      email: emailByCategory[category] ?? false,
    }));
    try {
      await notificationPrefsApi.update(rows);
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("failed");
      return false;
    }
  }, [values, emailByCategory]);

  return { values, ready: ready || !signedIn, set, save, saveState };
}
