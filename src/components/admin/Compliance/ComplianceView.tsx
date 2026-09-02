"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BASE_URL } from "@/lib/api";
import {
  schoolIntelligenceApi,
  type ComplianceAudit,
} from "@/lib/api/schoolIntelligence";
import { getToken } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { labelHero, ndpaClaims } from "./ndpaClaims";

/**
 * D22 NDPA compliance audit - the drill-down that turns the Overview's
 * compliance card into evidence a SENCo can stand behind in front of a parent
 * or a regulator.
 *
 * The hero is the whole point: not zero shown, zero STORED. Every other claim
 * on the page exists to protect that one - which is why it is now derived
 * from the count rather than asserted beside it. See `ndpaClaims.ts`: the
 * prose here used to say "Nevo has never assigned or recorded a diagnostic
 * category" directly beneath a live number that can come back non-zero.
 *
 * Claim states are honest about their own provenance - see `ndpaClaims.ts`.
 * Only "zero diagnostic labels" is verified from live data; three claims
 * describe architecture rather than a per-school measurement; and three need
 * school data no endpoint returns, so they carry their mechanism with no state
 * chip. On a compliance screen, an invented figure is the worst possible bug.
 *
 * The export is real: `GET /api/admin/compliance-audit/report.pdf`. It is
 * fetched with the Bearer token and handed to the browser as a blob, because
 * the endpoint is behind auth and a bare link would arrive unauthenticated.
 *
 * Export wording is placeholder pending counsel - the frame says so, and the
 * page repeats it rather than letting anyone assume otherwise.
 */

const CARD = "rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

