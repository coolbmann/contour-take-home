import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { CreatedNotice } from "@/components/auth/created-notice";
import { ContourLoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in · Contour Education",
  description: "Sign in to your Contour Education account.",
};

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  return (
    <AuthShell
      statement="One login. Every class, every resource."
      proof={
        <>
          The academic partner helping <b>15,000+</b> students reach their full
          potential.
        </>
      }
    >
      <ContourLoginForm
        notice={
          <Suspense fallback={null}>
            <CreatedNotice searchParams={searchParams} />
          </Suspense>
        }
      />
    </AuthShell>
  );
}
