import { cn } from "@/lib/utils";

/**
 * The teacher status vocabulary (D6, "Status vocabulary").
 *
 * Exactly two labels - "Active" and "Invited" - and the spec is unusually
 * specific about what they may not become: no dated variants, no "inactive" or
 * "idle", and no green. Both pills are navy text on a tint, because neither
 * state is a problem and the admin set carries no red or green anywhere.
 *
 * TODO(api): the schema types `status` as a bare `string` with no enum, and the
 * live probe has only ever returned "active". "pending" is the value the admin
 * team route uses for the same idea, so both are treated as not-yet-joined
 * here. Anything else is read as invited rather than silently shown as active -
 * an admin over-checking an invitation is harmless; believing a teacher is on
 * the platform when they are not is the failure worth avoiding.
 */

const ACTIVE = "active";

export function isInvited(status: string): boolean {
  return status.toLowerCase() !== ACTIVE;
}

export function StatusPill({ status }: { status: string }) {
  const invited = isInvited(status);
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center rounded-full px-3 py-1 text-[12.5px] font-semibold text-nevo-navy",
        invited ? "bg-nevo-violet/24" : "bg-nevo-navy/12",
      )}
    >
      {invited ? "Invited" : "Active"}
    </span>
  );
}
