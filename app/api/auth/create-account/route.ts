import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

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

  let profileError: string | null = null;
  if (data.user) {
    const { error: insertError } = await supabase
      .from("user_profiles")
      .upsert(
        { id: data.user.id, first_name, last_name },
        { onConflict: "id" },
      );
    if (insertError) profileError = insertError.message;

    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({ user_id: data.user.id, role_id: STUDENT_ROLE_ID });

    if (roleInsertError) {
      console.error(
        `create-account: could not assign role ${STUDENT_ROLE_ID} to ${data.user.id}:`,
        roleInsertError.message,
      );
    }
  }

  return NextResponse.json(
    { user: data.user, ...(profileError ? { profileError } : {}) },
    { status: 201 },
  );
}
