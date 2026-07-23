"use client";

import { type ReactNode } from "react";
import { AccessibilityProvider } from "./AccessibilityContext";
import { AuthProvider } from "./AuthContext";
import { NotificationProvider } from "./NotificationContext";

/**
 * Global client providers, mounted once in the root layout.
 * (PermissionProvider is admin-only and LessonProvider is lesson-scoped, so they
 * are wired into their respective layouts rather than here.)
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </AuthProvider>
    </AccessibilityProvider>
  );
}
