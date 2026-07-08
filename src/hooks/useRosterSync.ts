"use client";

import { useState } from "react";

export type RosterSyncStatus = "idle" | "syncing" | "synced" | "error";

/**
 * Roster sync status for the Admin Layer (FE Architecture §1; D.10). Reports
 * whether the SIS/SSO roster sync is functioning and surfaces plain-language
 * error states.
 */
export function useRosterSync() {
  const [status] = useState<RosterSyncStatus>("idle");
  // TODO: poll the roster-sync status endpoint once it exists.
  return { status };
}
