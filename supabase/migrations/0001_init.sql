-- ============================================================================
-- Mis Entrenos — esquema inicial (V1)
-- ----------------------------------------------------------------------------
-- Ejecutar en el SQL Editor de Supabase (o con `supabase db push`).
-- Es idempotente: se puede volver a ejecutar sin romper nada.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tipos enumerados
-- ---------------------------------------------------------------------------
-- Se usan enums en lugar de texto libre para garantizar integridad. Añadir un
-- valor nuevo en el futuro es una sola línea:
--   alter type public.gym_type add value 'gemelos';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workout_type') then
    create type public.workout_type as enum ('gym', 'bike', 'walking', 'running');
  end if;

  if not exists (select 1 from pg_type where typname = 'gym_type') then
    create type public.gym_type as enum (
      'espalda', 'pecho', 'hombros', 'piernas', 'brazos', 'full_body', 'torso', 'otro'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Perfiles
-- ---------------------------------------------------------------------------
-- Tabla mínima ligada a auth.users. Hoy sólo guarda el nombre visible, pero es
-- el sitio natural donde crecerán en el futuro: peso corporal, objetivos,
-- preferencias, zona horaria, etc.

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  )
);

comment on table public.profiles is
  'Perfil de usuario. Se crea automáticamente al registrarse (trigger on_auth_user_created).';

-- ---------------------------------------------------------------------------
-- 3. Entrenamientos
-- ---------------------------------------------------------------------------
-- Un entrenamiento con finished_at NULL es un entrenamiento EN CURSO.
-- duration_seconds lo calcula siempre la base de datos (trigger), nunca el
-- cliente: así el tiempo registrado es fiable aunque cambie el reloj del móvil.

create table if not exists public.workouts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  type             public.workout_type not null,
  gym_type         public.gym_type,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  duration_seconds integer,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- gym_type es obligatorio para 'gym' y debe estar vacío para el resto.
  constraint workouts_gym_type_matches_type check (
    (type = 'gym' and gym_type is not null)
    or (type <> 'gym' and gym_type is null)
  ),

  -- No se puede terminar un entrenamiento antes de empezarlo.
  constraint workouts_finished_after_started check (
    finished_at is null or finished_at >= started_at
  ),

  -- duration_seconds existe si y sólo si el entrenamiento está terminado.
  constraint workouts_duration_matches_state check (
    (finished_at is null and duration_seconds is null)
    or (finished_at is not null and duration_seconds is not null and duration_seconds >= 0)
  ),

  constraint workouts_notes_length check (
    notes is null or char_length(notes) <= 2000
  )
);

comment on table public.workouts is
  'Entrenamientos del usuario. finished_at NULL = entrenamiento en curso.';
comment on column public.workouts.duration_seconds is
  'Calculado por el trigger set_workout_duration a partir de started_at/finished_at.';

-- ---------------------------------------------------------------------------
-- 4. Índices
-- ---------------------------------------------------------------------------

-- Consulta principal: histórico y dashboard del usuario ordenados por fecha.
create index if not exists workouts_user_started_at_idx
  on public.workouts (user_id, started_at desc);

-- Filtros por tipo de actividad en el histórico y el dashboard.
create index if not exists workouts_user_type_started_at_idx
  on public.workouts (user_id, type, started_at desc);

-- Sólo puede haber UN entrenamiento activo por usuario. Esta restricción vive
-- en la base de datos, así que ni una doble pulsación ni dos pestañas abiertas
-- pueden crear un segundo entrenamiento en curso.
create unique index if not exists workouts_one_active_per_user_idx
  on public.workouts (user_id)
  where finished_at is null;

-- Índice para el "entrenamiento más largo" y las estadísticas de duración.
create index if not exists workouts_user_duration_idx
  on public.workouts (user_id, duration_seconds desc)
  where finished_at is not null;

-- ---------------------------------------------------------------------------
-- 5. Triggers
-- ---------------------------------------------------------------------------

-- 5.1 La duración la calcula siempre el servidor.
create or replace function public.set_workout_duration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.finished_at is null then
    new.duration_seconds := null;
  else
    new.duration_seconds := greatest(
      0,
      floor(extract(epoch from (new.finished_at - new.started_at)))::integer
    );
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists workouts_set_duration on public.workouts;
create trigger workouts_set_duration
  before insert or update on public.workouts
  for each row execute function public.set_workout_duration();

-- 5.2 updated_at en perfiles.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 5.3 Crear el perfil automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------
-- Sin estas políticas la tabla queda completamente inaccesible desde el
-- cliente. Cada usuario sólo puede ver y modificar sus propias filas.
-- Se usa `(select auth.uid())` en lugar de `auth.uid()` para que Postgres
-- evalúe la función una sola vez por consulta (initplan) en lugar de por fila.

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

-- 6.1 Perfiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 6.2 Entrenamientos
drop policy if exists workouts_select_own on public.workouts;
create policy workouts_select_own on public.workouts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists workouts_insert_own on public.workouts;
create policy workouts_insert_own on public.workouts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists workouts_update_own on public.workouts;
create policy workouts_update_own on public.workouts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists workouts_delete_own on public.workouts;
create policy workouts_delete_own on public.workouts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 7. Permisos
-- ---------------------------------------------------------------------------
-- Supabase ya concede estos permisos por defecto, pero se declaran de forma
-- explícita para que el esquema sea reproducible en cualquier proyecto.
-- El rol `anon` no recibe ningún permiso: sin sesión no se accede a los datos.

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update on public.profiles to authenticated;
