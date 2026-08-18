/**
 * Sustituto de `server-only` para los tests.
 *
 * El paquete real lanza un error si se importa fuera de un Server Component, y
 * eso es justo lo que queremos que haga en la aplicación. En Vitest no hay
 * frontera cliente/servidor, así que se sustituye por un módulo vacío (ver
 * `vitest.config.mts`).
 */
export {};
