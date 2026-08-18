"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

/**
 * Navegación principal.
 *
 * En móvil es una barra inferior fija (el pulgar llega sin esfuerzo); a partir
 * de `md` se convierte en una barra lateral y el contenido se centra. Es el
 * mismo componente en los dos casos para que no haya dos listas de rutas que
 * mantener sincronizadas.
 */

type NavItem = {
  href: "/dashboard" | "/entrenar" | "/historico" | "/perfil";
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} aria-hidden {...iconProps}>
        <path d="M4 20V10M10 20V5M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/entrenar",
    label: "Entrenar",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} aria-hidden {...iconProps}>
        <path d="M6.5 6.5v11M3 9v5M17.5 6.5v11M21 9v5M6.5 12h11" />
      </svg>
    ),
  },
  {
    href: "/historico",
    label: "Histórico",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} aria-hidden {...iconProps}>
        <path d="M12 7v5l3 2" />
        <path d="M3.5 10a8.5 8.5 0 1 1 .8 5" />
        <path d="M3 20v-5h5" />
      </svg>
    ),
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} aria-hidden {...iconProps}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
  },
] as const;

function useIsActive() {
  const pathname = usePathname();

  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Navegación principal"
      className="border-border bg-plane/95 pb-safe fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-accent" : "text-ink-muted",
                )}
              >
                <Icon className="h-6 w-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Navegación principal"
      className="border-border bg-plane fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r px-4 py-8 md:flex"
    >
      <p className="text-ink px-3 text-base font-semibold tracking-tight">
        Workout Tracker
      </p>

      <ul className="mt-8 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-raised text-ink"
                    : "text-ink-muted hover:bg-surface hover:text-ink",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-accent")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
