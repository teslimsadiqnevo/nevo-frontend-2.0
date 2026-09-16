import type { RosterSyncHistory, RosterSyncRun, SsoStatus } from "@/lib/api/sso";
import { PROVIDER_LABELS } from "@/lib/api/sso";
import { timeAgo } from "@/lib/relativeTime";
import { latestRun } from "@/lib/rosterSync";

/**
 * What D10 and D10b are allowed to say about a school's sign-in.
 *
 * Pure and separate from the screen because every line below is a claim about
 * whether a school's staff can sign in and whether its roster is up to date,
 * and this screen has a history of getting exactly those two wrong in a way
 * nobody could see: `history?.failed_runs` was misspelt against the wire, read
 * `undefined`, coalesced to 0, and reported a school whose every sync had
 * failed as "Healthy".
 *
 * A STATUS RECORD IS NOT A LIVE PROVIDER. `SsoConnectionStatus` has three
 * members and this screen branched on two, so `disconnected` - a school that
 * HAD a provider and turned it off - fell through every check into the
 * connected page: a "Healthy" roster sync with a Sync now button, a sign-in
 * URL nobody can use, and an offer to disconnect a provider that is already
 * disconnected. `isLive` is the distinction, drawn once.
 */

/** A provider actually in service. `disconnected` is not, and neither is none. */
export function isLive(status: SsoStatus | null): boolean {
  return status !== null && status.status !== "disconnected";
}

/** A provider that is ours but no longer in service. */
export function isDisconnected(status: SsoStatus | null): boolean {
  return status !== null && status.status === "disconnected";
}

export type SyncWord =
  | "paused"
  | "waiting"
  | "unknown"
  | "failures"
  | "unfinished"
  | "healthy";

export const SYNC_WORD: Record<SyncWord, string> = {
  paused: "Paused until we're reconnected",
  waiting: "Waiting for the first sync",
  unknown: "Connected - sync history unavailable",
  failures: "Syncing, with failures to look at",
  // D10's own wording for the degraded-but-fine state.
  unfinished: "Synced with one thing to finish",
  healthy: "Healthy",
};

export interface SyncReport {
  word: SyncWord;
  label: string;
  sub: string;
  /** Teachers the provider could not place in a class. 0 when unknown. */
  mappingGap: number;
}

function scheduledFor(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The sync headline and the line under it.
 *
 * THE ORDER IS THE POINT, so it is written out rather than left to a chain of
 * ternaries in JSX:
 *
 *  1. A provider whose access has expired is PAUSED, whatever the history says.
 *  2. A school that has never completed a sync is WAITING. That is read from
 *     `lastSuccessfulSyncAt` on the status, not from the history, so it
 *     holds even when the history could not be read - and it replaces the
 *     "Healthy · Last synced never" this screen used to show, which told a
 *     school in its first hour that a sync it had never had was fine.
 *  3. A history we could not read is UNKNOWN, never healthy. Absent evidence
 *     is not evidence of health - the defect this whole file exists to stop.
 *  4. Then failures, then the mapping gap, then healthy.
 */
export function syncReport(
  status: SsoStatus,
  history: RosterSyncHistory | null,
  historyFailed: boolean,
): SyncReport {
  const run: RosterSyncRun | null = latestRun(history);
  const gap = historyFailed ? 0 : (run?.missingTeacherClassMappings ?? 0);

  const windowLine = historyFailed
    ? " · we couldn't read the run history just now, so this does not account for failed runs"
    : history
      ? ` · ${history.successfulRuns} successful run${history.successfulRuns === 1 ? "" : "s"}${history.failedRuns > 0 ? ` and ${history.failedRuns} failed` : ""} in the last ${history.windowDays} days`
      : "";

  const word: SyncWord =
    status.status === "needs_attention"
      ? "paused"
      : status.lastSuccessfulSyncAt === null
        ? "waiting"
        : historyFailed
          ? "unknown"
          : (history?.failedRuns ?? 0) > 0
            ? "failures"
            : gap > 0
              ? "unfinished"
              : "healthy";

  if (word === "waiting") {
    const when = scheduledFor(status.nextScheduledSyncAt);
    return {
      word,
      label: SYNC_WORD[word],
      /*
       * `nextScheduledSyncAt` was fetched and never rendered anywhere.
       * It is the only answer this screen has to "when will it happen", and
       * without it the waiting state is a shrug.
       */
      sub: when
        ? `Your first sync is scheduled for ${when}.${windowLine}`
        : `Nothing has come across from your provider yet. You can start one now.${windowLine}`,
      mappingGap: gap,
    };
  }

  return {
    word,
    label: SYNC_WORD[word],
    sub: `Last synced ${timeAgo(status.lastSuccessfulSyncAt)}${windowLine}`,
    mappingGap: gap,
  };
}

/**
 * The provider card's description.
 *
 * THREE WAYS, and the screen had two. "Not in use." was lifted out of the
 * description into a pill, so it then rendered on every non-active card -
 * including both cards of a school with nothing connected, which is the state
 * the page is trying to talk that school OUT of reading as a fault. D10 puts
 * those three words in the description and gives an unused provider no pill at
 * all.
 */
export function providerDescription(
  provider: "microsoft" | "google",
  isActive: boolean,
  live: boolean,
): string {
  const noun = provider === "microsoft" ? "Microsoft" : "Google";
  if (isActive && live) {
    return `Staff and students sign in with their school ${noun} account.`;
  }
  if (isActive) {
    // This school's own provider, switched off. Saying only "Not in use."
    // would leave an IT lead wondering how anyone signs in at all.
    return `Not in use. Everyone signs in with your school code.`;
  }
  return "Not in use.";
}

/** The data-flow heading, in the right tense for a provider that is gone. */
export function dataFlowHeading(status: SsoStatus): string {
  const p = PROVIDER_LABELS[status.provider];
  return status.status === "disconnected"
    ? `What moved between Nevo and ${p}`
    : `What moves between Nevo and ${p}`;
}

/**
 * D10b's "What we never touch" - a PRODUCT guarantee, not server data.
 *
 * `SsoStatus.dataFlow` carries what we read; nothing in the contract carries
 * what we do not, and nothing ever will - an endpoint cannot enumerate an
 * absence. These four are the frame's, verbatim, and they are the half of the
 * disclosure that makes the other half mean anything: a list of what an
 * integration reads, with no boundary beside it, reassures nobody.
 */
export function neverTouched(
  providerLabel: string,
): { name: string; purpose: string }[] {
  return [
    {
      name: "Consent records",
      purpose: "these stay between the parent and your school",
    },
    { name: "How a student is learning", purpose: "never leaves Nevo" },
    {
      name: "What teachers write about their class",
      purpose: "never leaves Nevo",
    },
    {
      name: "Anything in the other direction",
      purpose: `we never write to your ${providerLabel}`,
    },
  ];
}
