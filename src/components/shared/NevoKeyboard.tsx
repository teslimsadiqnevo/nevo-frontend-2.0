"use client";

import { useState } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

export type KeyboardLayout = "qwerty" | "pad";

/**
 * Nevo Keyboard (design frame · "Nevo Keyboard") — the branded on-screen keyboard
 * used wherever the app suppresses the native OS keyboard on web (Product Arch
 * A.12): onboarding text entry, PIN, and the calc numeric answer. Two layouts —
 * `pad` (3×4 numeric) and `qwerty` — sized for mobile (default) and tablet (md+).
 *
 * Presentational only: it emits key presses; the host owns the field state, so
 * the same physical-keyboard path keeps working on desktop (where this is hidden).
 * Chrome tones (`#e4ddcc` tray, `#d8d0be` modifier keys) are keyboard-specific,
 * not DS surface tokens.
 */
export function NevoKeyboard({
  layout,
  onKey,
  onBackspace,
  onReturn,
  className,
}: {
  layout: KeyboardLayout;
  /** A character key was pressed (letter, digit, or " "). */
  onKey: (char: string) => void;
  onBackspace: () => void;
  /** The accent "return" key (qwerty only). */
  onReturn?: () => void;
  className?: string;
}) {
  // qwerty-only modes: capitalisation + a digits/symbols plane.
  const [caps, setCaps] = useState(true);
  const [numeric, setNumeric] = useState(false);

  return (
    <div
      role="group"
      aria-label="On-screen keyboard"
      // Keep the focused field focused when a key is tapped (the keys drive its
      // state directly), so a focus-gated keyboard doesn't dismiss itself.
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "flex shrink-0 flex-col border-t border-nevo-near-black/8 bg-[#e4ddcc] px-1.5 pt-1.5 pb-3 md:px-3 md:pt-3 md:pb-3.5 motion-safe:animate-nevo-kb-up",
        "gap-2.5 md:gap-[11px]",
        className,
      )}
    >
      {layout === "pad" ? (
        <PadLayout onKey={onKey} onBackspace={onBackspace} />
      ) : (
        <QwertyLayout
          caps={caps}
          numeric={numeric}
          onKey={onKey}
          onBackspace={onBackspace}
          onReturn={onReturn}
          onToggleCaps={() => setCaps((c) => !c)}
          onToggleNumeric={() => setNumeric((n) => !n)}
        />
      )}
    </div>
  );
}

/* ── shared key visuals ─────────────────────────────────────────────────── */

const KEY_BASE =
  "flex h-[42px] min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md shadow-[0_1px_1px_rgba(43,43,47,0.28)] text-nevo-near-black transition-transform select-none active:scale-95 md:h-[46px] md:rounded-lg";

/** A standard cream key. */
function Key({
  label,
  onClick,
  grow,
}: {
  label: string;
  onClick: () => void;
  grow?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={grow ? { flexGrow: grow } : undefined}
      className={cn(KEY_BASE, "bg-nevo-cream text-[20px] font-normal md:text-[22px]")}
    >
      {label}
    </button>
  );
}

/** A modifier key (⇧, 123/ABC, space) — `#d8d0be`, smaller label. */
function ModKey({
  label,
  onClick,
  grow,
  ariaLabel,
  children,
}: {
  label?: string;
  onClick: () => void;
  grow?: number;
  ariaLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={grow ? { flexGrow: grow } : undefined}
      className={cn(
        KEY_BASE,
        "bg-[#d8d0be] text-[13px] font-medium shadow-[0_1px_1px_rgba(43,43,47,0.22)] md:text-[15px]",
      )}
    >
      {children ?? label}
    </button>
  );
}

/** The navy accent key (return). */
function AccentKey({ label, onClick, grow }: { label: string; onClick: () => void; grow?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={grow ? { flexGrow: grow } : undefined}
      className={cn(KEY_BASE, "bg-nevo-navy text-[13px] font-medium text-nevo-cream md:text-[15px]")}
    >
      {label}
    </button>
  );
}

const ROW = "flex justify-center gap-1.5 md:gap-2";

/* ── pad (numeric) ──────────────────────────────────────────────────────── */

