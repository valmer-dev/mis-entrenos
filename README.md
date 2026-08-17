# Mis Entrenos

Tracker personal de entrenamientos: cronómetro fiable, guardado automático en
Supabase y un dashboard con estadísticas calculadas a partir de los
entrenamientos reales.

Pensado para usarse **desde el móvil, en el gimnasio**: tema oscuro, botones
grandes y navegación inferior al alcance del pulgar.

---

## Índice

1. [Stack](#stack)
2. [Puesta en marcha](#puesta-en-marcha)
3. [Variables de entorno](#variables-de-entorno)
4. [Configuración de Supabase](#configuración-de-supabase)
5. [Arquitectura de la base de datos](#arquitectura-de-la-base-de-datos)
6. [Estructura del proyecto](#estructura-del-proyecto)
7. [Cómo funciona el Dashboard](#cómo-funciona-el-dashboard)
8. [Cómo funciona el cronómetro](#cómo-funciona-el-cronómetro)
9. [Seguridad](#seguridad)
10. [Deploy en Vercel](#deploy-en-vercel)
11. [Comandos](#comandos)
12. [Cómo seguir desarrollando](#cómo-seguir-desarrollando)

---

## Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server Components: las estadísticas se calculan en el servidor y al navegador sólo llega HTML. |
| Lenguaje | **TypeScript** en modo estricto | — |
| Estilos | **Tailwind CSS v4** | Tokens de diseño en `globals.css`, sin fichero de configuración. |
| Backend y BD | **Supabase** (PostgreSQL) | Base de datos, autenticación y RLS en un mismo sitio. |
| Autenticación | **Supabase Auth** (email + contraseña) | — |
| Tests | **Vitest** | Sólo para las funciones puras de fechas y estadísticas. |
| Deploy | **Vercel** | — |

Dependencias de producción: `next`, `react`, `react-dom`, `@supabase/supabase-js`,
`@supabase/ssr` y `server-only`. No hay librería de gráficas: las visualizaciones
son HTML y CSS, así que no añaden ni un kilobyte de JavaScript al cliente.

---

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar el entorno
cp .env.example .env.local
#    …y rellenar los dos valores (ver más abajo)

# 3. Arrancar
npm run dev
```

La aplicación queda en <http://localhost:3000>.

Antes hay que crear el esquema en Supabase; si no, la aplicación mostrará una
pantalla explicando qué falta.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto: `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública del proyecto (`anon` / *publishable key*) |

Ambas están en **Supabase → Project Settings → API**.

Las dos son públicas por diseño y llegan al navegador: lo que protege los datos
no es la clave, son las políticas RLS. **La `service_role` key no se usa en
ningún punto de la aplicación** y nunca debe ponerse en una variable
`NEXT_PUBLIC_`, porque se salta RLS por completo.

`.env.local` está en `.gitignore`; `.env.example` (sin valores) sí se versiona.

---

## Configuración de Supabase

1. Crear un proyecto en <https://supabase.com/dashboard>.
2. Abrir **SQL Editor → New query**.
3. Pegar el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecutarlo.
4. Copiar la URL y la clave `anon` de **Project Settings → API** a `.env.local`.

La migración es **idempotente**: se puede volver a ejecutar sin romper nada.

### Confirmación por correo

Por defecto Supabase pide confirmar el correo al registrarse. La aplicación lo
gestiona: tras el registro muestra "revisa tu bandeja de entrada" y no deja
entrar hasta que la cuenta esté activa.

Para saltarse ese paso mientras se prueba en local:
**Authentication → Sign In / Providers → Email → desactivar "Confirm email"**.

### Con la CLI de Supabase (opcional)

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Y para regenerar los tipos de TypeScript si se cambia el esquema:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

---

## Arquitectura de la base de datos

### `workouts`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | → `auth.users(id)`, `on delete cascade` |
| `type` | `workout_type` | `gym` · `bike` · `walking` · `running` |
| `gym_type` | `gym_type` | `espalda` · `pecho` · `hombros` · `piernas` · `brazos` · `full_body` · `torso` · `otro` |
| `started_at` | `timestamptz` | Lo pone el servidor |
| `finished_at` | `timestamptz` | **`NULL` = entrenamiento en curso** |
| `duration_seconds` | `integer` | Lo calcula la base de datos |
| `notes` | `text` | Opcional, máximo 2000 caracteres |
| `created_at` / `updated_at` | `timestamptz` | — |

### `profiles`

Ligada 1:1 a `auth.users`. Hoy sólo guarda `display_name`, y se crea sola al
registrarse (trigger `on_auth_user_created`). Es el sitio donde crecerán en el
futuro el peso corporal, los objetivos o las preferencias.

### Reglas que vive en la base de datos, no en el frontend

Esto es deliberado: son garantías que se cumplen aunque haya un bug en la
interfaz, dos pestañas abiertas o alguien llamando a la API a mano.

- **`workouts_gym_type_matches_type`** — `gym` exige subtipo; el resto de
  actividades no lo admiten.
- **`workouts_finished_after_started`** — no se puede terminar antes de empezar.
- **`workouts_duration_matches_state`** — la duración existe si y sólo si el
  entrenamiento está terminado.
- **`workouts_one_active_per_user_idx`** — índice único parcial
  (`where finished_at is null`): **sólo puede haber un entrenamiento activo por
  usuario**. Ni una doble pulsación ni dos pestañas pueden crear un segundo.
- **Trigger `set_workout_duration`** — la duración se calcula siempre a partir
  de `finished_at − started_at`. El cliente no la envía y no puede falsearla.

### Índices

| Índice | Para qué |
|---|---|
| `workouts_user_started_at_idx` | Histórico y dashboard ordenados por fecha |
| `workouts_user_type_started_at_idx` | Filtro por actividad |
| `workouts_one_active_per_user_idx` | Buscar el entrenamiento activo + la garantía de unicidad |
| `workouts_user_duration_idx` | Récord de duración |

### RLS

RLS está activado en las dos tablas, con políticas separadas por operación
(`select`, `insert`, `update`, `delete`). Todas comparan
`(select auth.uid()) = user_id` — con el `select` para que Postgres evalúe la
función una vez por consulta en lugar de una vez por fila.

El rol `anon` no recibe ningún permiso: sin sesión no se accede a nada.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/                 Login y registro (sin sesión)
│   │   ├── login/
│   │   └── registro/
│   ├── (app)/                  Aplicación autenticada (nav + aviso de entreno activo)
│   │   ├── dashboard/
│   │   ├── entrenar/
│   │   │   └── completado/[id]/
│   │   ├── historico/
│   │   │   └── [id]/           Detalle del entrenamiento
│   │   └── perfil/
│   ├── error.tsx               Incluye ayuda si falta configurar Supabase
│   └── not-found.tsx
│
├── components/
│   ├── app/                    Navegación, sincronización de zona horaria
│   ├── auth/                   Formulario de login/registro
│   ├── charts/                 Gráfica de actividad y listas de reparto
│   ├── dashboard/              Filtro de periodo
│   ├── history/                Filtros del histórico
│   ├── ui/                     Botón, tarjeta, campo, modal, estado vacío…
│   └── workout/                Cronómetro, flujo de inicio, filas de entreno
│
├── lib/
│   ├── auth/                   Server actions de autenticación
│   ├── date/                   civil.ts (zonas horarias) · format.ts
│   ├── domain/                 Catálogo de actividades y periodos
│   ├── hooks/                  useElapsedSeconds
│   ├── stats/                  Cálculo del dashboard (funciones puras + tests)
│   ├── supabase/               Clientes de navegador, servidor y proxy
│   └── workouts/               Consultas y server actions
│
├── types/database.ts           Tipos generados del esquema
└── proxy.ts                    Refresco de sesión y protección de rutas
```

La separación importante: **`lib/stats` y `lib/date` no saben que Supabase
existe**. Reciben datos y devuelven números, así que se pueden testear sin base
de datos.

---

## Cómo funciona el Dashboard

Todos los datos salen de los entrenamientos reales del usuario. **No hay ni un
valor fijo ni datos de ejemplo.** Si no hay entrenamientos, todo sale a cero y
se muestra el estado vacío.

### El recorrido de un número

1. `getDashboardData(period)` resuelve el periodo a un rango de instantes **en la
   zona horaria del usuario** y lanza tres consultas en paralelo:
   entrenamientos del periodo, los 5 últimos, y el número de esta semana.
2. `computeDashboardStats()` (función pura) convierte esa lista en totales,
   repartos, récord y barras de la gráfica.
3. El Server Component pinta el resultado. Al navegador no llega ni la lista de
   entrenamientos ni lógica de cálculo.

### Filtro de periodo

Vive en la URL (`/dashboard?period=month`), así que se puede compartir y
sobrevive a recargas. Al cambiarlo se recalcula **todo** el bloque de análisis.

La gráfica de actividad **cambia de agrupación** según el periodo, de modo que
un único componente sirve para todos los casos:

| Periodo | Barras |
|---|---|
| Esta semana | 7 días, de lunes a domingo |
| Este mes | Semanas del mes (S1…S6) |
| Últimos 30 días | Semanas del rango |
| Este año | 12 meses |
| Todo | Últimos 12 meses |

Las tarjetas **"Esta semana"** y **"Último entrenamiento"**, y la lista de
últimos entrenamientos, son independientes del filtro: por definición se
refieren a la semana en curso y al entrenamiento más reciente.

### Zonas horarias (importante)

El servidor de Vercel corre en UTC. Agrupar por día con su reloj colocaría un
entrenamiento de la 01:30 del martes en el lunes.

Para evitarlo, `TimeZoneSync` escribe la zona del navegador en la cookie `tz`
y el servidor la lee (validándola) en cada cálculo. Por defecto,
`Europe/Madrid`. Toda la aritmética de calendario está en `lib/date/civil.ts`
y contempla los cambios de horario de verano — hay tests que lo comprueban.

### Decisión de diseño de las gráficas

Un solo color para todas las marcas de datos. La identidad de cada actividad la
lleva su icono (🏋️ 🚴 🚶 🏃), no el color: se lee igual de bien con cualquier
tipo de daltonismo y evita el exceso de colores. Cada gráfica tiene además su
tabla de datos desplegable, así que ningún valor depende de un tooltip.

---

## Cómo funciona el cronómetro

Un entrenamiento con `finished_at IS NULL` **es** el entrenamiento activo. No
hay estado en `localStorage` ni en memoria del navegador.

Esto tiene tres consecuencias:

- **Sobrevive a todo**: recargar, cerrar la pestaña, quedarse sin batería o
  cambiar de dispositivo. Al volver a abrir la aplicación, el cronómetro sigue
  donde estaba.
- **El tiempo no se cuenta sumando**, se recalcula como `ahora − started_at` en
  cada repintado, y también al volver a la pestaña. Un contador que suma uno por
  segundo se quedaría corto, porque los navegadores móviles congelan los
  temporizadores en segundo plano.
- **Las marcas de tiempo las pone el servidor**, y la duración la calcula
  Postgres. Si el reloj del móvil va mal, lo que se guarda sigue siendo correcto.

Mientras hay un entrenamiento en marcha, todas las pantallas muestran un aviso
con el tiempo en curso.

---

## Seguridad

- **RLS activo** en todas las tablas, con políticas por operación. Es la única
  frontera que importa: aunque el frontend tuviera un fallo, no se pueden leer
  datos ajenos.
- **`proxy.ts`** refresca la sesión y redirige a `/login` las rutas privadas.
  Es una barrera de navegación, no la de seguridad.
- **`getUser()` y nunca `getSession()`** en el servidor: `getUser()` valida el
  token contra Supabase; el contenido de `getSession()` viene de una cookie.
- **Toda escritura pasa por Server Actions**, que vuelven a comprobar el usuario
  y filtran por `user_id`.
- **Validación en las dos puntas**: los tipos y subtipos se validan en el
  servidor (`isWorkoutType`, `isGymType`) y además los garantiza un `CHECK` en
  Postgres.
- **Sin *open redirects***: el `redirectTo` del login sólo admite rutas internas.
- **`server-only`** marca los módulos que jamás deben acabar en el navegador.
- **Mensajes de error genéricos** al iniciar sesión: no se distingue entre
  "no existe el usuario" y "contraseña incorrecta", para no revelar qué correos
  están registrados.

---

## Deploy en Vercel

1. Subir el repositorio a GitHub.
2. En <https://vercel.com/new>, importar el repositorio.
3. Añadir las dos variables de entorno (**Production**, **Preview** y
   **Development**):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**. Vercel detecta Next.js sin más configuración.
5. En Supabase → **Authentication → URL Configuration**, poner la URL
   `https://<proyecto>.vercel.app` como *Site URL* para que los correos de
   confirmación apunten al sitio correcto.

---

## Comandos

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run start      # Servir el build
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
npm test           # Tests de fechas y estadísticas
```

---

## Cómo seguir desarrollando

La V1 registra tipo de actividad y tiempo. La arquitectura está preparada para
crecer **sin rehacer nada**:

### Añadir una actividad nueva (p. ej. natación)

```sql
alter type public.workout_type add value 'swimming';
```

Y una entrada en `WORKOUT_TYPES` (`src/lib/domain/workout.ts`). Ninguna pantalla
necesita cambios: el catálogo alimenta el selector, los iconos, los filtros y
las estadísticas.

Lo mismo para un grupo muscular nuevo con `gym_type` y `GYM_TYPES`.

### Ejercicios, series, repeticiones y peso

Tablas nuevas que cuelgan de `workouts`, sin tocar lo existente:

```sql
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  name text not null,
  position smallint not null
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null
    references public.workout_exercises (id) on delete cascade,
  reps smallint,
  weight_kg numeric(6,2),
  rest_seconds smallint,
  position smallint not null
);
```

Con sus propias políticas RLS (comprobando la propiedad a través de `workouts`).
El dashboard actual sigue funcionando igual, porque no lee esas tablas.

### Distancia, GPS, ritmo y calorías

Columnas opcionales en `workouts` (`distance_meters`, `elevation_gain_meters`,
`calories`…) o una tabla `workout_gps_points` para el trazado. Al ser opcionales,
los entrenamientos ya guardados siguen siendo válidos.

### Estadísticas y gráficas avanzadas

Añadir funciones a `src/lib/stats/`. Son puras y se testean sin base de datos.
Si algún cálculo crece demasiado para hacerlo en memoria, el siguiente paso
natural es una función SQL (`create function`) llamada con `supabase.rpc()`.

### Rachas, objetivos, calendario, peso corporal

- Rachas y objetivos: se calculan a partir de `workouts`, no hacen falta tablas.
- Peso corporal y fotos: tabla nueva ligada a `profiles`.
- Planificación y rutinas: tablas nuevas independientes de `workouts`.

### Reglas que conviene mantener

1. **Las estadísticas se calculan en el servidor**, en funciones puras y con
   tests.
2. **Las garantías importantes viven en Postgres** (constraints, triggers,
   índices únicos), no sólo en el frontend.
3. **Las marcas de tiempo las pone el servidor.**
4. **Nada de datos de ejemplo en producción**: si no hay datos, estado vacío.
