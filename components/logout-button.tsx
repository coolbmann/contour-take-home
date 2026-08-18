"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/* `useTransition` rather than a useState flag.
 *
 * Next keeps the previous route's subtree mounted but `display: none` so going
 * back is instant, which means this component is NOT unmounted on navigation —
 * a `pending` flag set to true and never reset survives, and reappears as a
 * stuck "Signing out…" the next time the subtree is shown. React owns the
 * transition's pending state and clears it when the navigation commits. */

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await createClient().auth.signOut();
      // replace, not push: the signed-in page must not stay in history where
      // Back would reveal it.
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
