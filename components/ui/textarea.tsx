import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex w-full min-w-0 transition-colors disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 md:text-sm",

        contour: cn(
          "min-h-24 resize-y rounded-sm border border-contour-ink bg-contour-paper px-4 py-3",
          "font-body text-base leading-normal text-contour-ink",
          "outline-2 outline-offset-1 outline-transparent [outline-style:solid]",
          "placeholder:text-contour-muted placeholder:opacity-100",
          "enabled:hover:bg-contour-paper-2",
          "focus-visible:bg-contour-paper-hi focus-visible:outline-contour-focus",
          "disabled:bg-contour-paper-2 disabled:opacity-55",
          "aria-[invalid=true]:border-contour-error",
        ),
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => (
    <textarea
      className={cn(textareaVariants({ variant, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
