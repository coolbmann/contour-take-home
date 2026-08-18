"use client";

import { useMemo } from "react";

import { getSlotsForDate, upcomingDates } from "@/lib/consultations/mock";
import { formatRelativeDay, formatTime, isoDayNum, isoMonthShort } from "@/lib/consultations/format";

/* Reschedule is a two-step choice: pick a day, then pick a slot on that day.
 * Slots are only requested once a date exists, which mirrors the eventual
 * `GET /slots?date=…` call. */

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
  const dates = useMemo(() => upcomingDates(14), []);
  const today = dates[0];
  const tomorrow = dates[1];

  const slots = useMemo(
    () => (selectedDate ? getSlotsForDate(selectedDate) : []),
    [selectedDate],
  );
  const openSlots = slots.filter((s) => s.available);

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium">Pick a date</legend>
        {/* Horizontal scroll is contained here so the dialog never scrolls sideways. */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {dates.map((date) => {
            const active = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectDate(date)}
                className={[
                  "flex min-h-hit min-w-[4.25rem] flex-none flex-col items-center justify-center gap-0.5 rounded-sm border px-3 py-2",
                  "outline-2 outline-offset-2 outline-transparent [outline-style:solid] transition-colors duration-short ease-contour-out",
                  "focus-visible:outline-contour-focus",
                  active
                    ? "border-contour-ink bg-contour-ink text-contour-paper"
                    : "border-contour-rule bg-contour-paper text-contour-ink hover:bg-contour-paper-2",
                ].join(" ")}
              >
                <span className="text-xs opacity-80">
                  {formatRelativeDay(date, today, tomorrow)}
                </span>
                <span className="text-base font-medium tabular-nums leading-none">
                  {isoDayNum(date)}
                </span>
                <span className="text-xs opacity-80">{isoMonthShort(date)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium">
          {selectedDate ? "Available slots" : "Pick a date to see available slots"}
        </legend>

        {!selectedDate ? (
          <p className="text-sm text-contour-muted">
            Choose a day above and the open times will appear here.
          </p>
        ) : openSlots.length === 0 ? (
          <p className="rounded-sm border border-contour-rule bg-contour-paper-2 px-4 py-3 text-sm text-contour-muted">
            No slots open on this date. Try another day.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 xs:grid-cols-3">
            {openSlots.map((slot) => {
              const active = slot.time === selectedTime;
              const isOriginal =
                selectedDate === originalDate && slot.time === originalTime;
              return (
                <button
                  key={slot.time}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectTime(slot.time)}
                  className={[
                    "flex min-h-hit items-center justify-center gap-1 rounded-pill border px-3 text-sm tabular-nums",
                    "whitespace-nowrap outline-2 outline-offset-2 outline-transparent [outline-style:solid]",
                    "transition-colors duration-short ease-contour-out focus-visible:outline-contour-focus",
                    active
                      ? "border-contour-accent bg-contour-accent font-medium text-contour-accent-ink"
                      : "border-contour-rule bg-contour-paper text-contour-ink hover:bg-contour-paper-2",
                  ].join(" ")}
                >
                  {formatTime(slot.time)}
                  {isOriginal && !active && (
                    <span className="text-xs text-contour-muted">(current)</span>
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
