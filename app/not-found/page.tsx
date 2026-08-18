import { NotFoundView } from "@/components/not-found-view";

/* Rewrite target for the proxy in lib/supabase/proxy.ts. Signed-out visitors
 * to a protected page land here with a 404 status, so the page's existence is
 * never disclosed. */

export default function Page() {
  return <NotFoundView />;
}
