import { SpinnerIcon } from "@/components/auth/icons";
import { Button } from "@/components/ui/button";

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
