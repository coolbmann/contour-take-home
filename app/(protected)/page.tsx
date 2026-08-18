import type { Metadata } from "next";
import { connection } from "next/server";

import { ContourGlyph } from "@/components/auth/contour-marks";
import { ConsultationsSection } from "@/components/consultations/consultations-section";
import { LogoutButton } from "@/components/logout-button";
import { requirePageAccess } from "@/lib/auth";
import type { Consultation } from "@/lib/consultations/types";
import { getConsultations } from "@/services/consultation-service";

export const metadata: Metadata = {
  title: "Home · Contour Education",
};

/* This route blocks on request-time data by design: it is per-user, behind
 * auth, and nothing on it is cacheable. The alternative Next offers — wrapping
 * the read in <Suspense> — streams the dashboard in as a dynamic hole, and that
 * streamed subtree does not hydrate on a direct load of "/", leaving every
 * button inside it dead. */
export const instant = false;

/* The proxy (lib/supabase/proxy.ts) already guarantees a signed-in user before
 * this renders. The profile read is still done here rather than trusted from a
 * header, so the page stays correct if the matcher ever changes.
 *
 * `connection()` marks the whole page request-time. The alternative — a
 * Suspense boundary around the profile read — streams the dashboard in as a
 * dynamic hole, and that streamed subtree does NOT hydrate on a direct load of
 * "/", leaving every button inside it dead. Nothing here is cacheable anyway:
 * it is per-user data behind auth. One read, feeding both the greeting and the
 * booking form. */

const headingClass =
  "max-w-[20ch] font-display text-[length:var(--text-h1)] font-bold leading-[1.15] tracking-tight [overflow-wrap:anywhere]";

export default async function Home() {
  // Request-time: opt out of prerendering rather than streaming a dynamic hole.
  await connection();

  // Signed out -> /auth/login. Signed in without the grant -> not-found.
  // Returns the client, so this page cannot query without having passed here.
  const { supabase, access } = await requirePageAccess(["consultation.read"]);

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("first_name, last_name")
    .eq("id", access.userId)
    .maybeSingle();

  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    : "";

  // Not wrapped in try/catch: requirePageAccess navigates by throwing, and a
  // catch here would swallow it. A genuine query failure should surface.
  let consultations: Consultation[] = [];
  try {
    consultations = await getConsultations(supabase, access.userId);
  } catch (error) {
    console.error(error);
    return <div>Error loading consultations</div>;
  }
  return (
    <main className="flex min-h-dvh flex-col bg-contour-paper px-6 py-6 font-body text-contour-ink">
      <header className="flex items-center justify-between gap-4">
        <span className="inline-flex min-h-hit items-center gap-2 font-display text-lg font-bold tracking-tight">
          <ContourGlyph className="block h-[1.375rem] w-[1.375rem] flex-none" />
          Contour
        </span>
        <LogoutButton />
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 pb-16 pt-12">
        {/* Narrowing on `profile` (not `fullName`) so the JSX below is type-safe. */}
        {!profile || !fullName ? (
          <>
            <h1 className={headingClass}>Welcome</h1>
            <p
              role="status"
              className="mt-6 max-w-[52ch] rounded-sm border border-contour-error bg-contour-paper-2 px-4 py-3 text-sm text-contour-error"
            >
              {error
                ? `Couldn’t load your profile: ${error.message}`
                : "No row in public.user_profiles matches your account yet."}
            </p>
          </>
        ) : (
          <>
            <h1 className={headingClass}>Welcome, {fullName}</h1>
          </>
        )}

        <ConsultationsSection
          initial={consultations}
          currentUserId={access.userId}
          currentUserFirstName={profile?.first_name ?? ""}
          currentUserLastName={profile?.last_name ?? ""}
        />
      </div>
    </main>
  );
}
