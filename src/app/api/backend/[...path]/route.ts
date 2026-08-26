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

/**
 * Upstream routes declared with a trailing slash. FastAPI answers the
 * slashless form with a 307 to the canonical one; `fetch` follows it, so calls
 * work either way - at the cost of an extra upstream round trip on a
 * cold-start-prone host. Next normalises the trailing slash out of the request
 * before this handler runs (`trailingSlash: false`), so the client cannot
 * express the intent and the canonical form has to be restored here.
 */
const SLASH_REQUIRED = new Set(["api/v1/ask-nevo", "api/signals"]);

function upstreamPath(segments: string[]): string {
  const joined = segments.join("/");
  return SLASH_REQUIRED.has(joined) ? `${joined}/` : joined;
}

async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const url = new URL(`${UPSTREAM}/${upstreamPath(path)}`);
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
