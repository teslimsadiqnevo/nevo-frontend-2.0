import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const { uploadProfilePhoto } = vi.hoisted(() => ({
  uploadProfilePhoto: vi.fn(),
}));
vi.mock("@/lib/api/users", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/users")>();
  return {
    ...actual,
    usersApi: { ...actual.usersApi, uploadProfilePhoto },
  };
});

import {
  publishIdentity,
  useCurrentUser,
  uploadPhoto,
} from "./useCurrentUser";
import { clearSession, setSession } from "@/lib/auth/session";
import type { CurrentUser } from "@/lib/api/users";

/**
 * A teacher's own photo, from the wire to every disc that shows it.
 *
 * TWO DEFECTS ARE GUARDED HERE, and the first one has now happened four times
 * in this codebase: `profileImageUrl` is REQUIRED on `CurrentUserResponse` and
 * was absent from the client type, so the field arrived and was dropped before
 * any screen could ask for it. A mapping test is the cheap guard against the
 * fifth time.
 *
 * The second is the split: upload without publishing and the profile screen
 * shows the new photo while the sidebar keeps the old initials until a
 * reload. That is why the upload and the publish are one function.
 */

const USER = {
  userId: "u-1",
  role: "teacher",
  firstName: "Amina",
  lastName: "Bello",
  displayName: "Amina Bello",
  email: "amina@school.test",
  school: null,
  subjects: ["Mathematics"],
  profileImageUrl: "https://example.test/old.jpg",
} as CurrentUser;

beforeEach(() => {
  uploadProfilePhoto.mockReset();
  clearSession();
  window.localStorage.clear();
  setSession({
    token: "tok",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    userId: "u-1",
    role: "teacher",
  });
  publishIdentity(USER);
});

describe("the photo on the identity", () => {
  it("survives the mapping from the wire", async () => {
    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() =>
      expect(result.current?.photoUrl).toBe("https://example.test/old.jpg"),
    );
  });

  it("is null, not undefined, for a teacher who has not set one", async () => {
    publishIdentity({ ...USER, profileImageUrl: null });
    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current?.photoUrl).toBeNull());
  });

  it("reaches every mounted avatar the moment an upload lands", async () => {
    // The sidebar renders one of these discs on every screen. This is the
    // assertion that stops it keeping the old photo until a reload.
    uploadProfilePhoto.mockResolvedValue({
      profileImageUrl: "https://example.test/new.jpg",
    });
    const { result } = renderHook(() => useCurrentUser());
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      const url = await uploadPhoto(new File(["x"], "me.png"));
      expect(url).toBe("https://example.test/new.jpg");
    });

    await waitFor(() =>
      expect(result.current?.photoUrl).toBe("https://example.test/new.jpg"),
    );
  });

  it("keeps everything else the identity knows", async () => {
    uploadProfilePhoto.mockResolvedValue({
      profileImageUrl: "https://example.test/new.jpg",
    });
    const { result } = renderHook(() => useCurrentUser());
    await waitFor(() => expect(result.current?.name).toBe("Amina Bello"));

    await act(async () => {
      await uploadPhoto(new File(["x"], "me.png"));
    });

    await waitFor(() => expect(result.current?.name).toBe("Amina Bello"));
    expect(result.current?.subjects).toEqual(["Mathematics"]);
    expect(result.current?.email).toBe("amina@school.test");
  });

  it("changes nothing when the upload fails", async () => {
    uploadProfilePhoto.mockRejectedValue(new Error("413"));
    const { result } = renderHook(() => useCurrentUser());
    await waitFor(() => expect(result.current).not.toBeNull());

    let url: string | null = "unset";
    await act(async () => {
      url = await uploadPhoto(new File(["x"], "me.png"));
    });

    expect(url).toBeNull();
    expect(result.current?.photoUrl).toBe("https://example.test/old.jpg");
  });
});
