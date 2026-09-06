import { describe, expect, it } from "vitest";
import {
  clearSession,
  getRememberedProfile,
  getSession,
  getToken,
  rememberProfile,
  setSession,
} from "./session";

/**
 * The session store decides who the app thinks you are, so its edges are
 * security-adjacent rather than merely functional. Two behaviours here fixed
 * real defects and are the reason this file is tested first:
 *
 *   - an EXPIRED session must read as no session. It is held in localStorage,
 *     which the server never sees and which survives indefinitely, so the
 *     expiry check is the only thing standing between a stale token and a
 *     console rendering someone's roster.
 *   - the remembered profile must survive `clearSession`. Signing out is not
 *     forgetting the device: the child's next sign-in shows their name and
 *     avatar, and clearing it would strand them at a login screen that no
 *     longer knows who they are.
 */

const future = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 60 * 1000).toISOString();

const session = (expiresAt: string) => ({
  token: "tok-abc",
  expiresAt,
  userId: "user-1",
  role: "teacher",
});

describe("session store", () => {
  it("returns a stored session that has not expired", () => {
    setSession(session(future()));
    expect(getSession()?.token).toBe("tok-abc");
    expect(getToken()).toBe("tok-abc");
  });

  it("treats an expired session as no session at all", () => {
    setSession(session(past()));
    expect(getSession()).toBeNull();
    expect(getToken()).toBeUndefined();
  });

  it("clears an expired session from storage rather than leaving it to be re-read", () => {
    setSession(session(past()));
    getSession();
    // Reading it again must not resurrect it, and nothing should remain for a
    // later reader to find.
    expect(getSession()).toBeNull();
    const raw = Object.keys(window.localStorage).some((k) =>
      (window.localStorage.getItem(k) ?? "").includes("tok-abc"),
    );
    expect(raw).toBe(false);
  });

  it("forgets the session on sign-out", () => {
    setSession(session(future()));
    clearSession();
    expect(getSession()).toBeNull();
    expect(getToken()).toBeUndefined();
  });

  it("keeps the remembered device profile across sign-out", () => {
    rememberProfile({
      schoolCode: "NEVO-BGA4827",
      loginIdentifier: "amara.k7",
      displayName: "Amara",
      initials: "AK",
    });
    setSession(session(future()));
    clearSession();

    // Signing out is not forgetting the device.
    expect(getRememberedProfile()).toEqual({
      schoolCode: "NEVO-BGA4827",
      loginIdentifier: "amara.k7",
      displayName: "Amara",
      initials: "AK",
    });
  });

  it("reports no remembered profile on a device that has none", () => {
    expect(getRememberedProfile()).toBeNull();
  });

  it("survives unreadable storage rather than throwing into a render", () => {
    // A corrupted value is not hypothetical: this is localStorage, and a half
    // written entry or a value from an older shape both land here. Returning
    // null lets the app route to sign-in; throwing would take a screen down.
    window.localStorage.setItem("nevo.auth.session", "{not json");
    expect(() => getSession()).not.toThrow();
    expect(getSession()).toBeNull();
  });
});
