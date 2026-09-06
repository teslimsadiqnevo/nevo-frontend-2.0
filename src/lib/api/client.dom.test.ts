import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionExpiredDoor } from "./client";

const clearSession = vi.fn();
const getSession = vi.fn(() => ({
  token: "tok-live",
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  userId: "user-1",
  role: "teacher",
}));

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    clearSession: () => clearSession(),
    getSession: () => getSession(),
    getToken: () => "tok-live",
  };
});

/**
 * The auth latch in `client.ts` - one dead token, one redirect.
 *
 * THE BUG IT FIXED. A console screen has several reads in flight at once, so
 * an expired token comes back 401 on all of them together. Without the latch
 * the first call read the role and left for the right door; every later one
 * found the session ALREADY CLEARED, resolved no role, and re-assigned to the
 * student screen - last write winning. A teacher was reliably sent to a
 * child's session-expired page by a race, not by anything about their session.
 *
 * HOW THIS IS OBSERVED. Not through `window.location`: jsdom 30 makes
 * `location.assign` non-configurable, so it can be neither replaced (which
 * hangs the worker for 60s) nor spied on ("Cannot redefine property"). The two
 * halves are checked separately instead - the destination through the pure
 * `sessionExpiredDoor`, and the once-only guarantee by counting `clearSession`,
 * which sits behind the same latch and runs immediately before the redirect.
 *
 * `redirecting` is module-level and latches forever by design, so each test
 * resets the module registry. Without that the first test to trip it would
 * silence the rest - and they would PASS, which is the worst way to be wrong.
 */

function respondWith(status: number) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ detail: "nope" }), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
}

async function freshClient() {
  vi.resetModules();
  return import("./client");
}

beforeEach(() => {
  clearSession.mockClear();
  getSession.mockClear();
});

describe("sessionExpiredDoor", () => {
  it("sends a teacher to the teacher door", () => {
    expect(sessionExpiredDoor("teacher")).toBe("/auth/teacher/session-expired");
  });

  it("sends both admin roles to the admin door", () => {
    // The backend has no plain "admin" - only these two, and a comparison
    // against "admin" would silently send a SENCo to the child's screen.
    expect(sessionExpiredDoor("senco_admin")).toBe("/auth/admin/session-expired");
    expect(sessionExpiredDoor("other_admin")).toBe("/auth/admin/session-expired");
  });

  it("sends a student, and anyone unknown, to the shared door", () => {
    expect(sessionExpiredDoor("student")).toBe("/auth/session-expired");
    expect(sessionExpiredDoor(undefined)).toBe("/auth/session-expired");
    expect(sessionExpiredDoor("admin")).toBe("/auth/session-expired");
  });
});

describe("the auth latch", () => {
  it("acts once when several reads 401 together", async () => {
    // The regression test: four concurrent reads, as a console screen makes.
    vi.stubGlobal("fetch", respondWith(401));
    const { api } = await freshClient();

    await Promise.allSettled([
      api.get("/api/v1/classes"),
      api.get("/api/v1/lessons"),
      api.get("/api/v1/insights"),
      api.get("/api/v1/teachers/me/home"),
    ]);

    // Without the latch this ran four times, and the last three resolved no
    // role because the first had already cleared the session.
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it("reads the role while it is still known", async () => {
    vi.stubGlobal("fetch", respondWith(401));
    const { api } = await freshClient();
    await expect(api.get("/api/v1/classes")).rejects.toThrow();

    // The ordering that makes the destination right: the role must be read
    // BEFORE the session is cleared, and it is the only moment it is known.
    expect(getSession).toHaveBeenCalled();
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it("lets sign-in own its own failure", async () => {
    // A wrong password must surface the sign-in screen's message, not bounce
    // the visitor to a session-expired page they never had a session for.
    vi.stubGlobal("fetch", respondWith(401));
    const { api } = await freshClient();
    await expect(
      api.post("/api/v1/auth/login/password", { email: "a@b.c", password: "x" }),
    ).rejects.toThrow();

    expect(clearSession).not.toHaveBeenCalled();
  });

  it("does not treat a 403 as a dead session", async () => {
    // A 403 means the token was accepted and the ACTION was refused - a scope
    // this admin does not hold. It used to be handled identically to 401, so a
    // roster-only admin opening a bookmarked /admin/team was signed out and
    // told their session had ended "for your security". Scope filtering is
    // client-side only, so deep links reach 403-able endpoints routinely.
    vi.stubGlobal("fetch", respondWith(403));
    const { api } = await freshClient();

    await expect(api.get("/api/v1/admin/team")).rejects.toMatchObject({
      status: 403,
    });
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("still ends the session on a 401 after a 403 has been seen", async () => {
    // The two must not share the latch: a refused action earlier in the page
    // must not stop a genuinely dead token from signing the admin out.
    vi.stubGlobal("fetch", respondWith(403));
    const { api } = await freshClient();
    await expect(api.get("/api/v1/admin/team")).rejects.toMatchObject({
      status: 403,
    });
    expect(clearSession).not.toHaveBeenCalled();

    vi.stubGlobal("fetch", respondWith(401));
    await expect(api.get("/api/v1/admin/students")).rejects.toMatchObject({
      status: 401,
    });
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it("says a different thing for a refused action than for a dead token", async () => {
    const messageOf = async (run: Promise<unknown>): Promise<string> => {
      try {
        await run;
        throw new Error("expected the request to reject");
      } catch (e) {
        return (e as Error).message;
      }
    };

    vi.stubGlobal("fetch", respondWith(403));
    const { api } = await freshClient();
    const refused = await messageOf(api.get("/api/v1/admin/team"));

    vi.stubGlobal("fetch", respondWith(401));
    const dead = await messageOf(api.get("/api/v1/admin/students"));

    expect(refused).not.toBe(dead);
    expect(dead).toMatch(/sign in again/i);
    expect(refused).toMatch(/don't have access/i);
  });

  it("does not treat a 500 as a dead session", async () => {
    vi.stubGlobal("fetch", respondWith(500));
    const { api } = await freshClient();
    await expect(api.get("/api/v1/classes")).rejects.toThrow();

    expect(clearSession).not.toHaveBeenCalled();
  });
});
