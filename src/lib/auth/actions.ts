"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { type AuthFormState } from "@/lib/auth/state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Traduce los errores de Supabase Auth (en inglés y con detalles técnicos) a
 * mensajes útiles en castellano. Deliberadamente no se distingue entre "no
 * existe el usuario" y "contraseña incorrecta": eso permitiría averiguar qué
 * correos están registrados.
 */
function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Todavía no has confirmado tu correo. Revisa tu bandeja de entrada.";
  }
  if (normalized.includes("user already registered")) {
    return "Ya existe una cuenta con este correo. Inicia sesión.";
  }
  if (normalized.includes("password")) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Demasiados intentos. Espera un momento y vuelve a probar.";
  }

  return "No se ha podido completar la operación. Inténtalo de nuevo.";
}

function readCredentials(formData: FormData): {
  email: string;
  password: string;
  error: string | null;
} {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_PATTERN.test(email)) {
    return { email, password, error: "Introduce un correo electrónico válido." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      email,
      password,
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  return { email, password, error: null };
}

/** Sitio al que volver tras iniciar sesión, validado para evitar open redirects. */
function safeRedirectTarget(value: FormDataEntryValue | null): string {
  const target = typeof value === "string" ? value : "";
  const isInternalPath = target.startsWith("/") && !target.startsWith("//");
  return isInternalPath ? target : "/dashboard";
}

export async function signIn(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password, error } = readCredentials(formData);
  if (error) return { status: "error", message: error };

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { status: "error", message: translateAuthError(signInError.message) };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectTarget(formData.get("redirectTo")));
}

export async function signUp(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password, error } = readCredentials(formData);
  if (error) return { status: "error", message: error };

  const displayName = String(formData.get("displayName") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { display_name: displayName.slice(0, 80) } : undefined,
    },
  });

  if (signUpError) {
    return { status: "error", message: translateAuthError(signUpError.message) };
  }

  // Si el proyecto exige confirmación por correo, Supabase crea el usuario pero
  // no devuelve sesión. En ese caso no se puede entrar todavía.
  if (!data.session) {
    return {
      status: "check-email",
      message:
        "Te hemos enviado un correo de confirmación. Ábrelo para activar tu cuenta y después inicia sesión.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
