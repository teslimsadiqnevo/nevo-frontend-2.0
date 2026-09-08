import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { ApiError } from "@/lib/api/client";
import { SignUpStep } from "./SignUpStep";

/**
 * The inverse of every other defect in this audit: a write that DID happen,
 * reported as one that never did.
 *
 * Registration and sign-in are two round trips and sat in one promise chain
 * under one `.catch`. Register succeeds, the login times out, and the
 * proprietor reads "nothing has been created yet" - while their school and
 * their own admin account both exist. Pressing Continue again registers a
 * SECOND time and returns "this email is already set up with a school", which
 * reads as their mistake on a school they successfully made.
 */

const register = vi.fn();
const loginPassword = vi.fn();

vi.mock("@/lib/api/school", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/school")>();
  return {
    ...actual,
    schoolApi: { ...actual.schoolApi, register: (p: unknown) => register(p) },
  };
});

vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      loginPassword: (p: unknown) => loginPassword(p),
    },
  };
});

const CREATED = {
  schoolId: "sch1",
  adminId: "adm1",
  schoolCode: "BGA-4827",
};

const state = {
  schoolName: "Brightgate Academy",
  adminName: "Folake Adebayo",
  email: "f.adebayo@brightgate.edu.ng",
  authMethod: null,
  band: null,
};

function step(onDone = vi.fn()) {
  const view = render(
    <SignUpStep state={state} onChange={() => {}} onDone={onDone} />,
  );
  // Password and confirm are local state, so they have to be typed.
  const set = (id: string, value: string) => {
    const el = view.container.querySelector(`#${id}`) as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  set("ob-password", "a-long-enough-password");
  set("ob-confirm", "a-long-enough-password");
  return { ...view, onDone };
}

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));

describe("SignUpStep", () => {
  it("does not say nothing was created when the school was", async () => {
    register.mockResolvedValue(CREATED);
    loginPassword.mockRejectedValue(new Error("timeout"));

    const { container } = step();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled(),
    );
    submit();

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Brightgate Academy is created/),
    );
    // The sentence that was false.
    expect(visibleText(container)).not.toMatch(/nothing has been created yet/i);
    expect(visibleText(container)).toMatch(/Nothing needs creating again/i);
    // Proof it exists, and the thing they would need next.
    expect(visibleText(container)).toMatch(/BGA-4827/);
  });

  it("will not register a second school after the first one exists", async () => {
    register.mockResolvedValue(CREATED);
    loginPassword.mockRejectedValue(new Error("timeout"));

    step();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled(),
    );
    submit();

    const retry = await screen.findByRole("button", { name: "Try signing in" });
    loginPassword.mockRejectedValueOnce(new Error("timeout again"));
    fireEvent.click(retry);

    await waitFor(() => expect(loginPassword).toHaveBeenCalledTimes(2));
    // The whole point: one school, however many times they press.
    expect(register).toHaveBeenCalledTimes(1);
  });

  it("locks the fields once the school exists, so an edit cannot make a second", async () => {
    register.mockResolvedValue(CREATED);
    loginPassword.mockRejectedValue(new Error("timeout"));

    const { container } = step();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled(),
    );
    submit();

    await screen.findByRole("button", { name: "Try signing in" });
    expect(container.querySelector("#ob-school")).toHaveAttribute("readonly");
    expect(container.querySelector("#ob-email")).toHaveAttribute("readonly");
  });

  it("recovers when the retried sign-in works", async () => {
    register.mockResolvedValue(CREATED);
    loginPassword.mockRejectedValueOnce(new Error("timeout"));

    const { onDone } = step();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled(),
    );
    submit();

    const retry = await screen.findByRole("button", { name: "Try signing in" });
    loginPassword.mockResolvedValueOnce({ access_token: "t" });
    fireEvent.click(retry);

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(register).toHaveBeenCalledTimes(1);
  });

  it("still says nothing was created when REGISTRATION is what failed", async () => {
    register.mockRejectedValue(new Error("500"));

    const { container } = step();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled(),
    );
    submit();

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/nothing has been created yet/i),
    );
    expect(visibleText(container)).not.toMatch(/is created/);
    expect(loginPassword).not.toHaveBeenCalled();
    // And they can try again, because nothing exists to duplicate.
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("still offers sign-in on a duplicate email", async () => {
    register.mockRejectedValue(new ApiError(409, "already exists"));

    const { container } = step();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled(),
    );
    submit();

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/already set up with a school/i),
    );
    expect(visibleText(container)).not.toMatch(/is created/);
  });
});
