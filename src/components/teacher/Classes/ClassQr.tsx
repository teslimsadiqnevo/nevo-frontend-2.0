"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * C12 QR / Quick Class Access - built to be read from across a room. The code
 * is high-contrast near-black on cream for reliable scanning and everything
 * else falls away.
 *
 * Two presentations, both designed: full-screen for projecting, and a focused
 * dialog over the console.
 *
 * The frame draws a decorative QR (a deterministic noise field). A code that
 * cannot be scanned defeats the whole screen, so this encodes a real join
 * link - the student join screen accepts the code from the query string, so
 * scanning lands them in the flow with it already filled.
 */

/** Near-black on cream, per the frame - not pure black. */
const QR_DARK = "#2b2b2f";
const QR_LIGHT = "#f7f1e6";

export const joinUrlFor = (code: string) =>
  `${SITE_URL}/student/onboarding/teacher-join?code=${encodeURIComponent(code)}`;

function QrSvg({ code, className }: { code: string; className?: string }) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    QRCode.toString(joinUrlFor(code), {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 0,
      color: { dark: QR_DARK, light: QR_LIGHT },
    })
      .then((s) => {
        if (alive) setSvg(s);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [code]);

  if (failed) {
    // Never leave a blank square on a projector - the spoken code still works.
    return (
      <span className="px-3 text-center text-[15px] leading-[1.5] text-nevo-near-black/60">
        {`Read out the code instead: ${code}`}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn("block size-full [&>svg]:size-full", className)}
      // qrcode's own SVG output; the input is our own join URL.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function CloseButton({
  onClose,
  variant,
}: {
  onClose: () => void;
  variant: "screen" | "dialog";
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className={cn(
        "absolute flex cursor-pointer items-center justify-center text-nevo-near-black/60 transition-colors",
        variant === "screen"
          ? "top-6 right-6 size-11 rounded-[11px] bg-nevo-cream-elevated hover:brightness-[0.97] xl:top-7 xl:right-7 xl:size-12 xl:rounded-xl"
          : "top-4 right-4 size-9 rounded-[9px] text-nevo-near-black/50 hover:bg-nevo-near-black/5",
      )}
    >
      <svg width={variant === "screen" ? 22 : 20} height={variant === "screen" ? 22 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={variant === "screen" ? "xl:size-6" : undefined}>
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

const CAPTION = "Have students scan this to join";

/** Full-screen projection view. */
export function ClassQrScreen({
  className,
  code,
  onClose,
}: {
  className: string;
  code: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-nevo-cream">
      <CloseButton onClose={onClose} variant="screen" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <h2 className="text-[34px] font-semibold tracking-[-0.02em] text-nevo-near-black xl:text-[40px]">
          {className}
        </h2>
        <div className="mt-[30px] flex size-[340px] items-center justify-center rounded-[20px] bg-nevo-cream p-5 shadow-[0_8px_32px_rgba(0,0,0,0.16)] xl:mt-9 xl:size-[360px] xl:p-6">
          <QrSvg code={code} />
        </div>
        <p className="mt-[30px] text-lg text-nevo-near-black/60 xl:mt-9 xl:text-xl">
          {CAPTION}
        </p>
        {/* The spoken fallback the join screen also accepts. */}
        <p className="mt-3 font-mono text-[15px] tracking-[0.18em] text-nevo-near-black/45">
          {code}
        </p>
      </div>
    </div>
  );
}

/** Focused dialog over the console. */
export function ClassQrDialog({
  className,
  code,
  onClose,
  onProject,
}: {
  className: string;
  code: string;
  onClose: () => void;
  onProject: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-nevo-near-black/30 p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Join code for ${className}`}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-[420px] flex-col items-center rounded-2xl bg-nevo-cream p-8 shadow-[0_8px_32px_rgba(0,0,0,0.16)] motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200 xl:max-w-[440px] xl:p-9"
      >
        <CloseButton onClose={onClose} variant="dialog" />
        <h2 className="text-2xl font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
          {className}
        </h2>
        <div className="mt-[22px] flex size-[250px] items-center justify-center rounded-2xl bg-nevo-cream p-4 outline outline-nevo-near-black/8 xl:mt-6 xl:size-[260px] xl:p-[18px]">
          <QrSvg code={code} />
        </div>
        <p className="mt-[22px] text-[15px] text-nevo-near-black/60 xl:mt-6 xl:text-base">
          {CAPTION}
        </p>
        <p className="mt-2 font-mono text-sm tracking-[0.18em] text-nevo-near-black/45">
          {code}
        </p>
        {/* Projection is the frame's other presentation - reachable, not a
            separate route, since it is the same code made room-sized. */}
        <button
          type="button"
          onClick={onProject}
          className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-nevo-navy/35 px-4 text-sm font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
          Show full screen
        </button>
      </div>
    </div>
  );
}
