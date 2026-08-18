// app/api/auth/sign-up/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * public.roles id 1 — "Student". Every account starts here.
 *
 * Assigned from the backend rather than a trigger on auth.users, so the rule
 * lives with the rest of the sign-up flow and is visible in this file. The
 * tradeoff to know about: a user created any other way — the Supabase
 * dashboard, a future admin invite, a seed script — gets no role, because
 * nothing below runs for them.
 */
const STUDENT_ROLE_ID = 1;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, first_name, last_name } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name, last_name } },
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  // Nothing in the database populates public.user_profiles, so the row that
  // the home page reads is written here. A trigger on auth.users would be more
  // robust (it also covers users created outside this route, and keeps working
  // once RLS is enabled) — see the note in the PR description.
  let profileError: string | null = null;
  if (data.user) {
    const { error: insertError } = await supabase
      .from("user_profiles")
      .upsert(
        { id: data.user.id, first_name, last_name },
        { onConflict: "id" },
      );
    if (insertError) profileError = insertError.message;

    // Without a role the account has no permissions at all: sign-in succeeds
    // and then every guarded page 404s.
    //
    // Inserted plainly. public.user_roles is keyed on (user_id, role_id), so a
    // repeat sign-up against an already-registered email cannot duplicate the
    // row — it fails the primary key instead, which is logged below and
    // otherwise ignored. That is the right outcome: the grant it was trying to
    // add is already there.
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({ user_id: data.user.id, role_id: STUDENT_ROLE_ID });

    // Not surfaced and not fatal: the auth user exists and cannot be rolled
    // back without the service-role key. Logged so a failure leaves a trace
    // for whoever has to work out why an account has no permissions.
    if (roleInsertError) {
      console.error(
        `create-account: could not assign role ${STUDENT_ROLE_ID} to ${data.user.id}:`,
        roleInsertError.message,
      );
    }
  }

  // The auth user already exists at this point and cannot be rolled back
  // without the service-role key, so a profile failure is reported rather than
  // turned into a misleading 400.
  return NextResponse.json(
    { user: data.user, ...(profileError ? { profileError } : {}) },
    { status: 201 },
  );
}
