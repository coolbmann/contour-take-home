import type { Metadata } from "next";
import { connection } from "next/server";

import { ContourGlyph } from "@/components/auth/contour-marks";
import { ConsultationsSection } from "@/components/consultations/consultations-section";
import { LogoutButton } from "@/components/logout-button";
import { requirePageAccess } from "@/lib/auth";
import type { Consultation } from "@/lib/consultations/types";
import { getAllConsultations } from "@/services/consultation-service";

export const metadata: Metadata = {
  title: "Home · Contour Education",
};

export const instant = false;

const headingClass =
  "max-w-[20ch] font-display text-[length:var(--text-h1)] font-bold leading-[1.15] tracking-tight [overflow-wrap:anywhere]";

export default async function Home() {
  await connection();

  const { supabase, access } = await requirePageAccess({
    roles: ["Admin"],
    permissions: ["consultation.readAll"],
  });

  console.log(access);

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("first_name, last_name")
    .eq("id", access.userId)
    .maybeSingle();

  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    : "";

  let consultations: Consultation[] = [];
  try {
    consultations = await getAllConsultations(supabase);
  } catch (error) {
    console.error(error);
    return <div>Error loading consultations</div>;
  }
  return (
    <main className="flex min-h-dvh flex-col bg-contour-paper px-6 py-6 font-body text-contour-ink">
      <header className="flex items-center justify-between gap-4">
        <img src="/contour-logo.svg" alt="Contour" className="h-[2rem]" />
        <LogoutButton />
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 pb-16 pt-12">

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
          isAdmin={access.roles.includes("Admin")}
          currentUserFirstName={profile?.first_name ?? ""}
          currentUserLastName={profile?.last_name ?? ""}
        />
      </div>
    </main>
  );
}
