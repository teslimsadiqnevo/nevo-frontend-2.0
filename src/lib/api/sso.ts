import { api } from "./client";

/**
 * School identity-provider endpoints (`/api/v1/admin/sso/*`), typed against the
 * deployed backend.
 *
 * `status` 404s with `sso_not_configured` for a school that has never
 * connected one - that is the ordinary "nothing connected yet" state, not an
 * error, and the screen treats it as such.
 *
 * TODO(api): CONNECT still has no way in, and the slug is NOT the reason -
 * that was the previous note here and it is wrong. `GET /api/v1/school`
 * carries `slug` for any school actor with no SSO dependency, so the
 * chicken-and-egg is closed (backend confirmed 3 Sep, and `SsoView` has read
 * it that way since).
 *
 * What is missing is enrolment. All ten `sso` operations presuppose a
 * connection that already exists, and nothing anywhere accepts a tenant id,
 * client id, secret or provider choice. The two `start` endpoints are
 * unauthenticated pre-login sign-in handovers - they send a USER to the
 * provider, they do not enrol a SCHOOL - so pointing the Connect button at
 * one would be wrong twice over. See the reasoning in
 * `components/admin/Sso/SsoView.tsx`, which is the authority on this.
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

/**
 * THE CASING HERE IS THE API'S, NOT A CONVENTION.
 *
 * This resource is mixed and the mix is real: `SsoConnectionHealthResponse` is
 * snake_case (`school_entry_url`, `last_successful_sync_at`) and
 * `RosterSyncRunResponse` is camelCase. Both are copied from the deployed
 * document rather than normalised, because a type that disagrees with the wire
 * is a cast that lies - see the note on `RosterSyncHistory`.
 */
export interface RosterSyncRun {
  id: string;
  provider: SsoProvider;
  status: RosterSyncStatus;
  importedStudents: number;
  importedTeachers: number;
  missingTeacherClassMappings: number;
  failureReason: string | null;
  triggeredManually: boolean;
  startedAt: string;
  completedAt: string | null;
  issues: unknown[];
}

/**
 * ============================================================================
 * THIS WAS snake_case AND THE ENDPOINT ANSWERS camelCase.
 *
 * `RosterSyncHistoryResponse` is `{windowDays, successfulRuns, failedRuns,
 * runs}`, all required. The client declared `window_days`, `successful_runs`
 * and `failed_runs`, so every one of them read `undefined` at runtime - and
 * `SsoView` asks `(history?.failed_runs ?? 0) > 0`, which coalesced to 0 and
 * fell straight into the HEALTHY branch.
 *
 * So the defect PR #269 was written to fix - a school being told its roster
 * sync was "Healthy" while runs were failing - was still live afterwards, by a
 * different route. #269 fixed the FAILED-READ path; the field names were wrong
 * on the successful path all along.
 *
 * The tests passed because the fixtures were hand-written in snake_case,
 * copied from this interface rather than from the spec. That is the whole
 * argument for check 3 in `scripts/contract-check.mjs`, which found this.
 * ============================================================================
 */
export interface RosterSyncHistory {
  windowDays: number;
  successfulRuns: number;
  failedRuns: number;
  runs: RosterSyncRun[];
}

/**
 * WHAT STARTING A SYNC ACTUALLY RETURNS, which is not what it used to.
 *
 * `POST /admin/sso/roster-sync` answers **202 Accepted** with
 * `{runId, status, pollUrl}` - it QUEUES a run. The client typed it as a
 * finished result carrying `imported_students`, `imported_teachers` and
 * `missing_teacher_class_mappings`, and `SsoView` built its confirmation out
 * of them, so pressing "Sync now" rendered "Synced. undefined students and
 * undefined staff imported."
 *
 * The counts live on the RUN, fetched from `pollUrl` / `runDetail(runId)`,
 * which is why `GET /admin/sso/roster-sync/{run_id}` sat unconsumed.
 *
 * TODO (client, not api): poll the run and report the real counts. This was
 * tagged `TODO(api)`, which asks backend for a route the two lines above say
 * already exists - `GET /admin/sso/roster-sync/{run_id}`, typed here as
 * `runDetail`. Nothing is missing from the contract; the polling loop is ours
 * to write. Until it is, the screen says a sync has started and stops claiming
 * numbers it does not have.
 */
export interface RosterSyncAccepted {
  runId: string;
  status: RosterSyncStatus;
  pollUrl: string;
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

  /** POST /api/v1/admin/sso/roster-sync - queues a run, 202 Accepted. */
  rosterSync: () =>
    api.post<RosterSyncAccepted>("/api/v1/admin/sso/roster-sync"),

  /** GET /api/v1/admin/sso/roster-sync/{run_id} - where the counts live. */
  runDetail: (runId: string) =>
    api.get<RosterSyncRun>(`/api/v1/admin/sso/roster-sync/${runId}`),

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
