"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { INITIAL_AUTH_STATE, type AuthFormState } from "@/lib/auth/state";

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  action: AuthAction;
  redirectTo?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Un momento…" : label}
    </Button>
  );
}

export function AuthForm({ mode, action, redirectTo }: AuthFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_AUTH_STATE);
  const isSignUp = mode === "sign-up";

  // Tras registrarse con confirmación por correo no hay nada más que rellenar:
  // se sustituye el formulario por las instrucciones.
  if (state.status === "check-email") {
    return (
      <div className="space-y-6">
        <div className="border-accent/30 bg-accent/10 rounded-card border p-4">
          <p className="text-ink text-sm">{state.message}</p>
        </div>
        <ButtonLink href="/login" variant="secondary" size="lg" className="w-full">
          Ir a iniciar sesión
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      {isSignUp ? (
        <Field
          id="displayName"
          name="displayName"
          label="Nombre"
          type="text"
          autoComplete="name"
          maxLength={80}
          placeholder="Opcional"
          enterKeyHint="next"
        />
      ) : null}

      <Field
        id="email"
        name="email"
        label="Correo electrónico"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        enterKeyHint="next"
      />

      <Field
        id="password"
        name="password"
        label="Contraseña"
        type="password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        required
        minLength={8}
        hint={isSignUp ? "Mínimo 8 caracteres." : undefined}
        enterKeyHint="go"
      />

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="border-danger/35 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton label={isSignUp ? "Crear cuenta" : "Entrar"} />

      <p className="text-ink-secondary text-center text-sm">
        {isSignUp ? (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-ink font-medium underline underline-offset-4">
              Inicia sesión
            </Link>
          </>
        ) : (
          <>
            ¿Todavía no tienes cuenta?{" "}
            <Link
              href="/registro"
              className="text-ink font-medium underline underline-offset-4"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
