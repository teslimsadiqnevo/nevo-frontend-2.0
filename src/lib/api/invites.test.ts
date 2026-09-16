import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("./client", () => ({ api: { post, get: vi.fn(), patch: vi.fn() } }));

import { invitesApi } from "./invites";

/**
 * Redeeming an invitation is the only account creation a child does without a
 * school code, and until 16 Sep it left them holding nothing.
 *
 * Backend put `session` on the 201 and this module's return type did not
 * mention it, so it was erased before any caller could read it - the same
 * shape that dropped `note` off `Assignment`. A field the server writes and
 * the client's type omits is invisible in a diff and invisible at runtime, so
 * the property worth pinning is that the response arrives whole.
 */

beforeEach(() => {
  post.mockReset();
});

describe("acceptJoin", () => {
  it("carries the session the server issues, rather than dropping it", async () => {
    post.mockResolvedValue({
      userId: "u-1",
      role: "student",
      loginIdentifier: "amara.k",
      consentStatus: "confirmed",
      session: {
        accessToken: "tok",
        tokenType: "bearer",
        expiresAt: "2026-09-17T10:00:00Z",
        userId: "u-1",
        role: "student",
      },
    });

    const res = await invitesApi.acceptJoin("t-1", { pin: "1234" });

    expect(res.session?.accessToken).toBe("tok");
    expect(res.session?.userId).toBe("u-1");
    expect(res.consentStatus).toBe("confirmed");
  });

  it("survives a deployment that sends neither", async () => {
    // Both are absent from the schema's `required` list, so a caller that
    // reads `res.session.accessToken` unguarded throws against an older
    // backend. Nothing here may assume they arrive.
    post.mockResolvedValue({
      userId: "u-1",
      role: "student",
      loginIdentifier: null,
    });

    const res = await invitesApi.acceptJoin("t-1", { pin: "1234" });

    expect(res.session ?? null).toBeNull();
    expect(res.userId).toBe("u-1");
  });

  it("posts to the join endpoint with the payload it was given", async () => {
    post.mockResolvedValue({ userId: "u-1", role: "student", loginIdentifier: null });

    await invitesApi.acceptJoin("t-1", { pin: "1234", firstName: "Amara" });

    expect(post).toHaveBeenCalledWith("/api/v1/join/t-1/accept", {
      pin: "1234",
      firstName: "Amara",
    });
  });
});
