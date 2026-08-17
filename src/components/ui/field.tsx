import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const CONTROL_CLASSES =
  "bg-surface border-border text-ink placeholder:text-ink-muted w-full rounded-xl border px-4 " +
  "text-base transition-colors focus:border-accent focus:outline-none";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

/**
 * Campo de formulario con etiqueta.
 *
 * El tamaño de fuente es de 16px como mínimo: por debajo, iOS hace zoom
 * automático al enfocar el campo.
 */
export function Field({ label, hint, id, className, ...props }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-ink-secondary block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className={cn(CONTROL_CLASSES, "h-12", className)}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-ink-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function TextAreaField({
  label,
  hint,
  id,
  className,
  ...props
}: TextAreaFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-ink-secondary block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        aria-describedby={hintId}
        className={cn(CONTROL_CLASSES, "resize-none py-3", className)}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-ink-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
