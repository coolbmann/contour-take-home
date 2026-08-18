"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { ConsultationDialog } from "@/components/consultations/consultation-dialog";
import {
  ConsultationApiError,
  cancelConsultation,
  completeConsultation,
  createConsultation,
  updateConsultation,
} from "@/lib/consultations/api";
import type {
  Consultation,
  ConsultationChanges,
  ConsultationDraft,
} from "@/lib/consultations/types";

/* Holds the list in memory and writes through to /api/consultation.
 *
 * Every change is applied optimistically and rolled back if the request fails.
 * The dialog closes the moment you submit, so waiting for the round trip would
 * leave the card visibly stale with nothing explaining why; and a write that
 * silently failed while the UI showed success is the one outcome worth ruling
 * out — hence the banner. */

function byWhen(a: Consultation, b: Consultation) {
  return a.booking_date_time.localeCompare(b.booking_date_time);
}

/** Server messages are written to be read; anything else gets the fallback. */
function messageFor(error: unknown, fallback: string): string {
  return error instanceof ConsultationApiError ? error.message : fallback;
}

type ConsultationsSectionProps = {
  initial: Consultation[];
  currentUserId: string;
  currentUserFirstName: string;
  currentUserLastName: string;
  isAdmin: boolean;
};

/**
 * Discards the list's state whenever this route is genuinely re-entered.
 *
 * With `cacheComponents` on, the App Router parks a Client Component subtree in
 * a React <Activity> on navigation instead of unmounting it, and router.refresh()
 * merges a new RSC payload "without losing unaffected client-side React (e.g.
 * useState)". The list below seeds its state from `initial` in a useState
 * initialiser, which runs once per instance — so signing out and back in as
 * someone else returned the *same* instance, still holding the previous user's
 * consultations, while the fresh `initial` prop was ignored.
 *
 * `bfcacheId` changes when the segment is freshly created by a push or replace
 * navigation and stays stable across back/forward and refresh(), so this resets
 * on a real re-entry while leaving the browser's back button feeling normal.
 * `currentUserId` is folded in to state the invariant directly: this list
 * belongs to one user, and must never be inherited by another.
 */
export function ConsultationsSection(props: ConsultationsSectionProps) {
  const { bfcacheId } = useRouter();
  return (
    <ConsultationsList
      key={`${bfcacheId}:${props.currentUserId}`}
      {...props}
    />
  );
}

