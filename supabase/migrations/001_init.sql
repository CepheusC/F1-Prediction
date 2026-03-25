create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
begin
  v_nickname := coalesce(new.raw_user_meta_data->>'nickname', new.email, 'user');
  insert into public.profiles (user_id, nickname)
  values (new.id, v_nickname)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select auth.role() = 'service_role';
$$;

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists drivers_set_updated_at on public.drivers;
create trigger drivers_set_updated_at
before update on public.drivers
for each row execute function public.set_updated_at();

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.race_events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  round int not null,
  grand_prix_name text not null,
  session_type text not null check (session_type in ('Quali', 'Race', 'Sprint', 'Sprint Quali')),
  event_date date not null,
  prediction_deadline timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'locked', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, round, session_type)
);

drop trigger if exists race_events_set_updated_at on public.race_events;
create trigger race_events_set_updated_at
before update on public.race_events
for each row execute function public.set_updated_at();

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.race_events(id) on delete cascade,
  position_1_driver_id uuid not null references public.drivers(id),
  position_2_driver_id uuid not null references public.drivers(id),
  position_3_driver_id uuid not null references public.drivers(id),
  position_4_driver_id uuid not null references public.drivers(id),
  position_5_driver_id uuid not null references public.drivers(id),
  submitted_at timestamptz not null default now(),
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id),
  check (
    position_1_driver_id <> position_2_driver_id and
    position_1_driver_id <> position_3_driver_id and
    position_1_driver_id <> position_4_driver_id and
    position_1_driver_id <> position_5_driver_id and
    position_2_driver_id <> position_3_driver_id and
    position_2_driver_id <> position_4_driver_id and
    position_2_driver_id <> position_5_driver_id and
    position_3_driver_id <> position_4_driver_id and
    position_3_driver_id <> position_5_driver_id and
    position_4_driver_id <> position_5_driver_id
  )
);

drop trigger if exists predictions_set_updated_at on public.predictions;
create trigger predictions_set_updated_at
before update on public.predictions
for each row execute function public.set_updated_at();

create or replace function public.enforce_prediction_deadline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deadline timestamptz;
begin
  select re.prediction_deadline into v_deadline
  from public.race_events re
  where re.id = new.event_id;

  if v_deadline is null then
    raise exception 'Unknown event_id';
  end if;

  if now() >= v_deadline then
    new.is_locked := true;
  end if;

  if tg_op = 'UPDATE' then
    if old.is_locked = true then
      raise exception 'Prediction is locked';
    end if;
    if now() >= v_deadline then
      raise exception 'Prediction deadline passed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists predictions_enforce_deadline on public.predictions;
create trigger predictions_enforce_deadline
before insert or update on public.predictions
for each row execute function public.enforce_prediction_deadline();

create table if not exists public.race_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.race_events(id) on delete cascade,
  position_1_driver_id uuid not null references public.drivers(id),
  position_2_driver_id uuid not null references public.drivers(id),
  position_3_driver_id uuid not null references public.drivers(id),
  position_4_driver_id uuid not null references public.drivers(id),
  position_5_driver_id uuid not null references public.drivers(id),
  is_finalized boolean not null default false,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    position_1_driver_id <> position_2_driver_id and
    position_1_driver_id <> position_3_driver_id and
    position_1_driver_id <> position_4_driver_id and
    position_1_driver_id <> position_5_driver_id and
    position_2_driver_id <> position_3_driver_id and
    position_2_driver_id <> position_4_driver_id and
    position_2_driver_id <> position_5_driver_id and
    position_3_driver_id <> position_4_driver_id and
    position_3_driver_id <> position_5_driver_id and
    position_4_driver_id <> position_5_driver_id
  )
);

drop trigger if exists race_results_set_updated_at on public.race_results;
create trigger race_results_set_updated_at
before update on public.race_results
for each row execute function public.set_updated_at();

