/**
 * How much of a segment arrives at once.
 *
 * Lifted out of `TextSegment` on 17 Sep so two callers can share one
 * definition. The renderer needs the parts; the player needs to know whether
 * there would be more than one BEFORE it offers the control, and an offer that
 * re-renders identical prose is the player telling a child it adapted when it
 * did not.
 *
 * This is presentation, not content. It regroups sentences the lesson already
 * has and invents nothing, which is why a child can reach it on live parsed
 * content where no authored reshape exists.
 */

/** Split into sentences, grouped into at most three short parts. */
export function chunkBody(body: string): string[] {
  const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 2) return [body];
  const parts = Math.min(3, sentences.length);
  const per = Math.ceil(sentences.length / parts);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += per)
    out.push(sentences.slice(i, i + per).join(" "));
  return out;
}

/**
 * Would chunking this body actually change anything?
 *
 * The gate on offering Slower. A one-sentence segment chunks to itself, and
 * offering a control that does nothing is worse than not offering it: the
 * child asked for less at a time, got the same screen, and learns the control
 * is a lie.
 */
export function isChunkable(body: string | undefined | null): boolean {
  return Boolean(body) && chunkBody(body!).length > 1;
}
