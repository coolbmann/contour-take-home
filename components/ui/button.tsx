import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        contour:
          "rounded-pill border border-contour-accent bg-contour-accent font-body text-base font-medium text-contour-accent-ink shadow-none " +
          "outline outline-2 outline-offset-2 outline-transparent " +
          "hover:border-contour-accent-hover hover:bg-contour-accent-hover " +
          "active:border-contour-accent-press active:bg-contour-accent-press " +
          "focus-visible:outline-contour-focus focus-visible:ring-0 " +
          "disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-55",
        contourOutline:
          "rounded-pill border border-contour-ink bg-transparent font-body text-base font-medium text-contour-ink shadow-none " +
          "outline outline-2 outline-offset-2 outline-transparent " +
          "hover:bg-contour-paper-3 " +
          "active:bg-contour-rule " +
          "focus-visible:outline-contour-focus focus-visible:ring-0 " +
          "disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-55",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",

        control: "h-control min-h-control px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
