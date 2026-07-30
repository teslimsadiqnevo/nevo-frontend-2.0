"use client";

import { useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

export type KeyboardLayout = "qwerty" | "pad";
export type KeyboardComposer = "single" | "multi";

/** Handoff: dock the keyboard behind focus state, debouncing blur ~120ms. */
const BLUR_DEBOUNCE_MS = 120;

/**
 * Focus-gated docking for the Nevo Keyboard (frontend handoff §05): a field sets
 * the dock open on focus and closed on blur, with the blur debounced ~120ms so
 * momentary focus churn (e.g. a key tap racing the guard on some platforms)
 * doesn't dismiss the keyboard. Refocusing within the window cancels the close.
 */
export function useNevoKeyboardDock() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const onFocus = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const onBlur = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), BLUR_DEBOUNCE_MS);
  };
  const close = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(false);
  };

  return { open, onFocus, onBlur, close };
}

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
  composer,
  value,
  placeholder = "Type here",
  className,
}: {
  layout: KeyboardLayout;
  /** A character key was pressed (letter, digit, or " "). */
  onKey: (char: string) => void;
  onBackspace: () => void;
  /** The accent "return" key (qwerty only). In `multi` it inserts a newline. */
  onReturn?: () => void;
  /**
   * Attach a composer field above the tray (Nevo Keyboard frame) — for fields
   * the docked keyboard would cover, and `multi` for notes. Displays `value`.
   */
  composer?: KeyboardComposer;
  /** The host field's current text, mirrored in the composer. */
  value?: string;
  /** Composer placeholder while `value` is empty. */
  placeholder?: string;
  className?: string;
}) {
  // qwerty-only modes: capitalisation + a digits/symbols plane.
  const [caps, setCaps] = useState(true);
  const [numeric, setNumeric] = useState(false);

  const isMulti = composer === "multi";
  const hasVal = Boolean(value && value.length > 0);

  const tray = (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-2.5 bg-[#e4ddcc] px-1.5 pt-1.5 pb-3 md:gap-[11px] md:px-3 md:pt-3 md:pb-3.5",
        // Without a composer the tray is the whole assembly: it carries the
        // top hairline and the slide-up itself.
        !composer &&
          "border-t border-nevo-near-black/8 motion-safe:animate-nevo-kb-up",
      )}
    >
      {layout === "pad" ? (
        <PadLayout onKey={onKey} onBackspace={onBackspace} />
      ) : (
        <QwertyLayout
          caps={caps}
          numeric={numeric}
          returnLabel={isMulti ? "return ↵" : "return"}
          onKey={onKey}
          onBackspace={onBackspace}
          onReturn={onReturn}
          onToggleCaps={() => setCaps((c) => !c)}
          onToggleNumeric={() => setNumeric((n) => !n)}
        />
      )}
    </div>
  );

  return (
    <div
      role="group"
      aria-label="On-screen keyboard"
      // Keep the focused field focused when a key is tapped (the keys drive its
      // state directly), so a focus-gated keyboard doesn't dismiss itself.
      onMouseDown={(e) => e.preventDefault()}
      className={cn("flex flex-col", composer && "motion-safe:animate-nevo-kb-up", className)}
    >
      {composer && (
        <div className="w-full border-t border-nevo-near-black/8 bg-[#e4ddcc] px-1.5 pt-1.5 pb-1 md:px-3 md:pt-3 md:pb-2">
          <div
            className={cn(
              "flex w-full flex-wrap rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream px-3.5 py-3 shadow-[inset_0_1px_2px_rgba(43,43,47,0.05)]",
              isMulti
                ? "min-h-[84px] items-start md:min-h-[100px]"
                : "min-h-[46px] items-center md:min-h-[52px]",
            )}
          >
            <span
              className={cn(
                "text-[16px] leading-[1.5] break-words whitespace-pre-wrap md:text-[18px]",
                hasVal ? "text-nevo-near-black" : "text-nevo-near-black/40",
              )}
            >
              {hasVal ? value : placeholder}
            </span>
            <span
              aria-hidden
              className="mt-0.5 ml-px inline-block h-[19px] w-[2px] bg-nevo-navy md:h-[22px] motion-safe:animate-nevo-kb-caret"
            />
          </div>
        </div>
      )}
      {tray}
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
  returnLabel,
  onKey,
  onBackspace,
  onReturn,
  onToggleCaps,
  onToggleNumeric,
}: {
  caps: boolean;
  numeric: boolean;
  returnLabel: string;
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
          {onReturn && <AccentKey label={returnLabel} onClick={onReturn} grow={1.8} />}
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
        {onReturn && <AccentKey label={returnLabel} onClick={onReturn} grow={1.8} />}
      </div>
    </>
  );
}
