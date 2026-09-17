"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The navy disc a person is represented by, with their photo in it when there
 * is one.
 *
 * THREE SURFACES SHARE THIS, and that is the point: the sidebar rail, the
 * profile header and the edit dialog. A teacher who changes their photo and
 * then sees initials still sitting in the rail is the same defect
 * `publishIdentity` was written to prevent, one screen over.
 *
 * `children` is the fallback - initials, a neutral glyph, whatever the caller
 * already drew. It renders when there is no photo AND when the photo will not
 * load: a stored URL can expire or 404, and a broken image icon where a
 * person's face should be is worse than the initials that were there before.
 *
 * `alt=""` because every one of these sits beside the person's name. A screen
 * reader announcing "profile photo" after the name adds nothing.
 *
 * A raw `img`, not `next/image`: the URL comes from wherever the backend
 * stores uploads, and `next/image` needs that host declared in
 * `next.config` ahead of time. A photo that 404s because we did not predict
 * the CDN hostname is a worse failure than an unoptimised request.
 */
export function AvatarDisc({
  photoUrl,
  className,
  children,
}: {
  photoUrl?: string | null;
  /** Size and any type styling for the fallback. */
  className?: string;
  children: ReactNode;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-nevo-navy text-nevo-cream",
        className,
      )}
    >
      {photoUrl && !broken ? (
        <img
          src={photoUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        children
      )}
    </span>
  );
}
