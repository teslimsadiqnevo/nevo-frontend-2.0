import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { AccountSettings } from "./AccountSettings";

/**
 * The name was withheld on the strength of a sentence that was not true.
 *
 * Both this file and `SettingsView` said `GET /api/v1/users/me` was "the only
 * route on the users resource - there is no write anywhere", and the screen
 * showed a note saying the app had no way to save a name. `PATCH
 * /api/v1/users/me` is live, takes `ProfilePatch {firstName, lastName,
 * subjects}`, and `usersApi.updateMe` has been typed and consumed by the
 * teacher console since 1 Sep.
 *
 * EMAIL genuinely is not writable - `ProfilePatch` has no field for it - so
 * that half of the note stays.
 */

const me = vi.fn();
const updateMe = vi.fn();

vi.mock("@/lib/api/users", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/users")>();
  return {
    ...actual,
    usersApi: { ...actual.usersApi, me: () => me(), updateMe: (p: unknown) => updateMe(p) },
  };
});
vi.mock("@/lib/api/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/permissions")>();
  return {
    ...actual,
    permissionsApi: { ...actual.permissionsApi, me: async () => ({ scopes: [] }) },
  };
});
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return {
    ...actual,
    authApi: { ...actual.authApi, sessions: async () => [] },
  };
});

const USER = {
  user_id: "u1",
  role: "other_admin",
  first_name: "Folake",
  last_name: "Adebayo",
  display_name: "Folake Adebayo",
  email: "f.adebayo@brightgate.edu.ng",
  school: null,
};

async function editFirstName(container: HTMLElement, value: string) {
  const input = await waitFor(() => {
    const els = container.querySelectorAll("input");
    if (els.length === 0) throw new Error("no inputs yet");
    return els[0] as HTMLInputElement;
  });
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("editing your own name", () => {
  it("offers the fields the endpoint actually accepts", async () => {
    me.mockResolvedValue(USER);
    const { container } = render(<AccountSettings />);

    await waitFor(() => expect(visibleText(container)).toMatch(/First name/));
    expect(visibleText(container)).toMatch(/Last name/);
    // The sentence that withheld them.
    expect(visibleText(container)).not.toMatch(/no way for the app to save/i);
  });

  it("saves through PATCH and reads the record back", async () => {
    me.mockResolvedValue(USER);
    updateMe.mockResolvedValue({ ...USER, first_name: "Folasade", display_name: "Folasade Adebayo" });

    const { container } = render(<AccountSettings />);
    await editFirstName(container, "Folasade");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateMe).toHaveBeenCalledTimes(1));
    expect(updateMe).toHaveBeenCalledWith({
      firstName: "Folasade",
      lastName: "Adebayo",
    });
    // The response is the authority on what was stored, not what we sent.
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Folasade Adebayo/),
    );
  });

  it("says nothing changed when the write is refused", async () => {
    me.mockResolvedValue(USER);
    updateMe.mockRejectedValue(new Error("500"));

    const { container } = render(<AccountSettings />);
    await editFirstName(container, "Folasade");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/didn't save, so nothing has changed/i),
    );
  });

  it("keeps saying email is not editable, because it is not", async () => {
    // `ProfilePatch` has no email field: it is an authentication identifier and
    // needs a verification flow rather than a silent change.
    me.mockResolvedValue(USER);
    const { container } = render(<AccountSettings />);

    await waitFor(() => expect(visibleText(container)).toMatch(/First name/));
    expect(visibleText(container)).toMatch(/email is changed by asking us/i);
  });

  it("will not save when nothing has been changed", async () => {
    me.mockResolvedValue(USER);
    render(<AccountSettings />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled(),
    );
  });
});
