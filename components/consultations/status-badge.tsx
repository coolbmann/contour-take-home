import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* One definition of what "Complete" looks like and what it is called, shared by
 * the card and the dialog. Two copies of this would drift the moment either
 * label changed.
 *
 * Deliberately driven by `completed_at` alone, not by the clock: a booking
 * whose time has passed is not complete until someone says so. The tag reports
 * a fact on the row rather than inferring one. */

export function ConsultationStatusBadge({
  completedAt,
  className,
}: {
  /** `consultations.completed_at` — null while the booking is outstanding. */
  completedAt: string | null;
  className?: string;
}) {
  const complete = completedAt !== null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-body text-xs font-medium",
        complete
          ? "border-contour-success text-contour-success"
          : "border-contour-rule text-contour-muted",
        className,
      )}
    >
      {complete ? "Complete" : "Incomplete"}
    </Badge>
  );
}
