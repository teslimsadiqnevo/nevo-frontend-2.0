"use client";

import { useCallback, useEffect, useState } from "react";
import { teamApi, roleForScopes, type TeamMember } from "@/lib/api/team";
import type { PermissionScope } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import {
  ADMIN_SEAT_ALLOWANCE,
  SCOPE_CATALOGUE,
  initialsFor,
  orderScopes,
  scopeName,
} from "./adminScopes";

/**
 * D03 Admin Team & Permissions - who can see and do what.
 *
 * Scopes are assigned one at a time; there are no bundled presets in v1, and
 * the scope names here are the same ones that appear wherever access is
 * described, which is why they live in one catalogue.
 *
 * Four states are drawn: the list, the invite panel, "just you so far" for a
 * new school, and the at-allowance state. A page-level loading and a
 * fetch-failure state are NOT drawn anywhere in the admin set - those two are
 * ours, and deliberately quiet.
 *
 * WHAT THE API DOES NOT CARRY, so the frame cannot be met in full:
 * - no founding flag, so the "Founding" badge and the locked General Oversight
 *   pill (with the note about a school never locking itself out) cannot render
 * - no last-active timestamp, so the frame's "Active today" / "2 days ago"
 *   column has nothing behind it
 * - no school name, so the count line says "this school"
 * - no seat allowance, so the five is a constant we assert
 * All four are raised with backend rather than invented here.
 *
 * TODO(api): PUT /admin/team/{id}/scopes is deployed and typed, but D03 draws
 * no affordance for changing an existing admin's access. Needs design.
 */

const CARD = "rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

type Phase = "loading" | "ready" | "failed";
type SendPhase = "idle" | "sending" | "sent";

function ScopePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-nevo-violet/24 px-[11px] py-1 text-[11.5px] font-semibold text-nevo-navy">
      {label}
    </span>
  );
}

function displayName(m: TeamMember): string {
  const full = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
  return full || m.email || "Invited admin";
}

