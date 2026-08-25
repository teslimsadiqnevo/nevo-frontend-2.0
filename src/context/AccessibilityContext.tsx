"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TextSize = "s" | "m" | "l" | "xl";

export interface AccessibilityPrefs {
  reducedMotion: boolean;
  highContrast: boolean;
  textSize: TextSize;
  /** Learning-support preference (B.11): the 20-minute break prompt. */
  suggestBreaks: boolean;
}

export interface AccessibilityValue extends AccessibilityPrefs {
  setReducedMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setTextSize: (v: TextSize) => void;
  setSuggestBreaks: (v: boolean) => void;
}

const DEFAULTS: AccessibilityPrefs = {
  reducedMotion: false,
  highContrast: false,
  textSize: "m",
  suggestBreaks: true,
};

const STORAGE_KEY = "nevo:a11y";

/**
 * Text-size → content zoom factor (works with the app's fixed-px type). Applied
 * as a numeric `zoom` on content regions — `zoom: var(...)` isn't supported, so
 * consumers read this map directly rather than a CSS variable.
 */
export const TEXT_ZOOM: Record<TextSize, number> = {
  s: 0.9,
  m: 1,
  l: 1.1,
  xl: 1.2,
};

const AccessibilityContext = createContext<AccessibilityValue | undefined>(
  undefined,
);

/**
 * Global accessibility preferences (Product Arch B.11). Holds the student's
 * Reduced Motion / High Contrast / Text Size choices, persists them, and applies
 * them to the document root so they take effect app-wide:
 *   - `data-reduced-motion` → globals.css disables animation/transition
 *   - `data-contrast="high"` → globals.css strengthens muted text + borders
 *   - `textSize` → content regions apply `TEXT_ZOOM` as a numeric `zoom`
 *
 * Defaults match the server render, so hydration stays in agreement; the stored
 * prefs are read and applied on mount.
 */
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULTS);

  // Load persisted prefs after mount (client-only → no SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPrefs((p) => ({ ...p, ...parsed }));
      }
    } catch {
      // ignore malformed / unavailable storage
    }
  }, []);

  // Apply to the document root + persist on any change.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.reducedMotion = String(prefs.reducedMotion);
    root.dataset.contrast = prefs.highContrast ? "high" : "normal";
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  const setReducedMotion = useCallback(
    (v: boolean) => setPrefs((p) => ({ ...p, reducedMotion: v })),
    [],
  );
  const setHighContrast = useCallback(
    (v: boolean) => setPrefs((p) => ({ ...p, highContrast: v })),
    [],
  );
  const setTextSize = useCallback(
    (v: TextSize) => setPrefs((p) => ({ ...p, textSize: v })),
    [],
  );
  const setSuggestBreaks = useCallback(
    (v: boolean) => setPrefs((p) => ({ ...p, suggestBreaks: v })),
    [],
  );

  const value = useMemo<AccessibilityValue>(
    () => ({
      ...prefs,
      setReducedMotion,
      setHighContrast,
      setTextSize,
      setSuggestBreaks,
    }),
    [prefs, setReducedMotion, setHighContrast, setTextSize, setSuggestBreaks],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/** Access + update the global accessibility preferences. */
export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (ctx === undefined) {
    throw new Error(
      "useAccessibility must be used within <AccessibilityProvider>",
    );
  }
  return ctx;
}
