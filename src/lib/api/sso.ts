import { api } from "./client";

/**
 * School identity-provider endpoints (`/api/v1/admin/sso/*`), typed against the
 * deployed backend.
 *
 * `status` 404s with `sso_not_configured` for a school that has never
 * connected one - that is the ordinary "nothing connected yet" state, not an
 * error, and the screen treats it as such.
 *
 * TODO(api): CONNECT still has no way in, but not for the reason once
 * recorded here - there are two start endpoints, `POST /api/v1/auth/sso/start`
 * and `GET /api/v1/schools/{school_slug}/sso/{provider}/start`. Both require
 * a `schoolSlug`, and the only thing that returns one is `status`, which 404s
 * precisely while a school is not yet connected. So the chicken-and-egg is
 * the slug, not a missing endpoint. Raised with backend.
 */

export type SsoProvider = "microsoft" | "google";
export type SsoConnectionStatus = "connected" | "needs_attention" | "disconnected";
export type RosterSyncStatus = "completed" | "partial_manual_review" | "failed";

/** One row of the D10b data-flow disclosure, server-supplied. */
export interface SsoDataFlowCategory {
  key: string;
  description: string;
  purpose: string;
}

export interface SsoStatus {
  provider: SsoProvider;
  status: SsoConnectionStatus;
  school_url_slug: string;
  school_entry_url: string;
  last_connection_error: string | null;
  connection_checked_at: string | null;
  reauthorised_at: string | null;
  last_successful_sync_at: string | null;
  next_scheduled_sync_at: string | null;
  disconnected_at: string | null;
  data_flow: SsoDataFlowCategory[];
}

export interface RosterSyncRun {
  id: string;
  provider: SsoProvider;
  status: RosterSyncStatus;
  imported_students: number;
  imported_teachers: number;
  missing_teacher_class_mappings: number;
  failure_reason: string | null;
  triggered_manually: boolean;
  started_at: string;
  completed_at: string | null;
  issues: unknown[];
}

export interface RosterSyncHistory {
  window_days: number;
  successful_runs: number;
  failed_runs: number;
  runs: RosterSyncRun[];
}

export interface RosterSyncResult {
  status: RosterSyncStatus;
  imported_students: number;
  imported_teachers: number;
  missing_teacher_class_mappings: number;
  issue_ids: string[];
}

export interface SsoDisconnected {
  provider: SsoProvider;
  disconnected_at: string;
  retained_user_count: number;
}

export interface SsoReauthorisation {
  provider: SsoProvider;
  authorization_url: string;
  school_entry_url: string;
}

export const ssoApi = {
  /** GET /api/v1/admin/sso/status - 404 means "never connected". */
  status: () => api.get<SsoStatus>("/api/v1/admin/sso/status"),

  /** GET /api/v1/admin/sso/roster-sync-history */
  syncHistory: (windowDays?: number) =>
    api.get<RosterSyncHistory>("/api/v1/admin/sso/roster-sync-history", {
      params: windowDays ? { window_days: windowDays } : undefined,
    }),

  /** POST /api/v1/admin/sso/roster-sync - the "Sync now" button. */
  rosterSync: () =>
    api.post<RosterSyncResult>("/api/v1/admin/sso/roster-sync"),

  /** POST /api/v1/admin/sso/reauthorise - returns the provider's consent URL. */
  reauthorise: () =>
    api.post<SsoReauthorisation>("/api/v1/admin/sso/reauthorise"),

  /** POST /api/v1/admin/sso/disconnect - freezes the roster, deletes nothing. */
  disconnect: () =>
    api.post<SsoDisconnected>("/api/v1/admin/sso/disconnect", { confirm: true }),
};

export const PROVIDER_LABELS: Record<SsoProvider, string> = {
  microsoft: "Microsoft 365",
  google: "Google Workspace",
};
