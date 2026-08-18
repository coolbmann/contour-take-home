import type { InputHTMLAttributes, ReactNode } from "react";
import {
  FieldErrorIcon,
  FieldSuccessIcon,
  SpinnerIcon,
} from "@/components/auth/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;

  aside?: ReactNode;

  helper?: string;

  error?: string;
};

export function Field({ id, label, aside, helper, error, ...input }: FieldProps) {
  const helperId = `${id}-helper`;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label variant="contour" htmlFor={id}>
        {label}
        {aside}
      </Label>

      <div className="relative grid">
        <Input
          id={id}
          name={input.name ?? id}
          variant="contour"
          data-slot="contour-input"
          aria-invalid={error ? true : undefined}
          aria-describedby={helper || error ? helperId : undefined}
          {...input}
        />
        <span data-glyph="error" className="field__glyph text-contour-error">
          <FieldErrorIcon />
        </span>
        <span data-glyph="success" className="field__glyph text-contour-success">
          <FieldSuccessIcon />
        </span>
        <span
          data-glyph="loading"
          className="field__glyph animate-spin text-contour-muted"
        >
          <SpinnerIcon />
        </span>
      </div>

      <p
        className={error ? "field__helper field__helper--error" : "field__helper"}
        id={helperId}
      >
        {error ?? helper}
      </p>
    </div>
  );
}
