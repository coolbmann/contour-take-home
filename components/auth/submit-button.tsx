import { SpinnerIcon } from "@/components/auth/icons";
import { Button } from "@/components/ui/button";

/* The loading state is CSS-driven off `data-state="loading"` on the button,
 * so the API phase can flip one attribute without this becoming stateful.
 *
 * The icon is wrapped in a plain span because Griffel (FluentUI's CSS-in-JS)
 * injects its styles at runtime — after Tailwind's stylesheet — so a `hidden`
 * class on the icon itself loses the cascade at equal specificity. */

export function SubmitButton({
  children,
  pending = false,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <Button
      type="submit"
      variant="contour"
      size="control"
      className="w-full whitespace-nowrap"
      data-state={pending ? "loading" : undefined}
      disabled={pending}
    >
      <span data-glyph="button-spinner" className="animate-spin leading-none">
        <SpinnerIcon />
      </span>
      {children}
    </Button>
  );
}
