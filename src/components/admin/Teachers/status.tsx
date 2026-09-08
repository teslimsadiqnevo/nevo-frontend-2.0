import { cn } from "@/lib/utils";
import type { UserStatus } from "@/lib/api/teachers";

/**
 * The teacher status vocabulary (D6, "Status vocabulary").
 *
 * D6 specifies two labels - "Active" and "Invited" - and is unusually specific
 * about what they may not become: no dated variants, no "inactive" or "idle",
 * and no green. Both pills are navy text on a tint, because neither state is a
 * problem and the admin set carries no red or green anywhere.
 *
 * A THIRD STATE EXISTS AND D6 PREDATES IT. `UserStatus` is a closed enum,
 * `active | invited | deactivated`, and `POST /teachers/{id}/revoke` is what
 * produces the third - a route this console already calls. `GET /teachers`
 * takes only a `search` parameter, with no include-inactive filter, so a
 * revoked teacher comes back in the same list as everyone else.
 *
 * This used to read `status !== "active"` and label everything else "Invited",
 * which meant a teacher whose access an admin had just revoked was reported to
 * that admin as having an invitation outstanding. That is the opposite of what
 * happened, on the screen whose whole job is to say who can get in. The old
 * reasoning - "an admin over-checking an invitation is harmless" - held only
 * while `invited` was the sole non-active value.
 *
 * So a third pill is rendered rather than a wrong one. It keeps the navy-on-tint
 * treatment and adds no alarm colour, so it obeys everything D6 says about
 * appearance while telling the truth about a state D6 did not know about.
 * FLAGGED TO DESIGN: D6's "exactly two labels" rule needs updating, and the
 * deactivated pill's wording and tint are design's call, not ours.
 */

export function isInvited(status: UserStatus): boolean {
  return status === "invited";
}

/** Whether the account can currently sign in. */
export function isActive(status: UserStatus): boolean {
  return status === "active";
}

const LABEL: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  deactivated: "Deactivated",
};

const TINT: Record<UserStatus, string> = {
  active: "bg-nevo-navy/12",
  invited: "bg-nevo-violet/24",
  // Deliberately the flattest of the three: a revoked account is not an alert,
  // it is simply no longer live. No red - the admin set has none.
  deactivated: "bg-nevo-near-black/8",
};

export function StatusPill({ status }: { status: UserStatus }) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center rounded-full px-3 py-1 text-[12.5px] font-semibold text-nevo-navy",
        TINT[status],
      )}
    >
      {LABEL[status]}
    </span>
  );
}
