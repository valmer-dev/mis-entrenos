"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isGymType, isWorkoutType } from "@/lib/domain/workout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkoutActionState } from "@/lib/workouts/state";

/**
 * Escrituras sobre los entrenamientos.
 *
 * Dos decisiones importantes viven aquí:
 *
 *  - Las marcas de tiempo (`started_at`, `finished_at`) las pone el servidor,
 *    nunca el navegador. Si el reloj del móvil va mal, la duración registrada
 *    sigue siendo correcta.
 *  - La duración no se envía: la calcula un trigger de Postgres a partir de
 *    esas dos marcas. El cliente no puede falsearla.
 */

const MAX_NOTES_LENGTH = 2000;

/** Violación de índice único: ya existe un entrenamiento en curso. */
const UNIQUE_VIOLATION = "23505";

function revalidateWorkoutViews(): void {
  revalidatePath("/dashboard");
  revalidatePath("/entrenar");
  revalidatePath("/historico");
}

/**
 * Arranca un entrenamiento y deja al usuario en la pantalla del cronómetro.
 *
 * No hace falta comprobar antes si ya hay uno activo: el índice único parcial
 * de la base de datos lo impide, y así ni una doble pulsación ni dos pestañas
 * abiertas pueden crear dos entrenamientos a la vez.
 */
export async function startWorkout(
  _previousState: WorkoutActionState,
  formData: FormData,
): Promise<WorkoutActionState> {
  const type = formData.get("type");
  const rawGymType = formData.get("gymType");

  if (!isWorkoutType(type)) {
    return { status: "error", message: "Selecciona una actividad válida." };
  }

  const gymType = type === "gym" ? rawGymType : null;

  if (type === "gym" && !isGymType(gymType)) {
    return { status: "error", message: "Selecciona qué vas a entrenar." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.from("workouts").insert({
    user_id: user.id,
    type,
    gym_type: isGymType(gymType) ? gymType : null,
    started_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      // Ya había uno en curso: llevar al cronómetro es justo lo que se espera.
      revalidateWorkoutViews();
      redirect("/entrenar");
    }
    return {
      status: "error",
      message: "No se ha podido iniciar el entrenamiento. Inténtalo de nuevo.",
    };
  }

  revalidateWorkoutViews();
  redirect("/entrenar");
}

/**
 * Cierra el entrenamiento en curso y lleva a la pantalla de confirmación.
 */
export async function finishWorkout(
  _previousState: WorkoutActionState,
  formData: FormData,
): Promise<WorkoutActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { status: "error", message: "No hay ningún entrenamiento activo." };
  }

  const rawNotes = String(formData.get("notes") ?? "").trim();
  const notes = rawNotes ? rawNotes.slice(0, MAX_NOTES_LENGTH) : null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("workouts")
    .update({ finished_at: new Date().toISOString(), notes })
    .eq("id", id)
    .eq("user_id", user.id)
    // Sólo cierra el entrenamiento si sigue abierto: si otra pestaña ya lo ha
    // finalizado, no se machaca la hora de fin original.
    .is("finished_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: "error",
      message: "No se ha podido guardar el entrenamiento. Inténtalo de nuevo.",
    };
  }

  revalidateWorkoutViews();

  if (!data) {
    // Ya estaba cerrado (doble envío o segunda pestaña): se muestra su resumen.
    redirect(`/entrenar/completado/${id}`);
  }

  redirect(`/entrenar/completado/${data.id}`);
}

/**
 * Descarta el entrenamiento en curso sin guardarlo. Para cuando se pulsa
 * "empezar" por error: mejor eso que dejar registros de 4 segundos.
 */
export async function discardWorkout(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .is("finished_at", null);

  revalidateWorkoutViews();
  redirect("/entrenar");
}

/** Borra un entrenamiento ya guardado desde su pantalla de detalle. */
export async function deleteWorkout(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("workouts").delete().eq("id", id).eq("user_id", user.id);

  revalidateWorkoutViews();
  redirect("/historico");
}
