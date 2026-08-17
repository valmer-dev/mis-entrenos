/**
 * Estado compartido entre las server actions de autenticación y el formulario
 * de cliente que las invoca con `useActionState`.
 *
 * Vive en su propio módulo porque un fichero "use server" sólo puede exportar
 * funciones asíncronas.
 */
export type AuthFormState = {
  status: "idle" | "error" | "check-email";
  message: string | null;
};

export const INITIAL_AUTH_STATE: AuthFormState = {
  status: "idle",
  message: null,
};
