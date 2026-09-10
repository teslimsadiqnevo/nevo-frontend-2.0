import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Text a child has to read must be readable.
 *
 * This is not a general contrast audit - it guards the specific tokens that
 * carry sentences a child acts on, because one of them was the least readable
 * text in the app and sat in the worst possible place.
 *
 * `--color-nevo-violet` measures 2.34:1 on cream. The Quick Check's CORRECT
 * note is navy at 8.8:1 and its RECOVERY note was violet - so a child who
 * answered correctly could read their note, and a child who answered wrongly
 * could not read the one telling them how to recover. The same violet carried
 * "that code doesn't match a class" on both code screens.
 *
 * A test rather than a comment because the failure is invisible: nothing warns
 * you, the text simply renders, and it looks fine to anyone who can already
 * read it.
 */

const CSS = readFileSync(
  join(process.cwd(), "src", "app", "globals.css"),
  "utf8",
);

/** The value `--color-<name>` is declared as, read from the stylesheet itself. */
function token(name: string): string {
  const m = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(CSS);
  if (!m) throw new Error(`--color-${name} is not declared in globals.css`);
  return m[1];
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA, normal-size text. */
const AA = 4.5;

describe("the colours a child reads sentences in", () => {
  const cream = () => token("nevo-cream");
  const elevated = () => token("nevo-cream-elevated");

  it("passes AA on cream", () => {
    expect(ratio(token("nevo-violet-text"), cream())).toBeGreaterThanOrEqual(
      AA,
    );
  });

  it("passes AA on the elevated ground too", () => {
    // Sheets and cards sit on this one, and it is darker - so a colour that
    // only just passes on cream can fail here. An earlier candidate did.
    expect(ratio(token("nevo-violet-text"), elevated())).toBeGreaterThanOrEqual(
      AA,
    );
  });

  it("keeps the navy that the correct-answer note uses", () => {
    expect(ratio(token("nevo-navy"), cream())).toBeGreaterThanOrEqual(AA);
  });

  it("records why the accent cannot be used for these sentences", () => {
    // Not a demand that the accent change - it is a surface and accent colour
    // and is right as one. This is here so that if someone ever points the
    // recovery note back at it, the reason is written down and measurable.
    expect(ratio(token("nevo-violet"), cream())).toBeLessThan(AA);
  });
});

describe("High Contrast", () => {
  it("reaches violet text, which it used to skip entirely", () => {
    // The rule is an allowlist of `text-nevo-near-black/NN` classes. Violet was
    // outside it, so a child who turned High Contrast on still could not read
    // the faintest text in the app.
    const block = CSS.slice(CSS.indexOf('html[data-contrast="high"]'));
    expect(block).toContain(".text-nevo-violet");
    expect(block).toContain(".text-nevo-violet-text");
  });
});
