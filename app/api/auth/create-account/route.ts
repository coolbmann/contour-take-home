// app/api/auth/sign-up/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

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
  }

  // The auth user already exists at this point and cannot be rolled back
  // without the service-role key, so a profile failure is reported rather than
  // turned into a misleading 400.
  return NextResponse.json(
    { user: data.user, ...(profileError ? { profileError } : {}) },
    { status: 201 },
  );
}
