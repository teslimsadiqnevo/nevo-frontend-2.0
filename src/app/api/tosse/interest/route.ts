/**
 * Same-origin proxy for the TOSSE founding-partner interest endpoint
 * (SCRUM-117).
 *
 * The event page posts here; this forwards server-side to the backend's
 * `POST /api/tosse/interest`. Proxying keeps the browser call same-origin -
 * the backend exposes no CORS headers, so a direct browser POST preflights and
 * 405s. It also means the URL the page calls is exactly the one SCRUM-117
 * names, with no CORS work needed on Teslim's side before the event.
 *
 * Mirrors `app/api/partner-inquiries`, the proxy the public landing form
 * already uses for the same reason.
 */
const UPSTREAM =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "https://api.nevolearning.com";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/api/tosse/interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // The Render dyno can cold-start; give it room rather than failing a lead
      // captured at the booth.
      signal: AbortSignal.timeout(60_000),
    });
    const payload = await upstream.json().catch(() => null);
    return Response.json(payload, { status: upstream.status });
  } catch {
    return Response.json(
      { detail: "The interest service is unreachable right now." },
      { status: 502 },
    );
  }
}
