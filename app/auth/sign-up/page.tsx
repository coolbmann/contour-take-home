import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ContourSignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create an account · Contour Education",
  description: "Create your Contour Education account.",
};

export default function Page() {
  return (
    <AuthShell
      statement="Your place at Contour starts here."
      proof={
        <>
          Join <b>15,000+</b> students already learning with Contour Education.
        </>
      }
    >
      <ContourSignUpForm />
    </AuthShell>
  );
}