type Phase = "loading" | "ready" | "failed";
type Export = "idle" | "working" | "done" | "failed";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ComplianceView() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [audit, setAudit] = useState<ComplianceAudit | null>(null);
  const [exporting, setExporting] = useState<Export>("idle");

  const load = useCallback(() => {
    schoolIntelligenceApi
      .complianceAudit()
      .then((a) => {
        setAudit(a);
        setPhase("ready");
      })
      .catch(() => setPhase("failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exportReport = () => {
    if (exporting === "working") return;
    setExporting("working");
    // The endpoint is behind auth, so a plain <a href> would arrive without a
    // token. Fetch it, then hand the browser a blob.
    fetch(`${BASE_URL}/api/admin/compliance-audit/report.pdf`, {
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "nevo-ndpa-compliance-audit.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setExporting("done");
        setTimeout(() => setExporting("idle"), 2600);
      })
      .catch(() => setExporting("failed"));
  };

  const labels = audit?.diagnosticLabelsStored ?? 0;
  const hero = labelHero(labels, "audit");
  const claims = ndpaClaims(labels);

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[820px]">
        <Link
          href="/admin/dashboard"
          className="text-[13.5px] font-medium text-nevo-navy hover:underline"
        >
          &larr; School Overview
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
              NDPA 2023 compliance audit
            </h2>
            {audit && (
              <p className="mt-1.5 text-[15px] text-nevo-near-black/60">
                {`${audit.schoolName} · last full check ${fmtDate(audit.generatedAt)}`}
              </p>
            )}
          </div>
          {phase === "ready" && (
            <button
              type="button"
              onClick={exportReport}
              disabled={exporting === "working"}
              className="h-[46px] shrink-0 cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93 disabled:cursor-wait disabled:opacity-70"
            >
              {exporting === "working"
                ? "Preparing report…"
                : exporting === "done"
                  ? "Report downloaded"
                  : exporting === "failed"
                    ? "Try the export again"
                    : "Export report (PDF)"}
            </button>
          )}
        </div>

        {phase === "loading" && (
          <div className={cn(CARD, "mt-6 h-[260px] animate-pulse")} />
        )}

        {phase === "failed" && (
          <div className={cn(CARD, "mt-6 px-[26px] py-7")}>
            <h3 className="text-[17px] font-semibold text-nevo-near-black">
              We couldn&rsquo;t load the compliance audit
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
              Nothing about your school&rsquo;s data has changed. Try again in a
              moment.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase("loading");
                load();
              }}
              className="mt-5 h-[46px] cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
            >
              Try again
            </button>
          </div>
        )}

        {phase === "ready" && audit && (
          <>
            <div className={cn(CARD, "mt-6 px-[26px] py-7")}>
              <div className="flex items-baseline gap-3">
                <span className="text-[44px] leading-none font-semibold text-nevo-navy">
                  {audit.diagnosticLabelsStored}
                </span>
                <span className="text-[15px] font-semibold text-nevo-near-black">
                  {hero.unit}
                </span>
              </div>
              <p className="mt-3 max-w-[64ch] text-sm leading-[1.65] text-nevo-near-black/70">
                {hero.body}
              </p>
            </div>

            {/* Also when the server says the check did not pass. `compliant`
                was fetched and never read, so an audit the backend marked
                false rendered as a clean page whenever `findings` was empty.
                The spec documents no meaning for the flag, so this reports it
                as the server's own verdict and interprets nothing.
                Findings' CONTENTS stay off screen - see ComplianceFinding. */}
            {(audit.findings.length > 0 || !audit.compliant) && (
              <div className={cn(CARD, "mt-4 px-[26px] py-6")}>
                <h3 className="text-[16px] font-semibold text-nevo-near-black">
                  {audit.findings.length > 0
                    ? `${audit.findings.length} finding${audit.findings.length === 1 ? "" : "s"} from the last check`
                    : "The last check didn’t pass"}
                </h3>
                <p className="mt-2 text-sm leading-[1.55] text-nevo-near-black/66">
                  {audit.findings.length > 0
                    ? "Your data officer should look at these before the next audit."
                    : "The audit reported this school as not yet compliant without listing what to look at. Your data officer should follow it up before the next audit."}
                </p>
              </div>
            )}

            <h3 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
              Verifiable claims
            </h3>
            <div className={cn(CARD, "mt-3 overflow-hidden")}>
              {claims.map((c, i) => {
                const verified =
                  c.verification === "labels"
                    ? audit.diagnosticLabelsStored === 0
                      ? "Verified"
                      : "Needs review"
                    : c.verification === "product"
                      ? c.state
                      : null;
                return (
                  <div
                    key={c.title}
                    className={cn(
                      "px-[22px] py-[18px]",
                      i < claims.length - 1 &&
                        "border-b border-nevo-near-black/7",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[15px] font-semibold text-nevo-near-black">
                        {c.title}
                      </span>
                      {verified ? (
                        <span className="rounded-full bg-nevo-navy/14 px-[11px] py-1 text-[12px] font-semibold text-nevo-navy">
                          {verified}
                        </span>
                      ) : (
                        <span className="rounded-full bg-nevo-violet/24 px-[11px] py-1 text-[12px] font-semibold text-nevo-navy">
                          Not verified here
                        </span>
                      )}
                    </div>
                    <p className="mt-2 max-w-[68ch] text-sm leading-[1.6] text-nevo-near-black/70">
                      {c.mechanism}
                    </p>
                    <p className="mt-2 text-[13px] text-nevo-near-black/50">
                      <span className="font-semibold">Evidence:</span>{" "}
                      {c.evidence}
                      {c.verification === "labels"
                        ? ` · Last checked: ${fmtDate(audit.generatedAt)}`
                        : ""}
                    </p>
                    {c.verification === "unverified" && (
                      <p className="mt-1.5 text-[13px] leading-[1.5] text-nevo-near-black/50 italic">
                        This figure isn&rsquo;t reachable from here yet &ndash;
                        the register it comes from sits outside the audit.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 max-w-[68ch] text-[13px] leading-[1.6] text-nevo-near-black/55">
              The exported report carries the same claims and evidence in a form
              you can print or hand to a parent. Wording in this version is
              placeholder, in the same structure as the DPA; final language is
              owned by counsel. Consent is summarised as coverage only &ndash;
              never per-child detail, which stays out of admin scope.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
