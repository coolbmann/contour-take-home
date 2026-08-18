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

type DeniedBehaviour =

  | "not-found"

  | { redirect: string };

export type PageAccessOptions = {
  signInPath?: string;

  onDenied?: DeniedBehaviour;
};

export type PageAccess = {
  supabase: SupabaseClient;
  user: User;
  access: AccessContext;
};

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

  if (!access) redirect(signInPath);

  if (!satisfies(access, required)) {
    if (onDenied === "not-found") notFound();

    if (onDenied.redirect === signInPath) {
      throw new Error(
        "requirePageAccess: onDenied.redirect must not be the sign-in path — " +
          "the visitor is already signed in and would bounce back here.",
      );
    }
    redirect(onDenied.redirect);
  }

  const supabase = await createClient();
  return { supabase, user, access };
}
