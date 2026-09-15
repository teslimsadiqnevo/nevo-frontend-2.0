import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * A repeated query parameter, which the client could not express.
 *
 * `String(["a","b"])` is "a,b", so an array used to leave as ONE comma-joined
 * value. `GET /api/admin/adaptation-log?eventType=` documents "repeat the
 * parameter to pass more than one", and FastAPI reads repeats — never a joined
 * string. So the type filter would have silently filtered on nothing.
 */

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => ({}),
    text: async () => "{}",
  });
  vi.stubGlobal("fetch", fetchMock);
});

const urlOf = () => String(fetchMock.mock.calls[0][0]);

describe("array query params", () => {
  it("repeats the key once per value", async () => {
    const { api } = await import("./client");
    await api.get("/api/admin/adaptation-log", {
      params: { eventType: ["simplify_trigger", "break_suggested"] },
    });
    const url = new URL(urlOf());
    expect(url.searchParams.getAll("eventType")).toEqual([
      "simplify_trigger",
      "break_suggested",
    ]);
  });

  it("never sends a comma-joined value", async () => {
    const { api } = await import("./client");
    await api.get("/api/admin/adaptation-log", {
      params: { eventType: ["a", "b"] },
    });
    expect(urlOf()).not.toMatch(/eventType=a%2Cb|eventType=a,b/);
  });

  it("sends nothing at all for an empty array", async () => {
    // "No filter" and "filter on nothing" are different requests, and the
    // second returns nothing on a screen that meant to show everything.
    const { api } = await import("./client");
    await api.get("/api/admin/adaptation-log", { params: { eventType: [] } });
    expect(new URL(urlOf()).searchParams.has("eventType")).toBe(false);
  });

  it("leaves a single value exactly as it was", async () => {
    const { api } = await import("./client");
    await api.get("/api/admin/adaptation-log", { params: { classId: "c1" } });
    expect(new URL(urlOf()).searchParams.get("classId")).toBe("c1");
  });
});
