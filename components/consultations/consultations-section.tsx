"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { ConsultationDialog } from "@/components/consultations/consultation-dialog";
import type {
  Consultation,
  ConsultationChanges,
  ConsultationDraft,
} from "@/lib/consultations/types";

/* Holds the list in memory — creates, edits and cancellations are local until
 * the API lands. The three handlers are the seams that become calls. */

function byWhen(a: Consultation, b: Consultation) {
  return a.booking_date_time.localeCompare(b.booking_date_time);
}

export function ConsultationsSection({
  initial,
  currentUserId,
  currentUserFirstName,
  currentUserLastName,
}: {
  initial: Consultation[];
  currentUserId: string;
  currentUserFirstName: string;
  currentUserLastName: string;
}) {
  const [consultations, setConsultations] = useState(() =>
    [...initial].sort(byWhen),
  );
  const [managingId, setManagingId] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);

  const managing = consultations.find((c) => c.id === managingId) ?? null;

  function handleSave(id: number, changes: ConsultationChanges) {
    setConsultations((list) =>
      list.map((c) => (c.id === id ? { ...c, ...changes } : c)).sort(byWhen),
    );
  }

  function handleCreate(draft: ConsultationDraft) {
    setConsultations((list) =>
      [
        ...list,
        {
          // consultations.id is an identity column — the database assigns it.
          // Until the insert is wired up, stand in with the next free integer.
          id: list.reduce((max, c) => Math.max(max, c.id), 0) + 1,
          user_profiles: {
            first_name: currentUserFirstName,
            last_name: currentUserLastName,
          },
          user_id: draft.user_id,
          booking_date_time: draft.booking_date_time,
          duration_mins: draft.duration_mins,
          reason: draft.reason,
        },
      ].sort(byWhen),
    );
  }

  function handleCancelBooking(id: number) {
    setConsultations((list) => list.filter((c) => c.id !== id));
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

        <Button
          variant="contour"
          size="control"
          className="whitespace-nowrap"
          onClick={() => setBooking(true)}
        >
          Book consultation
        </Button>
      </div>

      {consultations.length === 0 ? (
        <p className="mt-6 rounded-md border border-contour-rule bg-contour-paper-2 px-5 py-6 text-sm text-contour-muted">
          No consultations booked. Use{" "}
          <span className="font-medium">Book consultation</span> to set one up.
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
      />
    </section>
  );
}
