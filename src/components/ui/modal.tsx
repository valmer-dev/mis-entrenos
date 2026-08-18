"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Diálogo de confirmación.
 *
 * Se apoya en el elemento nativo `<dialog>`: trae gratis el foco atrapado, el
 * cierre con Escape y la semántica correcta para lectores de pantalla.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Cierra al tocar fuera del contenido (el ::backdrop es el propio dialog).
        if (event.target === dialogRef.current) onClose();
      }}
      aria-labelledby="modal-title"
      className="bg-surface border-border text-ink backdrop-themed open:flex m-auto w-[min(28rem,calc(100vw-2rem))] flex-col rounded-2xl border p-6 backdrop:backdrop-blur-sm"
    >
      <h2 id="modal-title" className="text-lg font-semibold text-balance">
        {title}
      </h2>
      {description ? (
        <p className="text-ink-secondary mt-2 text-sm text-pretty">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </dialog>
  );
}