export function AdminTeamView() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [inviting, setInviting] = useState(false);

  // No synchronous setState in the effect body (react-hooks/set-state-in-effect):
  // "loading" is already the initial state, so only a retry has to reset it.
  const fetchTeam = useCallback(() => {
    teamApi
      .list()
      .then((rows) => {
        setTeam(rows);
        setPhase("ready");
      })
      .catch(() => setPhase("failed"));
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const retry = () => {
    setPhase("loading");
    fetchTeam();
  };

  if (inviting) {
    return (
      <InvitePanel
        onCancel={() => setInviting(false)}
        onSent={() => {
          setInviting(false);
          retry();
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[820px]">
        {phase === "loading" && (
          <>
            <Heading count={null} />
            <div className={cn(CARD, "mt-6 h-[280px] animate-pulse")} />
          </>
        )}

        {phase === "failed" && (
          <>
            <Heading count={null} />
            {/* No frame draws this; kept quiet and recoverable. */}
            <div className={cn(CARD, "mt-6 px-[26px] py-7")}>
              <h3 className="text-[17px] font-semibold text-nevo-near-black">
                We couldn&rsquo;t load your admin team
              </h3>
              <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-nevo-near-black/62">
                Nothing has changed - this is only about showing you the list.
                Try again in a moment.
              </p>
              <button
                type="button"
                onClick={retry}
                className="mt-5 h-[46px] cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
              >
                Try again
              </button>
            </div>
          </>
        )}

        {phase === "ready" && team.length <= 1 && (
          <JustYou member={team[0]} onInvite={() => setInviting(true)} />
        )}

        {phase === "ready" && team.length > 1 && (
          <TeamList team={team} onInvite={() => setInviting(true)} />
        )}
      </div>
    </div>
  );
}

function Heading({ count }: { count: number | null }) {
  return (
    <>
      <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
        Admin Team
      </h2>
      {count !== null && (
        <p className="mt-1.5 text-[15.5px] leading-[1.55] text-nevo-near-black/60">
          {/* The team response carries no school name - see the docblock. */}
          {`${count} ${count === 1 ? "person" : "people"} can administer this school`}
        </p>
      )}
    </>
  );
}

function SeatsLine({ used }: { used: number }) {
  return (
    <span className="text-[13px] text-nevo-near-black/55">
      {`${used} of ${ADMIN_SEAT_ALLOWANCE} admin accounts`}
    </span>
  );
}

function InviteButton({
  onClick,
  label = "Invite an admin",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[46px] shrink-0 cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
    >
      {label}
    </button>
  );
}

function MemberRow({ m, last }: { m: TeamMember; last: boolean }) {
  const name = displayName(m);
  // Anything other than an active account reads as still-pending; the API
  // types `status` as a bare string, so this stays a loose check.
  const pending = m.status.toLowerCase() !== "active";
  return (
    <div
      className={cn(
        "flex items-center gap-[13px] px-[22px] py-[18px]",
        !last && "border-b border-nevo-near-black/7",
      )}
    >
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-nevo-navy/10 text-[12.5px] font-semibold text-nevo-navy">
        {initialsFor(name, m.email)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-nevo-near-black">
            {name}
          </span>
        </span>
        {m.email && (
          <span className="truncate text-[13px] text-nevo-near-black/55">
            {m.email}
          </span>
        )}
        <span className="mt-0.5 flex flex-wrap gap-[6px]">
          {orderScopes(m.scopes).map((s) => (
            <ScopePill key={s} label={scopeName(s)} />
          ))}
          {m.scopes.length === 0 && (
            <span className="text-[12.5px] text-nevo-near-black/45">
              No access yet
            </span>
          )}
        </span>
      </span>
      {pending && (
        <span className="shrink-0 rounded-full bg-nevo-violet/24 px-[11px] py-1 text-[12px] font-semibold text-nevo-navy">
          Invited
        </span>
      )}
    </div>
  );
}

function TeamList({
  team,
  onInvite,
}: {
  team: TeamMember[];
  onInvite: () => void;
}) {
  const atAllowance = team.length >= ADMIN_SEAT_ALLOWANCE;
  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Heading count={team.length} />
        </div>
        {!atAllowance && <InviteButton onClick={onInvite} />}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <SeatsLine used={team.length} />
      </div>

      {atAllowance && (
        <div className={cn(CARD, "mt-3 px-[26px] py-6")}>
          <h3 className="text-[16px] font-semibold text-nevo-near-black">
            All five admin accounts are in use
          </h3>
          <p className="mt-2 max-w-[60ch] text-sm leading-[1.6] text-nevo-near-black/66">
            This school includes five admin accounts as standard. Need another?
            We&rsquo;ll add it at no charge - just ask. Keeping the standing
            number small is a data-governance and security measure, not a
            billing one: the fewer accounts that can reach student data, the
            smaller the risk.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {/* TODO(api): no endpoint requests an extra account. */}
            <button
              type="button"
              className="h-[46px] cursor-pointer rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
            >
              Request another account
            </button>
            <span className="text-[13px] text-nevo-near-black/55">
              Added at no charge, usually the same day. Admin accounts are
              always free.
            </span>
          </div>
        </div>
      )}

      <div className={cn(CARD, "mt-3 overflow-hidden")}>
        {team.map((m, i) => (
          <MemberRow key={m.user_id} m={m} last={i === team.length - 1} />
        ))}
      </div>
    </>
  );
}

function JustYou({
  member,
  onInvite,
}: {
  member: TeamMember | undefined;
  onInvite: () => void;
}) {
  return (
    <>
      <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
        Admin Team
      </h2>
      <p className="mt-1.5 max-w-[60ch] text-[15.5px] leading-[1.55] text-nevo-near-black/60">
        It&rsquo;s just you for now &ndash; you have full oversight of this
        school.
      </p>

      {member && (
        <div className={cn(CARD, "mt-5 overflow-hidden")}>
          <MemberRow m={member} last />
        </div>
      )}

      <div className={cn(CARD, "mt-4 px-[26px] py-7")}>
        <h3 className="text-[17px] font-semibold text-nevo-near-black">
          Share the load when you&rsquo;re ready
        </h3>
        <p className="mt-2 max-w-[60ch] text-sm leading-[1.6] text-nevo-near-black/66">
          Invite an IT lead, a SENCo or a finance colleague and give each
          exactly the access they need &ndash; one scope at a time. Nothing
          changes for you.
        </p>
        <div className="mt-5">
          <InviteButton onClick={onInvite} />
        </div>
      </div>
    </>
  );
}

function InvitePanel({
  onCancel,
  onSent,
}: {
  onCancel: () => void;
  onSent: () => void;
}) {
  const [email, setEmail] = useState("");
  const [on, setOn] = useState<Set<PermissionScope>>(
    () => new Set(SCOPE_CATALOGUE.filter((s) => s.defaultOn).map((s) => s.scope)),
  );
  const [phase, setPhase] = useState<SendPhase>("idle");
  const [error, setError] = useState("");

  const count = on.size;
  const valid = /.+@.+\..+/.test(email.trim()) && count > 0;

  const send = () => {
    if (!valid || phase !== "idle") return;
    setError("");
    setPhase("sending");
    const scopes = [...on];
    teamApi
      .invite({ email: email.trim(), role: roleForScopes(scopes), scopes })
      .then(() => {
        setPhase("sent");
        setTimeout(onSent, 1400);
      })
      .catch(() => {
        setPhase("idle");
        setError(
          "We couldn't send that invitation. Check the address and try again.",
        );
      });
  };

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[560px]">
        <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
          Invite a new admin
        </h2>
        <p className="mt-1.5 text-[15.5px] leading-[1.55] text-nevo-near-black/60">
          They&rsquo;ll get an email to set a password and join.
        </p>

        <label
          htmlFor="invite-email"
          className="mt-7 block text-[13px] font-semibold text-nevo-near-black/70"
        >
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="g.eze@brightgate.edu.ng"
          disabled={phase !== "idle"}
          className="mt-2 h-[52px] w-full rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream-elevated px-4 text-[16px] text-nevo-near-black outline-none transition-colors placeholder:text-nevo-near-black/35 focus:border-nevo-navy disabled:opacity-60"
        />

        <span className="mt-7 block text-[13px] font-semibold text-nevo-near-black/70">
          What can they access?
        </span>
        <div className="mt-2.5 flex flex-col gap-2">
          {SCOPE_CATALOGUE.map((s) => {
            const checked = on.has(s.scope);
            return (
              <label
                key={s.scope}
                className="flex cursor-pointer items-center gap-[13px] rounded-[10px] bg-nevo-cream-elevated px-[15px] py-[13px]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={phase !== "idle"}
                  onChange={() =>
                    setOn((prev) => {
                      const next = new Set(prev);
                      if (next.has(s.scope)) next.delete(s.scope);
                      else next.add(s.scope);
                      return next;
                    })
                  }
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "flex size-[22px] shrink-0 items-center justify-center rounded-[6px]",
                    checked
                      ? "bg-nevo-navy text-nevo-cream"
                      : "border-2 border-nevo-near-black/24",
                  )}
                >
                  {checked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[14.5px] font-semibold text-nevo-near-black">
                    {s.name}
                  </span>
                  <span className="mt-px text-[13px] text-nevo-near-black/58">
                    {s.desc}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-[10px] bg-nevo-violet/16 px-4 py-3 text-[13.5px] leading-[1.5] text-nevo-near-black/78">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3.5">
          <button
            type="button"
            onClick={send}
            className={cn(
              "flex h-[50px] items-center justify-center rounded-[10px] bg-nevo-navy px-6 text-[15px] font-semibold text-nevo-cream transition-[filter]",
              valid && phase === "idle"
                ? "cursor-pointer hover:brightness-93"
                : "cursor-default opacity-50",
            )}
          >
            {phase === "sending"
              ? "Sending…"
              : phase === "sent"
                ? `Invitation sent to ${count} scope${count === 1 ? "" : "s"}`
                : "Send invitation"}
          </button>
          {phase === "idle" && (
            <button
              type="button"
              onClick={onCancel}
              className="h-[50px] cursor-pointer rounded-[10px] px-4 text-sm font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
