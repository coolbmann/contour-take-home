import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ConsultationStatusBadge({
  completedAt,
  className,
}: {
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
