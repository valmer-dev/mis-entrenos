import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegisterPage() {
  return (
    <>
      <header className="mb-8">
        <p className="text-ink-muted text-sm font-medium">Workout Tracker</p>
        <h1 className="text-ink mt-1 text-3xl font-semibold tracking-tight">
          Crea tu cuenta
        </h1>
        <p className="text-ink-secondary mt-2 text-sm">
          Empieza a registrar tus entrenamientos en menos de un minuto.
        </p>
      </header>

      <AuthForm mode="sign-up" action={signUp} />
    </>
  );
}
