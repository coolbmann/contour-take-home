"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await createClient().auth.signOut();

      router.replace("/auth/login");
      router.refresh();
    });
  }

  return (
    <Button
      variant="contourOutline"
      size="control"
      onClick={signOut}
      disabled={isPending}
      className="whitespace-nowrap"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
