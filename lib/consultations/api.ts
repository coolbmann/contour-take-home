import type {
  Consultation,
  ConsultationChanges,
  ConsultationDraft,
} from "@/lib/consultations/types";

export class ConsultationApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ConsultationApiError";
    this.status = status;
  }
}

type ErrorBody = {
  error?: string;
  details?: Record<string, string[] | undefined>;
};

async function toError(response: Response): Promise<ConsultationApiError> {
  let body: ErrorBody = {};
  try {
    body = (await response.json()) as ErrorBody;
  } catch {}

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

export async function cancelConsultation(id: number): Promise<void> {
  await send(`/api/consultation/${id}`, { method: "DELETE" });
}

export async function completeConsultation(
  id: number,
): Promise<Consultation> {
  const response = await send(`/api/consultation/${id}/complete`, {
    method: "POST",
  });
  return (await response.json()) as Consultation;
}
