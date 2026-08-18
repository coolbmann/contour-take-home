import Link from "next/link";

import { ContourGlyph } from "@/components/auth/contour-marks";

export function NotFoundView() {
  return (
    <main className="flex min-h-dvh flex-col bg-contour-paper px-6 py-6 font-body text-contour-ink">
      <Link
        href="/auth/login"
        className="inline-flex min-h-hit items-center gap-2 self-start rounded-sm font-display text-lg font-bold tracking-tight text-contour-ink no-underline"
      >
        <ContourGlyph className="block h-[1.375rem] w-[1.375rem] flex-none" />
        Contour
      </Link>

      <div className="flex flex-1 flex-col justify-center">
        <p className="font-body text-sm font-medium tabular-nums text-contour-muted">
          404
        </p>
        <h1 className="mt-2 max-w-[20ch] font-display text-[length:var(--text-h1)] font-bold leading-[1.15] tracking-tight [overflow-wrap:anywhere]">
          We couldn’t find that page
        </h1>
        <p className="mt-3 max-w-[46ch] text-contour-muted">
          The link may be wrong, or the page may need you to be signed in.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-flex min-h-control items-center justify-center self-start whitespace-nowrap rounded-pill border border-contour-accent bg-contour-accent px-6 font-body text-base font-medium leading-none text-contour-accent-ink outline outline-2 outline-offset-2 outline-transparent transition-colors duration-short ease-contour-out hover:border-contour-accent-hover hover:bg-contour-accent-hover focus-visible:outline-contour-focus active:border-contour-accent-press active:bg-contour-accent-press"
        >
          Go to sign in
        </Link>
      </div>
    </main>
  );
}
