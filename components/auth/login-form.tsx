"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { Field } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { signInErrorMessage } from "@/components/auth/auth-errors";

export function ContourLoginForm({ notice }: { notice?: ReactNode }) {
  const router = useRouter();

  // See components/logout-button.tsx: a manual pending flag survives navigation
  // because Next hides the old route rather than unmounting it.
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setFormError(null);

    startTransition(async () => {
      try {
        // Sign-in goes through our own route, not the Supabase browser client:
        // the credentials never touch third-party client code, and the response
        // carries the session cookies that lib/supabase/proxy.ts reads on the
        // next request.
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(data.get("email") ?? ""),
            password: String(data.get("password") ?? ""),
          }),
        });

        const result = (await response.json()) as {
          redirectTo?: string;
          error?: string;
          code?: string;
        };

        if (!response.ok) {
          setFormError(
            signInErrorMessage(
              result.code,
              result.error ?? "That didn’t work. Try again.",
            ),
          );
          return;
        }

        // The route decides where an account belongs — admins to /admin,
        // everyone else to /. Falling back to "/" keeps a malformed response
        // from stranding someone who is now signed in.
        router.push(result.redirectTo ?? "/");
        // Re-run Server Components so the new session is visible immediately.
        router.refresh();
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
        Welcome back
      </h1>
      <p
        className="auth__lede reveal"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        Sign in to reach your classes, recordings and resources.
      </p>

      <form
        className="reveal mt-10 flex flex-col gap-4"
        style={{ "--i": 2 } as React.CSSProperties}
        onSubmit={handleSubmit}
        noValidate
      >
        {!formError && notice}

        {formError && (
          <p className="alert" role="alert">
            {formError}
          </p>
        )}

        <Field
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={pending}
        />

        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          disabled={pending}
        />

        <SubmitButton pending={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </SubmitButton>
      </form>

      <p
        className="auth__swap reveal"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        New to Contour?{" "}
        <Link className="link" href="/auth/sign-up">
          Create an account
        </Link>
      </p>
    </>
  );
}
