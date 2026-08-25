"use client";

import { useRouter } from "next/navigation";

/**
 * Student-scoped error boundary. Without one, a stumble anywhere outside the
 * lesson player fell through to the app-wide screen, which unmounts the whole
 * shell and drops the student out of their app. Calm, plain words, nothing
 * technical, and never their fault.
 */
export default function StudentError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-8 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-nevo-violet/24 text-nevo-navy">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
      </span>
      <h2 className="mt-6 text-[21px] font-semibold tracking-[-0.01em] text-nevo-near-black">
        This bit got stuck
      </h2>
      <p className="mt-2.5 max-w-[300px] text-[15px] leading-[1.55] text-nevo-near-black/70">
        That&rsquo;s on us, not you. Have another go, or head back home.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-7 h-12 w-full max-w-[280px] cursor-pointer rounded-[10px] bg-nevo-navy text-base font-semibold text-nevo-cream transition-[filter,transform] hover:brightness-109 active:scale-[0.985]"
      >
        Try again
      </button>
      <button
        type="button"
        onClick={() => router.push("/student/dashboard")}
        className="mt-2 h-11 w-full max-w-[280px] cursor-pointer rounded-[10px] text-[15px] font-medium text-nevo-navy transition-[background-color,transform] hover:bg-nevo-navy/6 active:scale-[0.985]"
      >
        Back home
      </button>
    </div>
  );
}
