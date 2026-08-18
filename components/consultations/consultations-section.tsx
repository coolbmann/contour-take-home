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

function byWhen(a: Consultation, b: Consultation) {
  return a.booking_date_time.localeCompare(b.booking_date_time);
}

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

  const nextPendingId = useRef(-1);

  const managing = consultations.find((c) => c.id === managingId) ?? null;

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
