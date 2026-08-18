import type {
  Consultation,
  ConsultationChanges,
  ConsultationDraft,
} from "@/lib/consultations/types";

/* Browser-side wrappers over /api/consultation.
 *
 * Each throws ConsultationApiError with a message fit to show a person, so the
 * UI has one thing to catch rather than a status code to interpret at every
 * call site. */

export class ConsultationApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ConsultationApiError";
    this.status = status;
  }
}

/** What the routes return on failure: `{ error }`, sometimes with `details`. */
type ErrorBody = {
  error?: string;
  details?: Record<string, string[] | undefined>;
};

/** Turn a failed response into the most specific message we can show. */
async function toError(response: Response): Promise<ConsultationApiError> {
  let body: ErrorBody = {};
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    // A 500 from the framework is HTML, not JSON. Fall through to the default.
  }

  // Field errors are the useful part when validation fails; the top-level
  // "Invalid consultation." on its own tells the user nothing actionable.
  const fieldError = Object.values(body.details ?? {})
    .flatMap((messages) => messages ?? [])
    .at(0);

  const message =
    fieldError ??
    body.error ??
    (response.status === 401
      ? "Your session has expired. Sign in again."
      : "Something went wrong. Try again.");

  return new ConsultationApiError(message, response.status);
}

async function send(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) throw await toError(response);
  return response;
}

/**
 * Book a consultation.
 *
 * The fields are listed rather than spread, so `user_id` is left behind: the
 * server takes the owner from the session and would discard it anyway, and a
 * field that is quietly ignored invites someone to believe it works.
 */
export async function createConsultation(
  draft: ConsultationDraft,
): Promise<Consultation> {
  const response = await send("/api/consultation", {
    method: "POST",
    body: JSON.stringify({
      booking_date_time: draft.booking_date_time,
      duration_mins: draft.duration_mins,
      reason: draft.reason,
    }),
  });
  return (await response.json()) as Consultation;
}

/** Change the time and/or reason. Returns the updated row. */
export async function updateConsultation(
  id: number,
  changes: Partial<ConsultationChanges>,
): Promise<Consultation> {
  const response = await send(`/api/consultation/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
  return (await response.json()) as Consultation;
}

/** Cancel a booking. Soft delete server-side; 204, so there is nothing to read. */
export async function cancelConsultation(id: number): Promise<void> {
  await send(`/api/consultation/${id}`, { method: "DELETE" });
}

/**
 * Mark a booking complete. Returns the updated row.
 *
 * Safe to call on a booking that is already complete — the server keeps the
 * original completion time and answers 200.
 */
export async function completeConsultation(
  id: number,
): Promise<Consultation> {
  const response = await send(`/api/consultation/${id}/complete`, {
    method: "POST",
  });
  return (await response.json()) as Consultation;
}
