/**
 * Single source of truth for the public origin.
 *
 * `metadataBase` resolves every relative OG/Twitter image and canonical URL
 * against this. It previously fell back to localhost, which shipped
 * `og:image = http://localhost:3000/...` to production and broke every social
 * unfurl - so the fallback is now the real origin and localhost is opt-in.
 * Set NEXT_PUBLIC_SITE_URL per environment (it is read at build time).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nevolearning.com";

export const SITE_NAME = "Nevo";

/** Product surfaces that must never be indexed. */
export const PRIVATE_PATHS = [
  "/teacher",
  "/student",
  "/admin",
  "/auth",
  "/api",
  "/dev",
];
