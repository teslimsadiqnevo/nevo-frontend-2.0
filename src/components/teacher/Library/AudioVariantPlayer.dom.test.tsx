import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AudioVariant } from "@/lib/api/variants";

const { mediaUrl } = vi.hoisted(() => ({ mediaUrl: vi.fn() }));
vi.mock("@/lib/api/content", () => ({ contentApi: { mediaUrl } }));

import { AudioVariantPlayer } from "./AudioVariantPlayer";

/**
 * The narration player, and the blocker that expired.
 *
 * The review screen showed the script alone, and its own comment said why: an
 * expiring, sometimes-authenticated URL made a bare `<audio src>` a control
 * that could silently fail, and it would wait for "a refresh path through
 * POST /api/content/media/url". That path was deployed and uncalled for days.
 *
 * So the tests are about the recovery, not the element: what happens when the
 * signed URL is dead, which is the case the deferral was protecting against.
 */

const variant = (over: Partial<AudioVariant> = {}): AudioVariant =>
  ({
    script: "So, when the denominators are different...",
    audioUrl: "https://storage.example/clip.mp3?sig=stale",
    storagePath: "lessons/l-1/seg-1/audio.mp3",
    durationMs: 72_000,
    provider: "elevenlabs",
    voice: "en-NG-1",
    format: "mp3",
    requiresAuthentication: true,
    urlExpiresInSeconds: 3600,
    stepId: null,
    ...over,
  }) as AudioVariant;

const audio = () => document.querySelector("audio");

beforeEach(() => {
  mediaUrl.mockReset();
  mediaUrl.mockResolvedValue({
    storagePath: "lessons/l-1/seg-1/audio.mp3",
    url: "https://storage.example/clip.mp3?sig=fresh",
    expiresInSeconds: 3600,
  });
});

describe("playing it", () => {
  it("offers a real control on the URL the lesson read gave us", () => {
    render(<AudioVariantPlayer variant={variant()} />);

    expect(audio()).toHaveAttribute("src", "https://storage.example/clip.mp3?sig=stale");
    expect(audio()).toHaveAttribute("controls");
  });

  it("does not fetch the file until someone asks", () => {
    // A review screen mounts this on a tab nobody may open.
    render(<AudioVariantPlayer variant={variant()} />);

    expect(audio()).toHaveAttribute("preload", "none");
  });
});

describe("when the signed URL is dead", () => {
  it("refreshes it through the path the deferral was waiting for", async () => {
    // An expired URL fails at PLAY time, not at render, so the element's own
    // error is the only reliable signal.
    render(<AudioVariantPlayer variant={variant()} />);
    fireEvent.error(audio()!);

    await waitFor(() =>
      expect(mediaUrl).toHaveBeenCalledWith("lessons/l-1/seg-1/audio.mp3"),
    );
  });

  it("plays the refreshed URL", async () => {
    render(<AudioVariantPlayer variant={variant()} />);
    fireEvent.error(audio()!);

    await waitFor(() =>
      expect(audio()).toHaveAttribute("src", "https://storage.example/clip.mp3?sig=fresh"),
    );
  });

  it("tries once, never in a loop", async () => {
    // A permanently dead object would otherwise refresh forever, and each
    // attempt is a request.
    render(<AudioVariantPlayer variant={variant()} />);
    fireEvent.error(audio()!);
    await waitFor(() => expect(mediaUrl).toHaveBeenCalledTimes(1));

    fireEvent.error(audio()!);
    fireEvent.error(audio()!);

    expect(mediaUrl).toHaveBeenCalledTimes(1);
  });

  it("says so when there is nothing to refresh with", async () => {
    // `storagePath` is nullable and it is the only thing that identifies the
    // object - `audioUrl` is the stale URL, which is why the endpoint takes
    // the path instead.
    render(<AudioVariantPlayer variant={variant({ storagePath: null })} />);
    fireEvent.error(audio()!);

    expect(await screen.findByText(/couldn’t play this narration/i)).toBeInTheDocument();
    expect(mediaUrl).not.toHaveBeenCalled();
  });

  it("says so when the refresh itself fails, and points at the script", async () => {
    // The script is still rendered above this by the parent, so the teacher is
    // not left with nothing - and the copy says which.
    mediaUrl.mockRejectedValue(new Error("gone"));
    render(<AudioVariantPlayer variant={variant()} />);
    fireEvent.error(audio()!);

    expect(await screen.findByText(/script above is still what Nevo would read/i)).toBeInTheDocument();
  });
});
