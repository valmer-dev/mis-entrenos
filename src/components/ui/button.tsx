import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import type { LinkProps } from "next/link";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "hero";

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-colors select-none disabled:pointer-events-none disabled:opacity-50";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Texto casi negro sobre el acento: es la combinación con más contraste y
  // la que hace que el botón principal destaque de verdad.
  primary: "bg-accent text-plane hover:bg-accent-strong hover:text-ink",
  secondary:
    "bg-surface-raised text-ink border border-border hover:bg-border hover:border-border-strong",
  ghost: "text-ink-secondary hover:bg-surface-raised hover:text-ink",
  danger: "bg-danger/12 text-danger border border-danger/35 hover:bg-danger/20",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  // Objetivos táctiles amplios: la app se usa con el móvil en la mano.
  lg: "h-14 px-6 text-base",
  hero: "h-16 w-full px-6 text-lg tracking-wide",
};

function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

/** Mismo aspecto que `Button`, pero navega en lugar de ejecutar una acción. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
