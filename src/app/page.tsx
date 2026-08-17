import { redirect } from "next/navigation";

/**
 * La raíz no tiene contenido propio: el middleware ya decide si hay sesión.
 * Con sesión se entra al dashboard; sin ella, redirige al login.
 */
export default function HomePage() {
  redirect("/dashboard");
}
