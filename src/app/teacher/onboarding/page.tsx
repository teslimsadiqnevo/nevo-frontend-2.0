import { redirect } from "next/navigation";

/**
 * C01's invite landing lives at `/auth/teacher/activate`, which is the one
 * that works: it reads the invite token off the URL and posts it to
 * `POST /api/v1/admin/team/invitations/accept`.
 *
 * This route used to render a 288-line simulation of that flow which made NO
 * network calls at all. It told the teacher an email had been sent to a named
 * address and ran a "Waiting for verification..." spinner that resolved on a
 * 2.8s timer; announced "You're in. Here's what you're teaching:" over three
 * fixture classes and 89 invented students, to anyone who opened the URL; took
 * a name and subject chips that were never posted anywhere; and ended by
 * writing a token-less session whose `nevo.role=teacher` cookie satisfied the
 * route guard - so walking this pre-auth page granted the console shell.
 *
 * It is kept as a redirect rather than deleted because invite emails already
 * in inboxes may point here. The token and address are carried across so an
 * old link still lands on the real form.
 */
export default async function TeacherOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const carry = new URLSearchParams();
  for (const key of ["token", "email"]) {
    const value = params[key];
    if (typeof value === "string" && value) carry.set(key, value);
  }
  const query = carry.toString();
  redirect(`/auth/teacher/activate${query ? `?${query}` : ""}`);
}
