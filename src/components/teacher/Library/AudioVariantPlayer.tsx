"use client";

import { useState } from "react";
import { contentApi } from "@/lib/api/content";
import type { AudioVariant } from "@/lib/api/variants";

/**
 * The narration, playable.
 *
 * WHY THIS DID NOT EXIST, and why the reason expired. The review screen showed
 * the script and no player, and said so: "`requiresAuthentication` is true for
 * private storage URLs, and `urlExpiresInSeconds` means a URL can age out, so a
 * bare `<audio src>` would render a control that silently fails... the player
 * can come when there is a refresh path through `POST /api/content/media/url`."
 *
 * That path is deployed, `contentApi.mediaUrl` is wrapped, and nothing called
 * it. So this is the control the comment was waiting for, not a new dependency.
 *
 * A teacher approving narration for a class cannot judge it from a transcript.
 * Whether the voice is right, whether it stumbles over "denominator", whether
 * the pace suits a nine-year-old - none of that is in the script, and approval
 * is exactly the moment those matter.
 */
export function AudioVariantPlayer({ variant }: { variant: AudioVariant }) {
  /**
   * The URL actually being played. Starts as the one the lesson read gave us
   * and is replaced by a refreshed one if that turns out to be dead.
   */
  const [src, setSrc] = useState(variant.audioUrl);
  const [refreshing, setRefreshing] = useState(false);
  /** Refresh is attempted ONCE. A loop on a permanently dead object is worse. */
  const [tried, setTried] = useState(false);
  const [dead, setDead] = useState(false);

  /**
   * An expired signed URL fails at PLAY time, not at render, so the element's
   * own error is the only reliable signal. `urlExpiresInSeconds` is not checked
   * up front on purpose: we do not know when the URL was minted, only how long
   * it lasts, so any pre-emptive calculation would be a guess - and guessing
   * early means refreshing a URL that was fine.
   */
  async function recover() {
    if (tried || refreshing) return;
    setTried(true);
    // Nothing identifies the object without it. `audioUrl` is the stale URL,
    // and the endpoint takes `storagePath` precisely because of that.
    if (!variant.storagePath) {
      setDead(true);
      return;
    }
    setRefreshing(true);
    try {
      const fresh = await contentApi.mediaUrl(variant.storagePath);
      setSrc(fresh.url);
    } catch {
      setDead(true);
    } finally {
      setRefreshing(false);
    }
  }

  if (dead) {
    return (
      <p className="text-[12.5px] leading-[1.5] text-nevo-near-black/55">
        {/* The script is still above this, so the teacher is not left with
            nothing - they just cannot hear it. Saying which is the point. */}
        We couldn&rsquo;t play this narration just now. The script above is
        still what Nevo would read.
      </p>
    );
  }

  return (
    <audio
      // Keyed on the src so a refreshed URL actually reloads: React keeps the
      // same element otherwise and the browser holds the failed source.
      //
      // NOT COVERED BY A TEST, and it cannot be: jsdom updates the `src`
      // attribute whether or not the element is remounted, so removing this key
      // fails nothing. Verified by mutation - the guard below dies, this does
      // not. It matters only in a real browser.
      key={src}
      controls
      preload="none"
      src={src}
      onError={recover}
      className="w-full max-w-[420px]"
    >
      {/* Read by nothing modern, and correct anyway. */}
      Your browser cannot play audio.
    </audio>
  );
}
