"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  PROVIDER_LABELS,
  ssoApi,
  type RosterSyncHistory,
  type SsoProvider,
  type SsoStatus,
} from "@/lib/api/sso";
import { schoolApi, type School } from "@/lib/api/school";
import { cn } from "@/lib/utils";
import { hasTechnicalDetail, latestRun, runIssues } from "@/lib/rosterSync";
import { NoAccess, failureKind } from "../NoAccess";
import { WriteFailed } from "../WriteFailed";

/**
 * D10 IT & SSO Setup, with D10b's ongoing-management sections stacked into the
 * same shell: data-flow disclosure, reauthorisation, and the way out.
 *
 * Plain language on the surface, detail one click away. Sync health never uses
 * harsh colour - healthy reads calm navy, an issue reads soft violet, and there
 * is no red anywhere on this screen by design.
 *
 * Where D10's app-shell variant and D10b disagree, D10b governs: disconnecting
 * goes through a confirmation that states all four consequences and shows the
 * school code up front, never a one-click toggle. Disconnecting deletes
 * nothing - it freezes the roster and moves sign-in to the school code, and the
 * confirmation exists to say exactly that.
 *
 * CONNECT EXPLAINS, IT DOES NOT ACT - and that is the spec, not a shortfall.
 * SCRUM-97 is explicit: "The button stays present and pressable on a card the
 * school did not choose, and pressing it explains rather than acts... Never a
 * disabled button, never a silent no-op, never a dead end", with the done
 * criterion "No affordance implies the school can switch auth method here."
 * Auth method is chosen once at onboarding and is irreversible in v1.
 *
 * The API agrees. Nothing creates or configures an SSO connection: every one
 * of the ten `sso` operations presupposes a connection that already exists,
 * and nothing anywhere accepts a tenant id, client id, secret or provider
 * choice. The two SSO `start` endpoints are UNAUTHENTICATED pre-login
 * sign-in handovers - they send a user to the provider, they do not enrol a
 * school - so wiring one to this button would be wrong twice over.
 *
 * The school code, by contrast, WAS a real gap and is now closed. It used to
 * be reachable only from the status response, which 404s exactly when nothing
 * is connected; `GET /api/v1/school` carries `code` and `slug` for any school
 * actor with no SSO dependency.
 *
 * THE SYNC LOG IS OURS TO BUILD, AND THIS SAID IT WAS BACKEND'S. It read
 * "TODO(api): a raw sync log... the run response carries structured counts and
 * a failure reason, and no log text." It carries a third thing:
 * `RosterSyncRunResponse.issues[]`, required, each `{id, externalReference,
 * description, resolutionHint}` - the per-row detail an admin opening
 * "technical details" is actually looking for, and the runs already arrive on
 * `syncHistory()`.
 *
 * BUILT NOW, as a structured list rather than D10's <pre>. There is no raw log
 * text in the API and there is not going to be; the per-row issues are what an
 * admin opening "technical details" is actually after.
 *
 * THE ISSUE TEXT CAN NAME A CHILD and nothing in the contract stops it.
 * `description` and `externalReference` are bare strings with no format - for a
 * Microsoft or Google roster the matching key is very often an email, which
 * names a learner directly. That is NOT a Zero-Tag breach: Zero-Tag prohibits
 * diagnostic labels and engine parameters, and "this record could not be
 * matched" is an administrative fact about a RECORD. D10b already draws this
 * exact reader an account-matching panel with real names, year groups and
 * school emails.
 *
 * The real exposure is SCOPE, and it is worth stating plainly: `it_sso` and
 * `roster` are separate permission scopes and `it_sso` is off by default, so a
 * contractor holding it_sso alone cannot open Students but can read whatever
 * the provider wrote about individual children here. The server owns that
 * boundary - this screen renders what the endpoint hands an authorised caller -
 * but if that is wrong it is wrong here first.
 *
 * The strings are rendered VERBATIM and never parsed. A client that split an
 * email to redact it would be inventing structure the contract never promised.
 */

