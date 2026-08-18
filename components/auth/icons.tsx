"use client";

/* @fluentui/react-icons is client-only — its icons call Griffel's __styles()
 * at module scope, which throws if evaluated on the server. Marking this one
 * module as the client boundary lets the forms and shell stay Server
 * Components while the icons render as client islands.
 *
 * Renamed to the role each icon plays, so swapping the icon set later is a
 * one-file change. */

export {
  ArrowLeft16Regular as BackArrowIcon,
  ErrorCircle16Regular as FieldErrorIcon,
  CheckmarkCircle16Regular as FieldSuccessIcon,
  SpinnerIos16Regular as SpinnerIcon,
} from "@fluentui/react-icons";
