"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { deleteWorkout } from "@/lib/workouts/actions";

type DeleteWorkoutButtonProps = {
  workoutId: string;
};

/** Borrado con confirmación: es una acción que no se puede deshacer. */
export function DeleteWorkoutButton({ workoutId }: DeleteWorkoutButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="md"
        className="text-danger hover:text-danger w-full"
        onClick={() => setOpen(true)}
      >
        Eliminar entrenamiento
      </Button>

      <Modal
        open={open}
        title="¿Eliminar este entrenamiento?"
        description="Se borrará de tu histórico y dejará de contar en tus estadísticas. Esta acción no se puede deshacer."
        onClose={() => setOpen(false)}
      >
        <form action={deleteWorkout} className="flex gap-3">
          <input type="hidden" name="id" value={workoutId} />
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="danger" size="lg" className="flex-1">
            Eliminar
          </Button>
        </form>
      </Modal>
    </>
  );
}
