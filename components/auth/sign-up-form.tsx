"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  parseAuthError,
  type FieldErrors,
} from "@/components/auth/auth-errors";

export function ContourSignUpForm() {
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/create-account", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: String(data.get("email") ?? ""),
            password: String(data.get("password") ?? ""),
            first_name: String(data.get("first-name") ?? ""),
            last_name: String(data.get("last-name") ?? ""),
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const { message, fields } = parseAuthError(payload);
          setFormError(message);
          setFieldErrors(fields);
          return;
        }

        const confirmed = Boolean(payload?.user?.email_confirmed_at);
        router.push(`/auth/login?created=${confirmed ? "1" : "confirm"}`);
      } catch {
        setFormError(
          "Couldn’t reach the server. Check your connection and try again.",
        );
      }
    });
  }

  return (
    <>
      <h1
        className="auth__title reveal"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        Create your account
      </h1>
      <p
        className="auth__lede reveal"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        Start with your name and email. You can add your school and subjects
        later.
      </p>

      <form
        className="reveal mt-10 flex flex-col gap-4"
        style={{ "--i": 2 } as React.CSSProperties}
        onSubmit={handleSubmit}
        noValidate
      >
        {formError && (
          <p className="alert" role="alert">
            {formError}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
          <Field
            id="first-name"
            label="First name"
            type="text"
            autoComplete="given-name"
            placeholder="Ada"
            required
            disabled={pending}
            error={fieldErrors.first_name}
          />
          <Field
            id="last-name"
            label="Last name"
            type="text"
            autoComplete="family-name"
            placeholder="Nguyen"
            required
            disabled={pending}
            error={fieldErrors.last_name}
          />
        </div>

        <Field
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={pending}
          error={fieldErrors.email}
        />

        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
          disabled={pending}
          helper="At least 8 characters."
          error={fieldErrors.password}
        />

        <SubmitButton pending={pending}>
          {pending ? "Creating account…" : "Create account"}
        </SubmitButton>
      </form>

      <p
        className="auth__swap reveal"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        Already have an account?{" "}
        <Link className="link" href="/auth/login">
          Sign in
        </Link>
      </p>
    </>
  );
}
