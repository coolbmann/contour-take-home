import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full min-w-0 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 md:text-sm",

        contour: cn(
          "h-control rounded-pill border border-contour-ink bg-contour-paper py-0 pl-4 pr-10",
          "font-body text-base leading-normal text-contour-ink",
          "outline-2 outline-offset-1 outline-transparent",
          "placeholder:text-contour-muted placeholder:opacity-100",
          "enabled:hover:bg-contour-paper-2",
          "focus-visible:bg-contour-paper-hi focus-visible:outline-contour-focus",
          "disabled:bg-contour-paper-2 disabled:opacity-55",
          "[&:user-invalid]:border-contour-error aria-[invalid=true]:border-contour-error",
          "data-[state=success]:border-contour-success",
        ),
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
