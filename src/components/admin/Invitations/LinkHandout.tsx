"use client";

import { useEffect, useRef, useState } from "react";
import type { Invitation } from "@/lib/api/invites";
import { cn } from "@/lib/utils";
import { inviteeName, joinLink, joinLinkBlock } from "./joinLink";

/**
 * The links for invitations nobody was emailed.
 *
 * This is the half of the bulk-import defect that copy alone would not have
 * fixed. Telling a school "no email went out" and leaving it there is truthful
 * and still useless: the join tokens arrive on the create response, this modal
 * was the only thing holding them, and there is no copy-link affordance
 * anywhere else in the console. A 200-row staff import that emailed nobody had
 * exactly one recovery - revoke and reissue, one person at a time, through a
 * modal that rejects duplicates.
 *
 * So the links are handed over here, and "Copy all" produces a block a bursar
 * can paste straight into whatever the school actually uses, which on day one
 * is usually WhatsApp.
 *
 * ROWS WITH NO TOKEN ARE COUNTED, NOT FAKED. `token` is nullable in the
 * contract; a row without one gets no link and is reported separately, because
 * a "Copy link" that yields `/join/null` is worse than an admitted gap.
 *
 * DESIGN LAW: no red. Nobody has done anything wrong here - the school simply
 * has no mail configured - so this is violet and matter-of-fact.
 */

const COPIED_MS = 1800;

function useCopied(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = (text: string) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_MS);
      })
      // A clipboard the browser refuses is not a copy that happened.
      .catch(() => setCopied(false));
  };

  return [copied, copy];
}

function LinkRow({ invite }: { invite: Invitation }) {
  const [copied, copy] = useCopied();
  const link = joinLink(invite.token);
  if (!link) return null;

  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13.5px] font-semibold text-nevo-near-black">
          {inviteeName(invite)}
        </span>
        <span className="truncate font-mono text-[12px] text-nevo-near-black/55">
          {link}
        </span>
      </span>
      <button
        type="button"
        onClick={() => copy(link)}
        className="shrink-0 cursor-pointer text-[13px] font-semibold text-nevo-navy hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </li>
  );
}

export function LinkHandout({
  invites,
  lead,
  noLinkHint = "Resend from the invitations list to get one.",
  className,
}: {
  /** Only the ones nobody was emailed. */
  invites: Invitation[];
  /** The sentence above the list, which the caller words for its own case. */
  lead: string;
  /**
   * What to do about a row with no token. The default points at the
   * invitations list, which is right for the bulk-import caller and CIRCULAR
   * for the invitations list itself - it would tell an admin to press the
   * button they just pressed.
   */
  noLinkHint?: string;
  className?: string;
}) {
  const [copiedAll, copyAll] = useCopied();
  const withLink = invites.filter((i) => i.token);
  const missing = invites.length - withLink.length;

  return (
    <div
      className={cn(
        "rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3.5 text-nevo-navy",
        className,
      )}
    >
      <p className="m-0 text-[13.5px] leading-[1.5]">{lead}</p>

      {withLink.length > 0 ? (
        <>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <span className="text-[12.5px] font-semibold tracking-[0.04em] uppercase opacity-70">
              {withLink.length === 1 ? "Their link" : `${withLink.length} links`}
            </span>
            <button
              type="button"
              onClick={() => copyAll(joinLinkBlock(withLink))}
              className="cursor-pointer text-[13px] font-semibold text-nevo-navy hover:underline"
            >
              {copiedAll ? "Copied" : "Copy all"}
            </button>
          </div>
          {/* Two hundred rows is a realistic import, so the list scrolls
              inside the modal rather than pushing its actions off screen. */}
          <ul className="m-0 mt-1 max-h-[220px] list-none divide-y divide-nevo-navy/10 overflow-y-auto p-0">
            {withLink.map((i) => (
              <LinkRow key={i.id} invite={i} />
            ))}
          </ul>
        </>
      ) : null}

      {missing > 0 ? (
        <p className="m-0 mt-2.5 text-[13px] leading-[1.5]">
          {missing === invites.length
            ? `No link came back for ${missing === 1 ? "them" : "any of them"}.`
            : `${missing} of them came back without a link.`}{" "}
          {noLinkHint}
        </p>
      ) : null}
    </div>
  );
}
