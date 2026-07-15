import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Nevo Card (Design System v2 §6). A Cream Elevated surface on cream — elevation
 * is the only thing that separates levels (no borders, no white). Level 1 for
 * cards at rest, Level 2 for the leading/primary card on a screen.
 */
const cardVariants = cva("rounded-[12px] bg-nevo-cream-elevated p-6", {
  variants: {
    elevation: {
      1: "shadow-elevation-1",
      2: "shadow-elevation-2",
    },
  },
  defaultVariants: {
    elevation: 1,
  },
});

function Card({
  className,
  elevation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ elevation, className }))}
      {...props}
    />
  );
}

export { Card, cardVariants };
