"use client";

import { useMemo } from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  dateFromIso,
  formatTime,
  isoFromDate,
} from "@/lib/consultations/format";
import { SLOT_TIMES } from "@/lib/consultations/slots";

/* Booking is a two-step choice: pick a day on the calendar, then pick a start
 * time on that day. Times are the same every day (see SLOT_TIMES), so the
 * second step needs nothing from the first beyond "a date exists" — but it
 * stays gated on one anyway, because a time without a date is not a booking. */

export function SlotPicker({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  originalDate,
  originalTime,
}: {
  selectedDate: string | null;
  selectedTime: string | null;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  originalDate: string;
  originalTime: string;
}) {
  // Local midnight, so "before today" compares days rather than instants and
  // this morning does not disqualify the whole of today.
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const selected = selectedDate ? dateFromIso(selectedDate) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium">Pick a date</legend>
        <div className="flex w-fit justify-center rounded-sm border border-contour-rule bg-contour-paper p-3 xs:justify-start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => date && onSelectDate(isoFromDate(date))}
            defaultMonth={selected ?? today}
            // Nobody books a consultation in the past.
            disabled={{ before: today }}
            startMonth={today}
          />
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium">
          {selectedDate ? "Pick a time" : "Pick a date to see times"}
        </legend>

        {!selectedDate ? (
          <p className="text-sm text-contour-muted">
            Choose a day above and the available times will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 xs:grid-cols-3">
            {SLOT_TIMES.map((time) => {
              const active = time === selectedTime;
              const isOriginal =
                selectedDate === originalDate && time === originalTime;
              return (
                <button
                  key={time}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectTime(time)}
                  className={[
                    "flex min-h-hit items-center justify-center gap-1 rounded-pill border px-3 text-sm tabular-nums",
                    "whitespace-nowrap outline-2 outline-offset-2 outline-transparent [outline-style:solid]",
                    "transition-colors duration-short ease-contour-out focus-visible:outline-contour-focus",
                    active
                      ? "border-contour-accent bg-contour-accent font-medium text-contour-accent-ink"
                      : "border-contour-rule bg-contour-paper text-contour-ink hover:bg-contour-paper-2",
                  ].join(" ")}
                >
                  {formatTime(time)}
                  {isOriginal && !active && (
                    <span className="text-xs text-contour-muted">
                      (current)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>
    </div>
  );
}