function ConsultationsList({
  initial,
  currentUserId,
  currentUserFirstName,
  currentUserLastName,
  isAdmin,
}: ConsultationsSectionProps) {
  const [consultations, setConsultations] = useState(() =>
    [...initial].sort(byWhen),
  );
  const [managingId, setManagingId] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Placeholder ids for bookings the server has not acknowledged yet. Negative
   * and descending so they can never collide with a real identity value, and
   * so `id < 0` is a reliable test for "not saved yet". */
  const nextPendingId = useRef(-1);

  const managing = consultations.find((c) => c.id === managingId) ?? null;

  /** True while a just-booked consultation is still in flight. */
  function isPending(id: number) {
    return id < 0;
  }

  async function handleCreate(draft: ConsultationDraft) {
    const pendingId = nextPendingId.current--;
    setError(null);
    setConsultations((list) =>
      [
        ...list,
        {
          id: pendingId,
          user_id: draft.user_id,
          booking_date_time: draft.booking_date_time,
          duration_mins: draft.duration_mins,
          reason: draft.reason,
          deleted_at: null,
          completed_at: null,
          user_profiles: {
            first_name: currentUserFirstName,
            last_name: currentUserLastName,
          },
        },
      ].sort(byWhen),
    );

    try {
      const created = await createConsultation(draft);
      // Swap in the server's row — the real id is what PATCH and DELETE need.
      setConsultations((list) =>
        list.map((c) => (c.id === pendingId ? created : c)).sort(byWhen),
      );
    } catch (failure) {
      setConsultations((list) => list.filter((c) => c.id !== pendingId));
      setError(messageFor(failure, "Couldn’t book that consultation."));
    }
  }

  async function handleSave(id: number, changes: ConsultationChanges) {
    const previous = consultations.find((c) => c.id === id);
    if (!previous) return;
    if (isPending(id)) {
      setError("That booking is still saving. Try again in a moment.");
      return;
    }

    setError(null);
    setConsultations((list) =>
      list.map((c) => (c.id === id ? { ...c, ...changes } : c)).sort(byWhen),
    );

    try {
      const updated = await updateConsultation(id, changes);
      setConsultations((list) =>
        list.map((c) => (c.id === id ? updated : c)).sort(byWhen),
      );
    } catch (failure) {
      setConsultations((list) =>
        list.map((c) => (c.id === id ? previous : c)).sort(byWhen),
      );
      setError(messageFor(failure, "Couldn’t save those changes."));
    }
  }

  async function handleComplete(id: number) {
    const previous = consultations.find((c) => c.id === id);
    if (!previous) return;
    if (isPending(id)) {
      setError("That booking is still saving. Try again in a moment.");
      return;
    }

    setError(null);
    // Stamped locally only so the tag flips immediately; the server's timestamp
    // is what the row ends up carrying.
    setConsultations((list) =>
      list.map((c) =>
        c.id === id ? { ...c, completed_at: new Date().toISOString() } : c,
      ),
    );

    try {
      const completed = await completeConsultation(id);
      setConsultations((list) =>
        list.map((c) => (c.id === id ? completed : c)),
      );
    } catch (failure) {
      setConsultations((list) => list.map((c) => (c.id === id ? previous : c)));
      setError(
        messageFor(failure, "Couldn’t mark that consultation complete."),
      );
    }
  }

  async function handleCancelBooking(id: number) {
    const previous = consultations.find((c) => c.id === id);
    if (!previous) return;
    if (isPending(id)) {
      setError("That booking is still saving. Try again in a moment.");
      return;
    }

    setError(null);
    setConsultations((list) => list.filter((c) => c.id !== id));

    try {
      await cancelConsultation(id);
    } catch (failure) {
      // Put it back where it was rather than leaving the user believing a
      // booking they still hold has been cancelled.
      setConsultations((list) => [...list, previous].sort(byWhen));
      setError(messageFor(failure, "Couldn’t cancel that booking."));
    }
  }

  return (
    <section className="mt-10" aria-labelledby="consultations-heading">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2
            id="consultations-heading"
            className="font-display text-xl font-bold tracking-tight"
          >
            Upcoming consultations
          </h2>
          <p className="text-sm tabular-nums text-contour-muted">
            {consultations.length} booked
          </p>
        </div>

        {!isAdmin && (
          <Button
            variant="contour"
            size="control"
            className="whitespace-nowrap"
            onClick={() => setBooking(true)}
          >
            Book consultation
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-contour-error bg-contour-paper-2 px-4 py-3 text-sm text-contour-error"
        >
          <p className="min-w-0 [overflow-wrap:anywhere]">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-hit whitespace-nowrap px-3 text-contour-error hover:bg-contour-paper"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {consultations.length === 0 ? (
        <p className="mt-6 rounded-md border border-contour-rule bg-contour-paper-2 px-5 py-6 text-sm text-contour-muted">
          {!isAdmin
            ? `No consultations booked. Click 'Book Consultation' to schedule one.`
            : "No consultations found."}{" "}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {consultations.map((consultation) => (
            <li key={consultation.id} className="flex min-w-0">
              <ConsultationCard
                consultation={consultation}
                onManage={setManagingId}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Two instances of the same dialog rather than one with a juggled mode,
          so opening a booking never inherits an in-progress edit. */}
      <ConsultationDialog
        mode="edit"
        consultation={managing}
        currentUserId={currentUserId}
        currentUserFirstName={currentUserFirstName}
        currentUserLastName={currentUserLastName}
        open={managing !== null}
        onOpenChange={(open) => !open && setManagingId(null)}
        onSave={handleSave}
        onCreate={handleCreate}
        onCancelBooking={handleCancelBooking}
        onComplete={handleComplete}
      />

      <ConsultationDialog
        mode="create"
        consultation={null}
        currentUserId={currentUserId}
        currentUserFirstName={currentUserFirstName}
        currentUserLastName={currentUserLastName}
        open={booking}
        onOpenChange={setBooking}
        onSave={handleSave}
        onCreate={handleCreate}
        onCancelBooking={handleCancelBooking}
        onComplete={handleComplete}
      />
    </section>
  );
}
