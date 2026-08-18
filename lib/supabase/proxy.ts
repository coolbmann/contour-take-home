import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

/** Paths that must stay reachable while signed out. */
function isPublicPath(pathname: string) {
  return (
    // Sign-in / sign-up screens and the auth callback routes.
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    // The account-creation API. Without this, an unauthenticated POST to
    // /api/auth/* is blocked — i.e. sign-up is unreachable for everyone who
    // needs it.
    pathname.startsWith("/api/auth")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being
  // randomly logged out.
  //
  // getUser() revalidates the token against the Supabase Auth server on every
  // request, so a revoked or expired session is caught here rather than being
  // trusted from the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    // Protected pages do not reveal that they exist to signed-out visitors.
    // Rewriting (not redirecting) keeps the URL intact and renders the app's
    // not-found UI; the 404 status is set explicitly because a rewrite would
    // otherwise respond 200.
    const notFound = NextResponse.rewrite(new URL("/not-found", request.url), {
      status: 404,
    });
    // Carry over any refreshed auth cookies so the session stays consistent.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      notFound.cookies.set(cookie);
    });
    return notFound;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
