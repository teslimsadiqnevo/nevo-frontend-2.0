import Image from "next/image";
import { PauseCircle } from "lucide-react";

/**
 * Account on pause (`Account On Pause` frame).
 *
 * Shown at sign-in, in place of the normal login flow, when a child's PIN was
 * RIGHT and the account is not open. Until backend could tell those apart, this
 * child typed a correct PIN and was told "That PIN didn't match" - so they tried
 * again, and again, and then asked an adult why they had been locked out of
 * their own account. Backend now answers 401 `account_paused` once the
 * credential itself verifies.
 *
 * IT NAMES NO REASON, AND MUST NOT. Backend deliberately sends no cause, no who
 * paused it and no resume date, and we would not want them: a parent withdrawing
 * consent, a safeguarding hold and an unpaid invoice are not things to explain
 * to a child on a login screen. The frame agrees - two sentences, and the second
 * points at a person rather than a process.
 *
 * NO BUTTON, also from the frame. There is nothing here a child can do, and
 * offering an action that cannot work would be worse than offering none. The
 * way back is a teacher.
 *
 * This is the SIGN-IN context only. A child whose account is paused while they
 * are mid-lesson takes a different path (a 401 on their next read), and design
 * has not drawn that one - see docs/BUILD_STATUS.md.
 */
export function AccountOnPauseScreen() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-9 text-center text-nevo-near-black">
      <Image
        src="/brand/nevo-wordmark.png"
        alt="Nevo"
        width={344}
        height={116}
        priority
        className="mb-9 h-5 w-auto"
      />

      <span className="flex size-16 items-center justify-center rounded-full bg-nevo-violet/22 text-nevo-navy">
        <PauseCircle className="size-7" strokeWidth={1.9} />
      </span>

      <h1 className="mt-6 max-w-[320px] text-[22px] leading-[1.3] font-semibold tracking-[-0.01em] text-balance sm:text-2xl">
        Your Nevo account is on pause.
      </h1>
      <p className="mt-2.5 max-w-[320px] text-[15px] leading-[1.55] text-nevo-near-black/70 sm:text-base">
        If you have questions, talk to your teacher.
      </p>
    </main>
  );
}
