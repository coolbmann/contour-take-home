import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const ADMIN_ROLE_ID = 2;

const ADMIN_HOME = "/admin";
const STUDENT_HOME = "/";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter an email address and a password." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 401 },
    );
  }

  const { data: adminRole, error: roleError } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", data.user.id)
    .eq("role_id", ADMIN_ROLE_ID)
    .is("deleted_at", null)
    .maybeSingle();

  if (roleError) {
    return NextResponse.json({
      redirectTo: STUDENT_HOME,
      roleError: roleError.message,
    });
  }

  return NextResponse.json({
    redirectTo: adminRole ? ADMIN_HOME : STUDENT_HOME,
  });
}
