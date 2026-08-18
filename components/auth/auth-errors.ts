export type FieldErrors = Partial<
  Record<"email" | "password" | "first_name" | "last_name", string>
>;

export type ParsedAuthError = { message: string; fields: FieldErrors };

const FIELD_KEYS = ["email", "password", "first_name", "last_name"] as const;

export function parseAuthError(payload: unknown): ParsedAuthError {
  const err = (payload as { error?: unknown })?.error;

  if (typeof err === "string") return { message: err, fields: {} };

  if (err && typeof err === "object") {
    const flat = err as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
    const fields: FieldErrors = {};
    for (const key of FIELD_KEYS) {
      const first = flat.fieldErrors?.[key]?.[0];
      if (first) fields[key] = first;
    }
    const message =
      flat.formErrors?.[0] ??
      (Object.keys(fields).length
        ? "Check the highlighted fields and try again."
        : "That didn’t work. Try again.");
    return { message, fields };
  }

  return { message: "That didn’t work. Try again.", fields: {} };
}

export function signInErrorMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "email_not_confirmed":
      return "That account still needs confirming. Open the link in your confirmation email, then sign in.";
    case "invalid_credentials":
      return "That email and password don’t match an account. Check both and try again.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    default:
      return fallback;
  }
}
