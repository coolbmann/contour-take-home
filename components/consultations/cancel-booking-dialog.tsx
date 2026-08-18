"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WarningIcon } from "@/components/consultations/icons";
import { formatBooking } from "@/lib/consultations/format";
import type { Consultation } from "@/lib/consultations/types";

/* Cancelling is destructive and not undoable here, so it keeps a confirm step —
 * the opposite of the optimistic-with-undo pattern used for reversible edits. */

export function CancelBookingDialog({
  consultation,
  open,
  onOpenChange,
  onConfirm,
}: {
  consultation: Consultation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  if (!consultation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Keeps the default /85 scrim rather than clearing it. The manage
          dialog underneath is still mounted and still painting its own, so the
          two compound to roughly 98% — deliberately: this is the destructive
          step, and everything behind it should recede. */}
      <DialogContent className="max-w-md" aria-describedby="cancel-desc">
        <DialogHeader>
          <span className="mb-1 flex items-center text-contour-error" aria-hidden>
            <WarningIcon />
          </span>
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription id="cancel-desc">
            {consultation.user_profiles.first_name}&rsquo;s consultation on{" "}
            <span className="font-medium text-contour-ink">
              {formatBooking(consultation.booking_date_time)}
            </span>{" "}
            will be released. This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6">
          <Button
            variant="contourOutline"
            size="control"
            className="whitespace-nowrap"
            onClick={() => onOpenChange(false)}
          >
            Keep booking
          </Button>
          <Button
            variant="contourOutline"
            size="control"
            className="whitespace-nowrap border-contour-error bg-contour-error text-contour-paper hover:border-contour-error hover:bg-contour-error/90"
            onClick={onConfirm}
          >
            Cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
