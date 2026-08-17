/**
 * Estado que devuelven las server actions de entrenamientos al formulario que
 * las llama. En módulo aparte porque un fichero "use server" sólo puede
 * exportar funciones asíncronas.
 */
export type WorkoutActionState = {
  status: "idle" | "error";
  message: string | null;
};

export const INITIAL_WORKOUT_ACTION_STATE: WorkoutActionState = {
  status: "idle",
  message: null,
};