create or replace function public.enforce_result_finalized()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_finalized = true then
    raise exception 'Race result finalized';
  end if;

  if new.is_finalized = true and old.is_finalized = false then
    new.finalized_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists race_results_enforce_finalized on public.race_results;
create trigger race_results_enforce_finalized
before update on public.race_results
for each row execute function public.enforce_result_finalized();

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.race_events(id) on delete cascade,
  score int not null,
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

drop trigger if exists scores_set_updated_at on public.scores;
create trigger scores_set_updated_at
before update on public.scores
for each row execute function public.set_updated_at();

create table if not exists public.user_season_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  total_score int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, season_id)
);

alter table public.user_season_scores enable row level security;
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.seasons enable row level security;
alter table public.race_events enable row level security;
alter table public.predictions enable row level security;
alter table public.race_results enable row level security;
alter table public.scores enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select
to authenticated
using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists drivers_select_all on public.drivers;
create policy drivers_select_all on public.drivers
for select
to anon, authenticated
using (true);

drop policy if exists drivers_admin_write on public.drivers;
create policy drivers_admin_write on public.drivers
for all
to authenticated
using (public.is_admin() or public.is_service_role())
with check (public.is_admin() or public.is_service_role());

drop policy if exists seasons_select_all on public.seasons;
create policy seasons_select_all on public.seasons
for select
to anon, authenticated
using (true);

drop policy if exists seasons_admin_write on public.seasons;
create policy seasons_admin_write on public.seasons
for all
to authenticated
using (public.is_admin() or public.is_service_role())
with check (public.is_admin() or public.is_service_role());

drop policy if exists race_events_select_all on public.race_events;
create policy race_events_select_all on public.race_events
for select
to anon, authenticated
using (true);

drop policy if exists race_events_admin_write on public.race_events;
create policy race_events_admin_write on public.race_events
for all
to authenticated
using (public.is_admin() or public.is_service_role())
with check (public.is_admin() or public.is_service_role());

drop policy if exists predictions_select_owner on public.predictions;
create policy predictions_select_owner on public.predictions
for select
to authenticated
using (auth.uid() = user_id or public.is_admin() or public.is_service_role());

drop policy if exists predictions_insert_owner on public.predictions;
create policy predictions_insert_owner on public.predictions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists predictions_update_owner on public.predictions;
create policy predictions_update_owner on public.predictions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists race_results_select_all on public.race_results;
create policy race_results_select_all on public.race_results
for select
to anon, authenticated
using (true);

drop policy if exists race_results_admin_write on public.race_results;
create policy race_results_admin_write on public.race_results
for all
to authenticated
using (public.is_admin() or public.is_service_role())
with check (public.is_admin() or public.is_service_role());

drop policy if exists scores_select_all on public.scores;
create policy scores_select_all on public.scores
for select
to anon, authenticated
using (true);

drop policy if exists scores_admin_write on public.scores;
create policy scores_admin_write on public.scores
for all
to authenticated
using (public.is_admin() or public.is_service_role())
with check (public.is_admin() or public.is_service_role());

drop policy if exists user_season_scores_select_all on public.user_season_scores;
create policy user_season_scores_select_all on public.user_season_scores
for select
to anon, authenticated
using (true);

drop policy if exists user_season_scores_admin_write on public.user_season_scores;
create policy user_season_scores_admin_write on public.user_season_scores
for all
to authenticated
using (public.is_admin() or public.is_service_role())
with check (public.is_admin() or public.is_service_role());

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.drivers to anon, authenticated;
grant select on public.seasons to anon, authenticated;
grant select on public.race_events to anon, authenticated;
grant select, insert, update on public.predictions to authenticated;
grant select on public.race_results to anon, authenticated;
grant select on public.scores to anon, authenticated;
grant select on public.user_season_scores to anon, authenticated;

create index if not exists idx_race_events_season_round on public.race_events(season_id, round);
create index if not exists idx_predictions_event on public.predictions(event_id);
create index if not exists idx_scores_event on public.scores(event_id);
create index if not exists idx_user_season_scores_season on public.user_season_scores(season_id);
