import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Nevo Button (Design System v2 §6) — the canonical button for all three apps.
 *
 * Variants: primary (navy), secondary (navy outline on cream), ghost.
 * Sizes: lg (52px, default), md (44px), sm (36px). 10px radius throughout.
 * States: default / hover / pressed / disabled (40% opacity) / loading.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] font-medium whitespace-nowrap outline-none transition-[box-shadow,transform,background-color,color] select-none focus-visible:ring-[3px] focus-visible:ring-nevo-navy/35 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary:
          "border-none bg-nevo-navy px-6 text-[15px] text-nevo-cream hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] active:translate-y-px active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.20)]",
        secondary:
          "border-[1.5px] border-nevo-navy bg-nevo-cream px-6 text-[15px] text-nevo-navy hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:translate-y-px active:bg-nevo-cream-elevated",
        ghost:
          "border-none bg-transparent px-4 text-sm text-nevo-navy hover:bg-nevo-navy/6 active:bg-nevo-cream-elevated",
      },
      size: {
        lg: "h-13",
        md: "h-11",
        sm: "h-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
