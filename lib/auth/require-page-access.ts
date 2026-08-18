import "server-only";

import { notFound, redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  getAccessContext,
  getCurrentUser,
  satisfies,
  type AccessContext,
  type AccessRequirement,
  type Permission,
} from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";

/* Page-side counterpart to withAuthorization.
 *
 * Routes return a status; pages navigate. Same resolver underneath
 * (getAccessContext, request-cached), so guarding a page and then calling a
 * guarded service costs one permission query, not two.
 *
 * Returns the Supabase client so a page cannot get one without coming through
 * here — the point being that "I forgot the guard" and "I have no client" are
 * the same mistake, caught at the type level. */

type DeniedBehaviour =
  /** Render the not-found UI. Loop-safe, and doesn't disclose the page exists. */
  | "not-found"
  /** Send them somewhere they can actually get to. */
  | { redirect: string };

export type PageAccessOptions = {
  /** Where to send signed-out visitors. */
  signInPath?: string;
  /** What to do when signed in but lacking the grant. Default "not-found". */
  onDenied?: DeniedBehaviour;
};

export type PageAccess = {
  supabase: SupabaseClient;
  user: User;
  access: AccessContext;
};

/**
 * Guard a Server Component.
 *
 * ```ts
 * const { supabase, access } = await requirePageAccess(["consultation.read"]);
 * ```
 *
 * Accepts a bare permission list or the full requirement shape
 * (`{ roles, permissions, match }`).
 *
 * Note: this calls `redirect()` / `notFound()`, which work by throwing. Don't
 * wrap the call in a `try/catch` that swallows — you'd catch the navigation.
 */
export async function requirePageAccess(
  requirement: AccessRequirement | Permission[] = {},
  options: PageAccessOptions = {},
): Promise<PageAccess> {
  const { signInPath = "/auth/login", onDenied = "not-found" } = options;

  const required: AccessRequirement = Array.isArray(requirement)
    ? { permissions: requirement, match: "all" }
    : requirement;

  const user = await getCurrentUser();
  if (!user) redirect(signInPath);

  const access = await getAccessContext();
  // Signed in a moment ago but the context is gone — treat as signed out.
  if (!access) redirect(signInPath);

  if (!satisfies(access, required)) {
    if (onDenied === "not-found") notFound();

    // Guard against the obvious own-goal: sending someone who lacks the
    // permission to a page that requires the same permission loops forever.
    if (onDenied.redirect === signInPath) {
      throw new Error(
        "requirePageAccess: onDenied.redirect must not be the sign-in path — " +
          "the visitor is already signed in and would bounce back here.",
      );
    }
    redirect(onDenied.redirect);
  }

  // Only reached when the guard passed.
  const supabase = await createClient();
  return { supabase, user, access };
}
