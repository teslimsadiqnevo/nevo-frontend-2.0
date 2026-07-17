/**
 * Lesson Player modality + density enums (Product Arch §Lesson experience;
 * FE Architecture §4). The upload pipeline tags each segment with the modalities
 * it supports (minimum two); the player only ever offers what's available.
 */

/** Content channels a segment can be presented through. */
export const MODALITY = {
  TEXT: "text",
  VISUAL: "visual",
  AUDIO: "audio",
  INTERACTIVE: "interactive",
} as const;

export type Modality = (typeof MODALITY)[keyof typeof MODALITY];

/**
 * Reading-density adaptations for the Text modality (the Adaptive Toggle Bar:
 * Simplify / Expand / Slower). Each reshapes the SAME segment — not new content.
 */
export const DENSITY = {
  SIMPLIFY: "simplify",
  EXPAND: "expand",
  SLOWER: "slower",
} as const;

export type Density = (typeof DENSITY)[keyof typeof DENSITY];

/**
 * Layers available on a calculation segment. `interactive` is the co-construction
 * solver itself; `audio` and `kinesthetic` are layers over it (never replacements
 * — audio must not hide the text). Distinct from the player's top-level MODALITY.
 */
export const CALC_MODALITY = {
  INTERACTIVE: "interactive",
  AUDIO: "audio",
  KINESTHETIC: "kinesthetic",
} as const;

export type CalcModality = (typeof CALC_MODALITY)[keyof typeof CALC_MODALITY];
