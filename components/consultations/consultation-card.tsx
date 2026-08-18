import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  ClockIcon,
  ReasonIcon,
} from "@/components/consultations/icons";
import { ConsultationStatusBadge } from "@/components/consultations/status-badge";
import {
  dateOf,
  formatDateShort,
  formatTime,
  timeOf,
} from "@/lib/consultations/format";
import type { Consultation } from "@/lib/consultations/types";

export function ConsultationCard({
  consultation,
  onManage,
}: {
  consultation: Consultation;
  onManage: (id: number) => void;
}) {
  const { user_profiles, booking_date_time, duration_mins, reason, completed_at } =
    consultation;

  const date = dateOf(booking_date_time);
  const time = timeOf(booking_date_time);

  return (
    <article className="flex w-full min-w-0 flex-col rounded-md border border-contour-rule bg-contour-paper-hi p-5">

      <header className="flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 font-display text-lg font-bold leading-tight tracking-tight [overflow-wrap:anywhere]">
          {user_profiles.first_name} {user_profiles.last_name}
        </h3>
        <ConsultationStatusBadge
          completedAt={completed_at}
          className="mt-0.5 flex-none"
        />
      </header>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <dt className="flex items-center text-contour-muted" title="Date">
            <CalendarIcon />
            <span className="sr-only">Date</span>
          </dt>
          <dd className="font-medium">{formatDateShort(date)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="flex items-center text-contour-muted" title="Time">
            <ClockIcon />
            <span className="sr-only">Time</span>
          </dt>
          <dd className="font-medium tabular-nums">
            {formatTime(time)}
            <span className="font-normal text-contour-muted">
              {" "}
              · {duration_mins} min
            </span>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt
            className="mt-0.5 flex items-center text-contour-muted"
            title="Reason"
          >
            <ReasonIcon />
            <span className="sr-only">Reason for consultation</span>
          </dt>
          <dd className="min-w-0 text-contour-muted [overflow-wrap:anywhere]">
            {reason}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-1 items-end">
        <Button
          variant="contourOutline"
          size="control"
          className="w-full whitespace-nowrap"
          onClick={() => onManage(consultation.id)}
        >
          Manage
        </Button>
      </div>
    </article>
  );
}