const CARD = "rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

/** D10b, verbatim. Shown before anyone can disconnect. */
const DISCONNECT_CONSEQUENCES = [
  "Everyone signs in with your school code from then on.",
  "Every account, class and piece of work stays exactly as it is.",
  "Roster updates stop, so your roster stays as it is until you change it here.",
  "Nothing is deleted, and you can connect a provider again later.",
];

type Phase = "loading" | "ready" | "failed" | "denied";
type Busy = "" | "syncing" | "reauthorising" | "disconnecting";

function StatusPill({ status }: { status: "connected" | "attention" | "off" }) {
  const label =
    status === "connected"
      ? "Connected"
      : status === "attention"
        ? "Needs reauthorising"
        : "Not in use.";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-[11px] py-1 text-[12px] font-semibold",
        status === "connected"
          ? "bg-nevo-navy/14 text-nevo-navy"
          : status === "attention"
            ? "bg-nevo-violet/24 text-nevo-navy"
            : "text-nevo-near-black/50",
      )}
    >
      {label}
    </span>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "never";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function SsoView() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [status, setStatus] = useState<SsoStatus | null>(null);
  const [history, setHistory] = useState<RosterSyncHistory | null>(null);
  // Distinct from `history === null`, which is also the not-yet-loaded state.
  const [historyFailed, setHistoryFailed] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [busy, setBusy] = useState<Busy>("");
  const [confirming, setConfirming] = useState(false);
  /** Shown INSIDE the dialog - the page behind it is not visible. */
  const [disconnectFailed, setDisconnectFailed] = useState(false);
  const [notice, setNotice] = useState("");
  /** Which provider's Connect has been pressed. Explains, never acts. */
  const [asked, setAsked] = useState<SsoProvider | null>(null);
  const [school, setSchool] = useState<School | null>(null);

  /*
   * The school record is fetched ALONGSIDE the SSO status, not inside it.
   * `sso/status` 404s for a school that never connected a provider, and the
   * school code is wanted in exactly that state - chaining it behind the
   * status would guarantee it was missing whenever it mattered. This call
   * carries no SSO dependency and answers for any school actor.
   */
  useEffect(() => {
    schoolApi
      .get()
      .then(setSchool)
      .catch(() => setSchool(null));
  }, []);

  const load = useCallback(() => {
    ssoApi
      .status()
      .then((s) => {
        setStatus(s);
        setPhase("ready");
        // `history?.failedRuns ?? 0` coalesces a FAILED read into the
        // healthy branch below, so a school whose sync history did not answer
        // was told its sync was fine. Track the failure separately.
        setHistoryFailed(false);
        return ssoApi
          .syncHistory()
          .then((h) => {
            setHistory(h);
            setHistoryFailed(false);
          })
          .catch(() => setHistoryFailed(true));
      })
      .catch((err: unknown) => {
        // A school that never connected one gets a 404. That is the ordinary
        // "nothing connected yet" state, not a failure.
        if (err instanceof ApiError && err.status === 404) {
          setStatus(null);
          setPhase("ready");
          return;
        }
        // A refused scope is not a broken read - the IT & SSO screen is
        // `it_sso`, so an admin without it lands here by deep link routinely.
        setPhase(failureKind(err));
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setPhase("loading");
    load();
  };

  const syncNow = () => {
    if (busy) return;
    setBusy("syncing");
    setNotice("");
    ssoApi
      .rosterSync()
      .then((r) => {
        /*
         * A 202. IT HAS QUEUED A RUN, NOT FINISHED ONE.
         *
         * `POST /admin/sso/roster-sync` answers `{runId, status, pollUrl}` and
         * carries no counts, because none exist yet. This branch used to read
         * `imported_students`, `imported_teachers` and
         * `missing_teacher_class_mappings` off it and render
         * "Synced. undefined students and undefined staff imported." - every
         * one of those was `undefined`, and the type said otherwise because
         * `api.post<T>` is a cast the compiler never checks.
         *
         * So the console no longer claims a result it has not been given. The
         * counts live on the run, and `ssoApi.runDetail(r.runId)` is where
         * they come from once this polls - see the TODO(api) on the type.
         */
        setNotice(
          r.status === "failed"
            ? "That sync didn’t start. Try again, and if it keeps failing your provider connection may need reauthorising."
            : "Sync started. It runs in the background and can take a few minutes — the run history below shows the result once it finishes.",
        );
        load();
      })
      .catch(() =>
        setNotice("We couldn't run the sync just now. Try again in a moment."),
      )
      .finally(() => setBusy(""));
  };

  const reauthorise = () => {
    if (busy) return;
    setBusy("reauthorising");
    setNotice("");
    ssoApi
      .reauthorise()
      .then((r) => {
        // The provider owns the consent screen; hand the browser over.
        window.location.assign(r.authorization_url);
      })
      .catch(() => {
        setNotice(
          "We couldn't start reauthorising just now. Try again in a moment.",
        );
        setBusy("");
      });
  };

  const disconnect = () => {
    if (busy) return;
    setBusy("disconnecting");
    setDisconnectFailed(false);
    ssoApi
      .disconnect()
      .then((r) => {
        setConfirming(false);
        setNotice(
          `Disconnected. ${r.retained_user_count} accounts kept exactly as they are.`,
        );
        setStatus(null);
        load();
      })
      /*
       * The notice renders on the page BEHIND the confirmation dialog, which
       * is still covering the screen - so the only explanation an IT lead got
       * was invisible, and the button they could still see stayed pressable.
       * They press again, and each press fires another disconnect.
       */
      .catch(() => setDisconnectFailed(true))
      .finally(() => setBusy(""));
  };

  const connected = status?.status === "connected";
  const needsAttention = status?.status === "needs_attention";
  const activeProvider: SsoProvider | null = status?.provider ?? null;

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[820px]">
        <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
          IT &amp; SSO Setup
        </h2>

        {phase === "loading" && (
          <div className={cn(CARD, "mt-6 h-[220px] animate-pulse")} />
        )}

        {phase === "denied" && <NoAccess what="IT and SSO" />}
        {phase === "failed" && (
          <div className={cn(CARD, "mt-6 px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load your sign-in settings
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing has changed for anyone signing in. Try again in a moment.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-5 h-[46px] cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
            >
              Try again
            </button>
          </div>
        )}

        {phase === "ready" && (
          <>
            {!status && (
              <p className="mt-1.5 max-w-[62ch] text-[15.5px] leading-[1.55] text-nevo-near-black/60">
                Connect your school&rsquo;s identity provider so everyone signs
                in with the account they already have. You can also skip this
                and use a school code instead.
              </p>
            )}

            {notice && (
              <p className="mt-4 rounded-[10px] bg-nevo-violet/16 px-4 py-3 text-[13.5px] leading-[1.5] text-nevo-near-black/78">
                {notice}
              </p>
            )}

            <h3 className="mt-7 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
              Sign-in provider
            </h3>
            <div className={cn(CARD, "mt-3 overflow-hidden")}>
              {(["microsoft", "google"] as SsoProvider[]).map((p, i) => {
                const isActive = activeProvider === p;
                return (
                  <div
                    key={p}
                    className={cn(
                      "px-[22px] py-[18px]",
                      i === 0 && "border-b border-nevo-near-black/7",
                    )}
                  >
                    <div className="flex items-center gap-4">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[15px] font-semibold text-nevo-near-black">
                        {PROVIDER_LABELS[p]}
                      </span>
                      <span className="mt-0.5 text-[13px] text-nevo-near-black/58">
                        {isActive
                          ? `Staff and students sign in with their school ${p === "microsoft" ? "Microsoft" : "Google"} account.`
                          : `Sign in with school ${p === "microsoft" ? "Microsoft" : "Google"} accounts.`}
                      </span>
                    </span>
                    <StatusPill
                      status={
                        isActive && connected
                          ? "connected"
                          : isActive && needsAttention
                            ? "attention"
                            : "off"
                      }
                    />
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => setAsked(asked === p ? null : p)}
                        aria-expanded={asked === p}
                        className="shrink-0 cursor-pointer rounded-[10px] border-[1.5px] border-nevo-navy/50 px-[18px] py-[9px] text-sm font-semibold text-nevo-navy transition-colors hover:bg-nevo-navy/6"
                      >
                        Connect
                      </button>
                    )}
                    </div>
                    {asked === p && (
                      <div className="mt-3 rounded-[10px] bg-nevo-violet/14 px-[15px] py-[13px]">
                        <p className="m-0 max-w-[62ch] text-[13.5px] leading-[1.5] text-nevo-near-black/76">
                          {`Your school is set up with a school code. Switching to ${PROVIDER_LABELS[p]} needs our help; it isn’t something you can do here.`}
                        </p>
                        <a
                          href="mailto:support@nevolearning.com"
                          className="mt-2 inline-block text-[13.5px] font-semibold text-nevo-navy hover:underline"
                        >
                          Contact us
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/*
              * D10:133's violet panel, which needs the school CODE - and the
              * code used to be reachable only from `sso/status`, which 404s
              * precisely while nothing is connected. `GET /api/v1/school`
              * carries it and does not depend on SSO at all, so the one state
              * that most wants to show the code finally can.
              *
              * Only when we actually have it. `code` is nullable in the
              * contract (an SSO school has none), and a panel offering a
              * school code without naming one is worse than no panel.
              */}
            {!connected && !needsAttention && school?.code && (
              <div className="mt-3 rounded-[10px] bg-nevo-violet/14 px-[15px] py-[13px]">
                <p className="m-0 max-w-[62ch] text-[13.5px] leading-[1.5] text-nevo-near-black/76">
                  Prefer to manage sign-in yourself? Your school code{" "}
                  <span className="font-semibold text-nevo-near-black">
                    {school.code}
                  </span>{" "}
                  works right now &ndash; no setup needed.
                </p>
              </div>
            )}

            {needsAttention && (
              <div className={cn(CARD, "mt-4 px-[26px] py-6")}>
                <p className="max-w-[60ch] text-sm leading-[1.6] text-nevo-near-black/70">
                  Our access to {PROVIDER_LABELS[status.provider]} has expired.
                  Everyone can still sign in; new accounts and roster updates
                  are paused until it&rsquo;s reconnected.
                </p>
                <button
                  type="button"
                  onClick={reauthorise}
                  disabled={busy !== ""}
                  className="mt-5 h-[46px] cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93 disabled:cursor-wait disabled:opacity-70"
                >
                  {busy === "reauthorising"
                    ? "Reconnecting…"
                    : `Reauthorise ${PROVIDER_LABELS[status.provider]}`}
                </button>
              </div>
            )}

            {status && (
              <>
                <h3 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
                  School sign-in URL
                </h3>
                <div className={cn(CARD, "mt-3 flex items-center gap-4 px-[22px] py-4")}>
                  <span className="min-w-0 flex-1 truncate font-mono text-[14px] text-nevo-near-black">
                    {status.school_entry_url}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(status.school_entry_url)
                        .then(() => setNotice("Copied"))
                        .catch(() => {});
                    }}
                    className="shrink-0 cursor-pointer rounded-[10px] border-[1.5px] border-nevo-navy/30 px-4 py-2 text-[13px] font-semibold text-nevo-navy transition-colors hover:bg-nevo-navy/6"
                  >
                    Copy
                  </button>
                </div>

                <h3 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
                  Roster sync
                </h3>
                <div className={cn(CARD, "mt-3 px-[26px] py-6")}>
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <span className="text-[16px] font-semibold text-nevo-near-black">
                        {/* "Healthy" was asserted from the connection state
                            alone, while `failedRuns` was fetched and thrown
                            away - so a school whose last five syncs failed
                            read as healthy so long as the connection held. */}
                        {needsAttention
                          ? "Paused until we're reconnected"
                          : historyFailed
                            ? "Connected - sync history unavailable"
                            : (history?.failedRuns ?? 0) > 0
                              ? "Syncing, with failures to look at"
                              : "Healthy"}
                      </span>
                      <p className="mt-1 text-sm text-nevo-near-black/62">
                        {`Last synced ${timeAgo(status.last_successful_sync_at)}`}
                        {historyFailed
                          ? " · we couldn't read the run history just now, so this does not account for failed runs"
                          : history
                            ? ` · ${history.successfulRuns} successful run${history.successfulRuns === 1 ? "" : "s"}${history.failedRuns > 0 ? ` and ${history.failedRuns} failed` : ""} in the last ${history.windowDays} days`
                            : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={syncNow}
                      disabled={busy !== ""}
                      className="h-[46px] shrink-0 cursor-pointer rounded-[10px] border-[1.5px] border-nevo-navy/30 px-5 text-sm font-semibold text-nevo-navy transition-colors hover:bg-nevo-navy/6 disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy === "syncing" ? "Syncing…" : "Sync now"}
                    </button>
                  </div>

                  {(() => {
                    const run = latestRun(history);
                    if (!hasTechnicalDetail(run) || !run) return null;
                    const issues = runIssues(run);
                    return (
                      <div className="mt-5 border-t border-nevo-near-black/8 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowDetail((v) => !v)}
                          aria-expanded={showDetail}
                          className="cursor-pointer text-[13.5px] font-semibold text-nevo-navy hover:underline"
                        >
                          {showDetail
                            ? "Hide technical details \u2039"
                            : "View technical details \u203a"}
                        </button>
                        {showDetail && (
                          <div className="mt-3">
                            <p className="text-[13px] text-nevo-near-black/62">
                              {`The most recent run, started ${timeAgo(run.startedAt)}.`}
                            </p>
                            {run.failureReason && (
                              <div className="mt-3">
                                <span className="text-[12px] font-semibold tracking-[0.05em] text-nevo-near-black/50 uppercase">
                                  Reason given
                                </span>
                                <p className="mt-1 text-[13.5px] leading-[1.55] text-nevo-near-black/75">
                                  {run.failureReason}
                                </p>
                              </div>
                            )}
                            {issues.length > 0 && (
                              <div className="mt-4">
                                <span className="text-[12px] font-semibold tracking-[0.05em] text-nevo-near-black/50 uppercase">
                                  {`Records with an issue (${issues.length})`}
                                </span>
                                <div className="mt-2 flex flex-col gap-3">
                                  {issues.map((iss) => (
                                    <div
                                      key={iss.id}
                                      className="rounded-[10px] bg-nevo-navy/[0.04] px-[14px] py-3"
                                    >
                                      <span className="block font-mono text-[12.5px] break-all text-nevo-near-black/70">
                                        {iss.externalReference}
                                      </span>
                                      <span className="mt-1 block text-[13.5px] leading-[1.5] text-nevo-near-black/78">
                                        {iss.description}
                                      </span>
                                      {iss.resolutionHint && (
                                        <span className="mt-1.5 block text-[13px] leading-[1.5] text-nevo-near-black/58">
                                          {iss.resolutionHint}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className="mt-4 text-[12.5px] text-nevo-near-black/50">
                              This is everything the sync reports back to this
                              console.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {status.data_flow.length > 0 && (
                  <>
                    <h3 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
                      {`What moves between Nevo and ${PROVIDER_LABELS[status.provider]}`}
                    </h3>
                    <div className={cn(CARD, "mt-3 overflow-hidden")}>
                      {status.data_flow.map((f, i) => (
                        <div
                          key={f.key}
                          className={cn(
                            "flex flex-col px-[22px] py-[14px]",
                            i < status.data_flow.length - 1 &&
                              "border-b border-nevo-near-black/7",
                          )}
                        >
                          <span className="text-[14.5px] font-semibold text-nevo-near-black">
                            {f.description}
                          </span>
                          <span className="mt-px text-[13px] text-nevo-near-black/58">
                            {f.purpose}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2.5 text-[13px] leading-[1.55] text-nevo-near-black/55">
                      Reading only, one direction. Nothing Nevo holds is ever
                      written back to your {PROVIDER_LABELS[status.provider]}.
                    </p>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="mt-8 cursor-pointer text-sm font-semibold text-nevo-navy underline underline-offset-[3px]"
                >
                  {`Disconnect ${PROVIDER_LABELS[status.provider]}`}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {confirming && status && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-nevo-near-black/50 p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
          onClick={() => {
            if (busy !== "") return;
            setConfirming(false);
            setDisconnectFailed(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Disconnect ${PROVIDER_LABELS[status.provider]}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] rounded-2xl bg-nevo-cream p-8 shadow-[0_24px_60px_rgba(0,0,0,0.3)] motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200"
          >
            <h3 className="text-xl font-semibold text-nevo-near-black">
              {`Disconnect ${PROVIDER_LABELS[status.provider]}`}
            </h3>
            <p className="mt-2 text-sm leading-[1.55] text-nevo-near-black/62">
              Here&rsquo;s exactly what happens. Nothing is deleted, and nobody
              loses their work.
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {DISCONNECT_CONSEQUENCES.map((c) => (
                <li
                  key={c}
                  className="flex gap-2.5 text-sm leading-[1.55] text-nevo-near-black/78"
                >
                  <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-nevo-violet" />
                  {c}
                </li>
              ))}
            </ul>

            {/*
              * THE SCHOOL CODE, not the URL slug.
              *
              * This panel is the reason D10b routes disconnection through a
              * confirmation at all - sign-in moves to the school code, so the
              * code is shown before anyone commits. It rendered
              * `status.school_url_slug`, which is the address slug
              * ("brightgate"), never the code ("BGA-4827"), under the words
              * "Staff and students enter this the next time they sign in".
              * An admin who wrote that down and circulated it would have
              * locked the school out of the very sign-in this dialog is
              * promising them.
              *
              * `code` is nullable in the contract, and a school with none is
              * exactly the school that must not be told to go and use it.
              */}
            <div className="mt-5 rounded-[10px] bg-nevo-cream-elevated px-[18px] py-4">
              <span className="text-[12.5px] font-semibold tracking-[0.06em] text-nevo-near-black/55 uppercase">
                Your school code
              </span>
              {school?.code ? (
                <>
                  <p className="mt-1 font-mono text-[19px] font-semibold text-nevo-near-black">
                    {school.code}
                  </p>
                  <p className="mt-1 text-[13px] text-nevo-near-black/58">
                    Staff and students enter this the next time they sign in.
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[13px] leading-[1.5] text-nevo-near-black/58">
                  We couldn&rsquo;t read your school code just now. Check it on
                  your school record before you disconnect &ndash; it is what
                  everyone will sign in with afterwards.
                </p>
              )}
            </div>

            {disconnectFailed && (
              <WriteFailed
                className="mt-5"
                what={`disconnect ${PROVIDER_LABELS[status.provider]}`}
              />
            )}

            <button
              type="button"
              onClick={disconnect}
              disabled={busy !== ""}
              className="mt-6 h-[50px] w-full cursor-pointer rounded-[10px] bg-nevo-navy text-[15px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93 disabled:cursor-wait disabled:opacity-70"
            >
              {busy === "disconnecting"
                ? "Disconnecting…"
                : "Disconnect and use our school code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setDisconnectFailed(false);
              }}
              disabled={busy !== ""}
              className="mt-2 h-[46px] w-full cursor-pointer rounded-[10px] text-sm font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
            >
              Keep it connected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
