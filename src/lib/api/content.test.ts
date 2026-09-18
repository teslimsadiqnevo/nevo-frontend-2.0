import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { awaitParseRun, contentApi, type ParseRunStatus } from "./content";

/**
 * Parsing became asynchronous on 9 Sep: `parse`, `upload` and `regenerate` all
 * answer 202 with a receipt, and the caller polls a run.
 *
 * The two things worth pinning are the two ways a poller goes wrong.
 *
 * It must not stop early - a run that is still `processing` is not a result,
 * and treating it as one would hand a teacher a half-parsed lesson.
 *
 * And it must not hang. `finished` is true for `failed` as well as the two
 * completed statuses, which is exactly so a caller never has to enumerate the
 * terminal ones. A poller written against `status === "completed"` would wait
 * out its whole ceiling on a run that failed in two seconds, and then report a
 * timeout instead of the reason the backend already gave it.
 */

const run = (over: Partial<ParseRunStatus> = {}): ParseRunStatus => ({
  parseRunId: "run-1",
  lessonId: "lesson-1",
  status: "processing",
  finished: false,
  startedAt: new Date().toISOString(),
  completedAt: null,
  failureReason: null,
  reviewNotes: [],
  segmentCount: 0,
  fallbackSegmentCount: 0,
  ...over,
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("awaitParseRun", () => {
  it("keeps asking while the run is still working", async () => {
    const poll = vi
      .spyOn(contentApi, "parseRun")
      .mockResolvedValueOnce(run({ status: "pending" }))
      .mockResolvedValueOnce(run({ status: "processing" }))
      .mockResolvedValueOnce(
        run({
          status: "completed",
          finished: true,
          segmentCount: 6,
          fallbackSegmentCount: 0,
        }),
      );

    const promise = awaitParseRun("run-1");
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;

    expect(poll).toHaveBeenCalledTimes(3);
    expect(result.segmentCount).toBe(6);
    expect(result.fallbackSegmentCount).toBe(0);
  });

  it("resolves with the reason when the run failed, rather than waiting it out", async () => {
    // `finished` is true here even though the status is `failed`. A poller that
    // watched `status === "completed"` would sit here for its full five-minute
    // ceiling and then report a timeout, throwing away the answer it was given.
    vi.spyOn(contentApi, "parseRun").mockResolvedValue(
      run({
        status: "failed",
        finished: true,
        failureReason: "model output truncated",
      }),
    );

    const promise = awaitParseRun("run-1");
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result.status).toBe("failed");
    expect(result.failureReason).toBe("model output truncated");
  });

  it("treats completed_with_review as finished", async () => {
    vi.spyOn(contentApi, "parseRun").mockResolvedValue(
      run({ status: "completed_with_review", finished: true, segmentCount: 4 }),
    );

    const promise = awaitParseRun("run-1");
    await vi.advanceTimersByTimeAsync(2000);

    await expect(promise).resolves.toMatchObject({
      status: "completed_with_review",
    });
  });

  it("reports a fallback-only parse rather than hiding it", async () => {
    // segmentCount === fallbackSegmentCount means every segment is split-up
    // source text and the model contributed nothing. That is the state every
    // lesson in the library was in, silently, until 9 Sep.
    vi.spyOn(contentApi, "parseRun").mockResolvedValue(
      run({
        status: "completed_with_review",
        finished: true,
        segmentCount: 3,
        fallbackSegmentCount: 3,
      }),
    );

    const promise = awaitParseRun("run-1");
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result.fallbackSegmentCount).toBe(result.segmentCount);
  });

  it("stops when the caller aborts", async () => {
    vi.spyOn(contentApi, "parseRun").mockResolvedValue(run());
    const controller = new AbortController();
    controller.abort();

    await expect(awaitParseRun("run-1", { signal: controller.signal })).rejects.toThrow(
      /aborted/i,
    );
  });

  it("KEEPS GOING PAST FIVE MINUTES, because a real parse does", async () => {
    /*
     * THE TEST HERE BEFORE THIS ONE PINNED THE DEFECT. It asserted that
     * polling gave up after five minutes, and backend's report on run
     * de43cb1c is what that cost: polling stopped at 18:24:09.8, the run
     * completed at 18:24:09.3 with ten segments, and the teacher was shown
     * "we couldn't reach Nevo" for a lesson sitting in their library.
     *
     * The premise was wrong, not the number. The text step alone runs about
     * 115 seconds in production and each generated picture has a budget of
     * up to 600 seconds. The backend marks a run failed itself at thirty
     * minutes, so a shorter client deadline can only ever invent a failure
     * the server did not report.
     */
    const poll = vi.spyOn(contentApi, "parseRun").mockResolvedValue(run());

    const promise = awaitParseRun("run-1");
    const settled = promise.then(
      () => "resolved",
      (e: Error) => e.message,
    );
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

    // Still asking, ten minutes in.
    expect(poll.mock.calls.length).toBeGreaterThan(40);

    poll.mockResolvedValue(
      run({ status: "completed", finished: true, segmentCount: 10 }),
    );
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(settled).resolves.toBe("resolved");
  });

  it("slows down after the first minute instead of hammering", async () => {
    // Backend asked for one poll every 10 to 15 seconds after a minute. A
    // 1.5-second poll held for half an hour is 1,200 requests for one
    // lesson.
    const poll = vi.spyOn(contentApi, "parseRun").mockResolvedValue(run());

    void awaitParseRun("run-1").catch(() => {});
    await vi.advanceTimersByTimeAsync(60_000);
    const inTheFirstMinute = poll.mock.calls.length;

    await vi.advanceTimersByTimeAsync(60_000);
    const inTheSecond = poll.mock.calls.length - inTheFirstMinute;

    expect(inTheFirstMinute).toBeGreaterThan(20);
    expect(inTheSecond).toBeLessThanOrEqual(8);
    expect(inTheSecond).toBeGreaterThan(0);
  });

  it("rides out a single failed poll rather than losing the lesson", async () => {
    // The parse carries on server-side whatever happens to one request, so
    // a blip from a cold-started proxy used to lose a lesson that finished.
    const poll = vi
      .spyOn(contentApi, "parseRun")
      .mockRejectedValueOnce(new Error("502"))
      .mockResolvedValue(
        run({ status: "completed", finished: true, segmentCount: 3 }),
      );

    const promise = awaitParseRun("run-1");
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promise).resolves.toMatchObject({ segmentCount: 3 });
    expect(poll.mock.calls.length).toBeGreaterThan(1);
  });

  it("gives up when the requests keep failing", async () => {
    // Three consecutive failures is an outage rather than traffic, and the
    // caller needs to hear about it.
    vi.spyOn(contentApi, "parseRun").mockRejectedValue(new Error("down"));

    const promise = awaitParseRun("run-1");
    const settled = promise.then(
      () => "resolved",
      (e: Error) => e.message,
    );
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(settled).resolves.toBe("down");
  });

  it("still has a ceiling, past the backend's own", async () => {
    // The backend marks a run failed at thirty minutes. This exists so a
    // page cannot poll a dead socket for ever - never to judge the work.
    vi.spyOn(contentApi, "parseRun").mockResolvedValue(run());

    const promise = awaitParseRun("run-1");
    const settled = promise.then(
      () => "resolved",
      (e: Error) => e.message,
    );
    await vi.advanceTimersByTimeAsync(40 * 60 * 1000);

    await expect(settled).resolves.toMatch(/had not finished after 35 minutes/);
  });
});
