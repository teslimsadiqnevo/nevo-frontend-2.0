import type { NextConfig } from "next";

// Origins (LAN IPs / hostnames) allowed to reach the dev server cross-origin —
// e.g. a phone testing over Wi-Fi. Next blocks dev-only assets to other origins
// by default, which leaves the page rendered but un-hydrated. Set
// ALLOWED_DEV_ORIGINS in `.env.local` as a comma-separated list; unset means
// localhost-only (the default). Dev-only — no effect on a production build.
const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
};

export default nextConfig;
