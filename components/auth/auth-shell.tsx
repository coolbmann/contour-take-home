import Link from "next/link";
import type { ReactNode } from "react";
import { BackArrowIcon } from "@/components/auth/icons";
import { ContourGlyph, ContourMotif } from "@/components/auth/contour-marks";
import "@/app/auth/auth.css";

/* Split Studio diptych. Lives as a component rather than app/auth/layout.tsx
 * so the four sibling /auth/* routes still running the starter UI are
 * untouched — a layout file would wrap them too. */

type AuthShellProps = {
  /** Panel statement. Kept short — display type at 3rem needs ≤ 7 words. */
  statement: string;
  proof: ReactNode;
  children: ReactNode;
};

export function AuthShell({ statement, proof, children }: AuthShellProps) {
  return (
    <div className="auth">
      <div className="auth__main">
        <header className="auth__nav reveal" style={{ "--i": 0 } as React.CSSProperties}>
          <Link href="/" className="mark">
            <ContourGlyph className="mark__glyph" />
            Contour
          </Link>
          <a
            className="auth__back"
            href="https://www.contoureducation.com.au/"
          >
            <BackArrowIcon />
            Back to site
          </a>
        </header>

        <main className="auth__body">
          <div className="auth__inner">{children}</div>
        </main>

        <footer className="auth__foot reveal" style={{ "--i": 4 } as React.CSSProperties}>
          <span>© Contour Education</span>
          <a href="https://www.contoureducation.com.au/privacy-policy">Privacy</a>
          <a href="https://www.contoureducation.com.au/terms-of-service">Terms</a>
          <a href="https://www.contoureducation.com.au/contact">Contact</a>
        </footer>
      </div>

      <aside className="panel">
        <ContourMotif className="panel__motif" />
        <div className="panel__content">
          <p className="panel__statement">{statement}</p>
          <hr className="panel__rule" />
          <p className="panel__proof">{proof}</p>
        </div>
      </aside>
    </div>
  );
}
