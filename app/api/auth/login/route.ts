import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/* Sign-in happens here rather than in the browser.
 *
 * The form used to call supabase.auth.signInWithPassword() directly, which put
 * the credentials and the whole auth surface in client code. Going through a
 * route keeps that on the server: the browser posts an email and a password to
 * our own origin and gets back a destination.
 *
 * The session still reaches the browser — createClient() writes Supabase's auth
 * cookies onto this response, and the browser client reads the same cookies —
 * so nothing downstream has to change.
 *
 * Public by way of isPublicPath() in lib/supabase/proxy.ts, which lets the
 * whole /api/auth prefix through. It has to be: nobody signing in has a session
 * yet. */

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

/**
 * public.roles id 2 — "Admin".
 *
 * Matching on the id is what was asked for, and it is one table instead of a
 * join. The tradeoff to know about: ids are per-environment, so if the roles
 * table is ever reseeded elsewhere this silently stops finding admins.
 * `loadAccessFor()` in lib/auth/access.ts resolves role *names* and would not
 * have that problem.
 */
const ADMIN_ROLE_ID = 2;

/** Where each kind of user lands after signing in. */
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
    // `code` is passed through so the form can keep using signInErrorMessage()
    // to turn "invalid_credentials" into something worth reading. Supabase's
    // own message is the fallback.
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 401 },
    );
  }

  // Signed in from here on. Anything that goes wrong below is a routing
  // question, not an authentication one, and must not fail the request — the
  // session cookie is already on this response.
  const { data: adminRole, error: roleError } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", data.user.id)
    .eq("role_id", ADMIN_ROLE_ID)
    .is("deleted_at", null)
    .maybeSingle();

  if (roleError) {
    // Send them to the student home rather than 500 at someone who is now
    // holding a valid session. Reported so the failure is not invisible.
    return NextResponse.json({
      redirectTo: STUDENT_HOME,
      roleError: roleError.message,
    });
  }

  return NextResponse.json({
    redirectTo: adminRole ? ADMIN_HOME : STUDENT_HOME,
  });
}
