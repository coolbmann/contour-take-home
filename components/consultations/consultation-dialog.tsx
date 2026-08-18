"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CancelBookingDialog } from "@/components/consultations/cancel-booking-dialog";
import { SlotPicker } from "@/components/consultations/slot-picker";
import { ConsultationStatusBadge } from "@/components/consultations/status-badge";
import {
  dateOf,
  formatBooking,
  formatDateLong,
  formatTime,
  formatWhen,
  timeOf,
  toBookingDateTime,
} from "@/lib/consultations/format";
import { DEFAULT_DURATION_MINS } from "@/lib/consultations/slots";
import type {
  Consultation,
  ConsultationChanges,
  ConsultationDraft,
} from "@/lib/consultations/types";

export function ConsultationDialog({
  mode,
  consultation,
  currentUserId,
  currentUserFirstName,
  currentUserLastName,
  open,
  onOpenChange,
  onSave,
  onCreate,
  onCancelBooking,
  onComplete,
}: {
  mode: "create" | "edit";
  consultation: Consultation | null;

  currentUserId: string;
  currentUserFirstName: string;
  currentUserLastName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, changes: ConsultationChanges) => void;
  onCreate: (draft: ConsultationDraft) => void;
  onCancelBooking: (id: number) => void;
  onComplete: (id: number) => void;
}) {
  const creating = mode === "create";

  const [reason, setReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const [touched, setTouched] = useState({ reason: false });

  useEffect(() => {
    if (!open) return;
    setReason(creating ? "" : (consultation?.reason ?? ""));
    setRescheduling(creating);
    setDate(null);
    setTime(null);
    setConfirmingCancel(false);
    setTouched({ reason: false });
  }, [open, creating, consultation]);

  if (!creating && !consultation) return null;

  const completed = !creating && consultation!.completed_at !== null;

  const bookedDate = consultation ? dateOf(consultation.booking_date_time) : "";
  const bookedTime = consultation ? timeOf(consultation.booking_date_time) : "";

  const reasonEmpty = reason.trim().length === 0;

  const showReasonError = reasonEmpty && touched.reason;

  const createReady = !reasonEmpty && Boolean(date) && Boolean(time);

  const pendingDate = date ?? bookedDate;
  const pendingTime = time ?? bookedTime;
  const timeChanged =
    !creating &&
    Boolean(date && time) &&
    (pendingDate !== bookedDate || pendingTime !== bookedTime);
  const reasonChanged =
    !creating && reason.trim() !== (consultation!.reason ?? "");

  const awaitingSlot = rescheduling && Boolean(date) && !time;
  const editReady =
    (reasonChanged || timeChanged) && !reasonEmpty && !awaitingSlot;

  function handleSubmit() {
    if (creating) {
      if (!createReady) return;
      onCreate({
        user_id: currentUserId,
        booking_date_time: toBookingDateTime(date!, time!),
        duration_mins: DEFAULT_DURATION_MINS,
        reason: reason.trim(),
      });
    } else {
      if (!editReady) return;
      onSave(consultation!.id, {
        booking_date_time: toBookingDateTime(pendingDate, pendingTime),
        reason: reason.trim(),
      });
    }
    onOpenChange(false);
  }

  function handleComplete() {
    onComplete(consultation!.id);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby="consultation-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {creating ? "Book consultation" : "Manage consultation"}

              {!creating && !consultation!.completed_at && (
                <Button
                  variant="contourOutline"
                  size="control"
                  className="shrink-0 whitespace-nowrap text-sm"
                  onClick={handleComplete}
                >
                  Mark as Completed
                </Button>
              )}
            </DialogTitle>
            <DialogDescription id="consultation-desc">
              {creating
                ? "Pick a time and tell the tutor what you want to cover."
                : "Update the reason or move this booking to another time."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 rounded-sm border border-contour-rule bg-contour-paper-2 p-4">
            {creating ? (
              <dl className="grid grid-cols-1 gap-3 text-sm xs:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-contour-muted">Student</dt>
                  <dd className="mt-0.5 font-medium [overflow-wrap:anywhere]">
                    {currentUserFirstName} {currentUserLastName}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-contour-muted">Duration</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">
                    {DEFAULT_DURATION_MINS} min
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-contour-muted">Status</dt>

                  <dd className="mt-0.5">
                    <ConsultationStatusBadge completedAt={null} />
                  </dd>
                </div>
              </dl>
            ) : (
              <dl className="grid grid-cols-1 gap-3 text-sm xs:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-contour-muted">Student</dt>
                  <dd className="mt-0.5 font-medium [overflow-wrap:anywhere]">
                    {consultation!.user_profiles.first_name}{" "}
                    {consultation!.user_profiles.last_name}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-contour-muted">Duration</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">
                    {consultation!.duration_mins} min
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-contour-muted">Currently booked</dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDateLong(bookedDate)}, {formatTime(bookedTime)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-contour-muted">Status</dt>
                  <dd className="mt-0.5">
                    <ConsultationStatusBadge
                      completedAt={consultation!.completed_at}
                    />
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Label variant="contour" htmlFor="reason">
              Reason for consultation
            </Label>
            <Textarea
              id="reason"
              name="reason"
              variant="contour"
              value={reason}
              placeholder={
                creating
                  ? "e.g. Integration by parts — stuck on the SAC revision set."
                  : undefined
              }
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, reason: true }))}
              disabled={completed}
              aria-invalid={showReasonError || undefined}
              aria-describedby="reason-helper"
            />
            <p
              id="reason-helper"
              className={`min-h-[1lh] text-sm ${showReasonError ? "text-contour-error" : "text-contour-muted"}`}
            >
              {completed
                ? "This consultation is complete — its details can no longer be changed."
                : showReasonError
                  ? "Add a reason so the tutor knows what to prepare."
                  : "What the student wants to cover."}
            </p>
          </div>

          <div className="mt-5 border-t border-contour-rule pt-5">
            {!creating && !rescheduling ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 text-sm text-contour-muted">
                  Date &amp; time —{" "}
                  <span className="font-medium text-contour-ink">
                    {formatBooking(consultation!.booking_date_time)}
                  </span>
                </p>
                {!completed && (
                  <Button
                    variant="contourOutline"
                    size="control"
                    className="whitespace-nowrap"
                    onClick={() => setRescheduling(true)}
                  >
                    Change
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {creating ? "Date & time" : "Choose a new date & time"}
                  </p>
                  {!creating && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-hit whitespace-nowrap px-3 text-contour-muted hover:bg-contour-paper-2 hover:text-contour-ink"
                      onClick={() => {
                        setRescheduling(false);
                        setDate(null);
                        setTime(null);
                      }}
                    >
                      Keep current time
                    </Button>
                  )}
                </div>

                <SlotPicker
                  selectedDate={date}
                  selectedTime={time}
                  onSelectDate={(d) => {
                    setDate(d);

                    setTime(null);
                  }}
                  onSelectTime={setTime}
                  originalDate={bookedDate}
                  originalTime={bookedTime}
                />

                {(timeChanged || (creating && date && time)) && (
                  <p className="rounded-sm border border-contour-rule bg-contour-paper-2 px-4 py-3 text-sm">
                    {creating ? "Booking " : "Moving to "}
                    <span className="font-medium">
                      {formatWhen(date ?? pendingDate, time ?? pendingTime)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">

            {completed ? (
              <Button
                variant="contourOutline"
                size="control"
                className="whitespace-nowrap xs:ml-auto"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            ) : (
              <>
                {creating ? (
                  <Button
                    variant="contourOutline"
                    size="control"
                    className="whitespace-nowrap"
                    onClick={() => onOpenChange(false)}
                  >
                    Discard
                  </Button>
                ) : (
                  <Button
                    variant="contourOutline"
                    size="control"
                    className="whitespace-nowrap border-contour-error text-contour-error hover:bg-contour-paper-2"
                    onClick={() => setConfirmingCancel(true)}
                  >
                    Cancel booking
                  </Button>
                )}
                <Button
                  variant="contour"
                  size="control"
                  className="whitespace-nowrap"
                  onClick={handleSubmit}
                  disabled={creating ? !createReady : !editReady}
                >
                  {creating ? "Book consultation" : "Save changes"}
                </Button>
              </>
            )}
          </DialogFooter>

          {(awaitingSlot || (creating && date && !time)) && (
            <p
              role="status"
              className="mt-3 text-right text-sm text-contour-muted"
            >
              Pick a slot to confirm the time.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {!creating && (
        <CancelBookingDialog
          consultation={consultation}
          open={confirmingCancel}
          onOpenChange={setConfirmingCancel}
          onConfirm={() => {
            setConfirmingCancel(false);
            onOpenChange(false);
            onCancelBooking(consultation!.id);
          }}
        />
      )}
    </>
  );
}
