/**
 * Rotate Prompt (`Nevo Rotate Prompt` frame) - the portrait-lock overlay (v1).
 * Flow reference 30: "Portrait only (v1) - calm rotate prompt if held landscape."
 *
 * Pure CSS: hidden by default, shown only when a coarse-pointer (touch) device
 * is held landscape - a desktop with a mouse never sees it, whatever its aspect.
 * Calm, no error framing; content resumes untouched underneath when rotated back.
 */
export function RotatePrompt() {
  return (
    <div
      role="status"
      className="fixed inset-0 z-[100] hidden flex-col items-center justify-center bg-nevo-cream px-10 text-center text-nevo-near-black md:px-14 [@media(orientation:landscape)_and_(pointer:coarse)]:flex"
    >
      <span className="flex size-[150px] shrink-0 items-center justify-center rounded-[28px] bg-nevo-cream-elevated shadow-[0_8px_32px_rgba(0,0,0,0.10)] md:size-[184px]">
        <svg
          width="92"
          height="92"
          viewBox="0 0 120 120"
          fill="none"
          role="img"
          aria-label="Rotate your tablet upright"
        >
          <g
            stroke="#9a9ccb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 60 A40 40 0 0 1 52 22" />
            <path d="M52 22 l-11 0 M52 22 l0 11" />
          </g>
          <rect
            x="45"
            y="33"
            width="30"
            height="54"
            rx="7"
            stroke="#3b3f6e"
            strokeWidth="3"
            fill="#f7f1e6"
          />
          <circle cx="60" cy="39.5" r="1.6" fill="#3b3f6e" />
          <rect
            x="53"
            y="80"
            width="14"
            height="3"
            rx="1.5"
            fill="rgba(43,43,47,0.4)"
          />
        </svg>
      </span>
      <h2 className="mt-6 text-xl font-semibold tracking-[-0.01em] md:mt-7 md:text-2xl">
        Turn your tablet upright
      </h2>
      <p className="mt-3 max-w-[280px] text-[15px] leading-[1.55] text-nevo-near-black/66 md:max-w-[360px] md:text-[17px]">
        Nevo is designed to stand tall. Rotate your tablet and we&apos;ll pick up
        right where you were.
      </p>
    </div>
  );
}
