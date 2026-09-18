import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("./client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./client")>();
  return { ...actual, api: { ...actual.api, post } };
});

import { contentApi } from "./content";
import { uploadsApi } from "./uploads";

/**
 * The subject actually reaching the wire.
 *
 * Every screen above this mocks the wrapper, so the body it builds is the one
 * thing no component test can see - and a mutation run proved exactly that:
 * deleting the `append` here killed nothing until this file existed. Both
 * upload routes take `subject` as an optional multipart field, and the whole
 * point of the field is the library filter on the other side of it.
 */

const bodyOf = (call: unknown[]): FormData => call[1] as FormData;

const file = () => new File(["x"], "lesson.pdf", { type: "application/pdf" });

beforeEach(() => {
  post.mockReset().mockResolvedValue({});
});

describe("a single lesson", () => {
  it("carries the subject when the teacher chose one", async () => {
    await contentApi.upload(file(), "Chemistry");

    expect(bodyOf(post.mock.calls[0]).get("subject")).toBe("Chemistry");
    expect(bodyOf(post.mock.calls[0]).get("file")).toBeInstanceOf(File);
  });

  it("sends no subject field at all when they did not", async () => {
    // Optional on the contract. An empty string is a value, and a lesson
    // labelled with one would sit in the library under a nameless pill.
    await contentApi.upload(file());

    expect(bodyOf(post.mock.calls[0]).has("subject")).toBe(false);
  });

  it("treats an empty choice as no choice", async () => {
    await contentApi.upload(file(), "");

    expect(bodyOf(post.mock.calls[0]).has("subject")).toBe(false);
  });
});

describe("a staged unit", () => {
  it("carries the subject beside the scope", async () => {
    await uploadsApi.create(file(), "unit", "Mathematics");

    const body = bodyOf(post.mock.calls[0]);
    expect(body.get("scope")).toBe("unit");
    expect(body.get("subject")).toBe("Mathematics");
  });

  it("sends no subject field when there is none", async () => {
    await uploadsApi.create(file(), "unit");

    expect(bodyOf(post.mock.calls[0]).has("subject")).toBe(false);
  });
});
