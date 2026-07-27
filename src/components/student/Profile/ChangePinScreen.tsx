"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PinCreationScreen } from "@/components/student/Onboarding/PinCreationScreen";

const PROFILE_HREF = "/student/profile";

/**
 * Change PIN (Profile & Settings → "Change PIN"). The product frames reuse the
 * PIN-creation pattern wholesale (`Nevo Student App` changepin view = the PIN
 * Frame + a 44×44 back chevron), so this wraps `PinCreationScreen` and returns
 * to Profile on completion or via the chevron. TODO(api): persist the new PIN
 * via the auth client once the contract lands.
 */
export function ChangePinScreen() {
  const router = useRouter();
  const back = () => router.push(PROFILE_HREF);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Back"
        onClick={back}
        className="absolute top-4 left-4 z-20 flex size-11 cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/[0.06] active:bg-nevo-near-black/[0.12]"
      >
        <ChevronLeft className="size-6 text-nevo-near-black" strokeWidth={2} />
      </button>
      <PinCreationScreen onComplete={back} />
    </div>
  );
}
