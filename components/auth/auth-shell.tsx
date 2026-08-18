import Link from "next/link";
import type { ReactNode } from "react";
import { BackArrowIcon } from "@/components/auth/icons";
import { ContourGlyph, ContourMotif } from "@/components/auth/contour-marks";
import "@/app/auth/auth.css";

type AuthShellProps = {
  statement: string;
  proof: ReactNode;
  children: ReactNode;
};

export function AuthShell({ statement, proof, children }: AuthShellProps) {
  return (
    <div className="auth">
      <div className="auth__main">
        <header
          className="auth__nav reveal"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          <img src="/contour-logo.svg" alt="Contour" className="h-[2rem]" />
        </header>

        <main className="auth__body">
          <div className="auth__inner">{children}</div>
        </main>
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
