import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { redirectTo } = await searchParams;

  return (
    <>
      <header className="mb-8">
        <p className="text-ink-muted text-sm font-medium">Workout Tracker</p>
        <h1 className="text-ink mt-1 text-3xl font-semibold tracking-tight">
          Bienvenido de nuevo
        </h1>
        <p className="text-ink-secondary mt-2 text-sm">
          Entra para seguir registrando tus entrenamientos.
        </p>
      </header>

      <AuthForm
        mode="sign-in"
        action={signIn}
        redirectTo={typeof redirectTo === "string" ? redirectTo : undefined}
      />
    </>
  );
}
