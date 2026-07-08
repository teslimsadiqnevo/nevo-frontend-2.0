/**
 * Entry point / redirect logic (FE Arch §2):
 * - Not authenticated → show landing page or redirect to /auth/login
 * - Authenticated → check role and redirect to the matching dashboard
 *   (/student/dashboard, /teacher/dashboard, /admin/dashboard)
 * - SSO schools enter via a school-specific URL (Product Arch A.2, Path A),
 *   with first-use detection routing new students into onboarding
 *
 * TODO(auth): implement once the session/auth contract with the FastAPI
 * backend is decided (see proxy.ts task). Placeholder brand screen until then.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-md bg-nevo-cream text-nevo-near-black">
      <h1 className="font-brand text-4xl font-semibold text-nevo-navy">Nevo</h1>
      <p className="text-sm text-nevo-near-black/70">Let&apos;s get you learning</p>
    </main>
  );
}
