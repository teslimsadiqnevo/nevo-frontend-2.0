/**
 * Same-origin catch-all proxy to the FastAPI backend.
 *
 * The backend exposes no CORS headers (browser preflights 405), so every
 * browser-side call goes through here: `/api/backend/<path>` forwards to
 * `<UPSTREAM>/<path>` with the method, JSON body and Authorization header
 * intact. Auth is Bearer-token (no cookies), so nothing else needs rewriting.
 * Remove in favour of direct calls if/when the backend grows CORSMiddleware.
 */
import type { NextRequest } from "next/server";

const UPSTREAM =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "https://nevo-backend-2-0.onrender.com";

async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const url = new URL(`${UPSTREAM}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) =>
    url.searchParams.set(key, value),
  );

  const headers: Record<string, string> = {};
  const auth = request.headers.get("authorization");
  if (auth) headers.Authorization = auth;
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: body || undefined,
      // Render's free tier cold-starts; give it room rather than failing.
      signal: AbortSignal.timeout(60_000),
    });
    if (upstream.status === 204) return new Response(null, { status: 204 });
    const payload = await upstream.text();
    return new Response(payload, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { detail: "The backend is unreachable right now." },
      { status: 502 },
    );
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
};