function PadLayout({
  onKey,
  onBackspace,
}: {
  onKey: (d: string) => void;
  onBackspace: () => void;
}) {
  const grid = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"],
  ];
  return (
    <div className="mx-auto grid w-full max-w-[420px] grid-cols-3 gap-1.5 md:gap-2">
      {grid.flat().map((d, i) => {
        if (d === "") return <span key={i} aria-hidden />;
        if (d === "⌫") {
          return (
            <button
              key={i}
              type="button"
              aria-label="Delete"
              onClick={onBackspace}
              className={cn(
                KEY_BASE,
                "bg-[#d8d0be] shadow-[0_1px_1px_rgba(43,43,47,0.22)]",
              )}
            >
              <Delete className="size-5" strokeWidth={2} />
            </button>
          );
        }
        return <Key key={i} label={d} onClick={() => onKey(d)} />;
      })}
    </div>
  );
}

/* ── qwerty ─────────────────────────────────────────────────────────────── */

const NUM_ROWS = [
  "1234567890".split(""),
  "-/:;()$&@".split(""),
  ".,?!'".split(""),
];

function QwertyLayout({
  caps,
  numeric,
  onKey,
  onBackspace,
  onReturn,
  onToggleCaps,
  onToggleNumeric,
}: {
  caps: boolean;
  numeric: boolean;
  onKey: (c: string) => void;
  onBackspace: () => void;
  onReturn?: () => void;
  onToggleCaps: () => void;
  onToggleNumeric: () => void;
}) {
  const emit = (c: string) => onKey(caps ? c.toUpperCase() : c.toLowerCase());

  const backspace = (
    <button
      type="button"
      aria-label="Delete"
      onClick={onBackspace}
      style={{ flexGrow: 1.5 }}
      className={cn(KEY_BASE, "bg-[#d8d0be] shadow-[0_1px_1px_rgba(43,43,47,0.22)]")}
    >
      <Delete className="size-5" strokeWidth={2} />
    </button>
  );

  if (numeric) {
    return (
      <>
        <div className={ROW}>
          {NUM_ROWS[0].map((c) => (
            <Key key={c} label={c} onClick={() => onKey(c)} />
          ))}
        </div>
        <div className={ROW}>
          {NUM_ROWS[1].map((c) => (
            <Key key={c} label={c} onClick={() => onKey(c)} />
          ))}
        </div>
        <div className={ROW}>
          <ModKey label="#+=" onClick={onToggleCaps} ariaLabel="More symbols" grow={1.5} />
          {NUM_ROWS[2].map((c) => (
            <Key key={c} label={c} onClick={() => onKey(c)} />
          ))}
          {backspace}
        </div>
        <div className={ROW}>
          <ModKey label="ABC" onClick={onToggleNumeric} grow={1.5} />
          <Key label="space" onClick={() => onKey(" ")} grow={5} />
          {onReturn && <AccentKey label="return" onClick={onReturn} grow={1.8} />}
        </div>
      </>
    );
  }

  const r1 = "QWERTYUIOP".split("");
  const r2 = "ASDFGHJKL".split("");
  const r3 = "ZXCVBNM".split("");
  const show = (c: string) => (caps ? c : c.toLowerCase());

  return (
    <>
      <div className={ROW}>
        {r1.map((c) => (
          <Key key={c} label={show(c)} onClick={() => emit(c)} />
        ))}
      </div>
      <div className={cn(ROW, "px-5")}>
        {r2.map((c) => (
          <Key key={c} label={show(c)} onClick={() => emit(c)} />
        ))}
      </div>
      <div className={ROW}>
        <ModKey
          onClick={onToggleCaps}
          grow={1.5}
          ariaLabel={caps ? "Lowercase" : "Uppercase"}
        >
          <span className={cn(!caps && "opacity-45")}>⇧</span>
        </ModKey>
        {r3.map((c) => (
          <Key key={c} label={show(c)} onClick={() => emit(c)} />
        ))}
        {backspace}
      </div>
      <div className={ROW}>
        <ModKey label="123" onClick={onToggleNumeric} grow={1.5} />
        <Key label="space" onClick={() => onKey(" ")} grow={5} />
        {onReturn && <AccentKey label="return" onClick={onReturn} grow={1.8} />}
      </div>
    </>
  );
}
