import type { LucideIcon, LucideProps } from "lucide-react";

/**
 * Nevo Icon (Design System v2 §7). Standardizes the icon convention so stroke
 * and size are never set ad hoc:
 *   - line style, rounded joins/caps (lucide's defaults)
 *   - 1.75px stroke (within the 1.5–2px band)
 *   - sizes: base 24 · dense 20 · tablet 32
 *
 * Color is inherited (`currentColor`) — Near Black by default from body text,
 * Navy where the parent sets it (active states). Override via `className`.
 *
 *   <Icon icon={Home} />
 *   <Icon icon={Bell} size="dense" className="text-nevo-navy" />
 */
const SIZES = {
  dense: 20,
  base: 24,
  tablet: 32,
} as const;

export type IconSize = keyof typeof SIZES;

export function Icon({
  icon: IconComponent,
  size = "base",
  strokeWidth = 1.75,
  ...props
}: {
  icon: LucideIcon;
  size?: IconSize;
} & Omit<LucideProps, "size" | "ref">) {
  return (
    <IconComponent size={SIZES[size]} strokeWidth={strokeWidth} {...props} />
  );
}
