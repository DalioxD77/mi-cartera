create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  symbol text not null check (symbol ~ '^[A-Z][A-Z0-9.-]{0,15}$'),
  type text not null check (type in ('accion', 'crypto')),
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  asset_id uuid not null,
  condition text not null check (condition in ('menor_igual', 'mayor_igual')),
  target_price numeric not null check (target_price > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint alerts_asset_owner_fk
    foreign key (user_id, asset_id)
    references public.assets (user_id, id)
    on delete cascade
);

create table if not exists public.alert_states (
  alert_id uuid primary key references public.alerts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  last_price numeric not null check (last_price > 0),
  condition_met boolean not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fired_at timestamptz not null default now(),
  price_at_trigger numeric not null check (price_at_trigger > 0),
  message text not null
);

create index if not exists alerts_owner_active_idx
  on public.alerts (user_id, is_active);
create index if not exists alert_events_owner_fired_idx
  on public.alert_events (user_id, fired_at desc);

alter table public.assets enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_states enable row level security;
alter table public.alert_events enable row level security;

drop policy if exists "Users can read their own assets" on public.assets;
drop policy if exists "Users can create their own assets" on public.assets;
drop policy if exists "Users can update their own assets" on public.assets;
drop policy if exists "Users can delete their own assets" on public.assets;
create policy "Users can read their own assets"
  on public.assets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own assets"
  on public.assets for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own assets"
  on public.assets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own assets"
  on public.assets for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own alerts" on public.alerts;
drop policy if exists "Users can create their own alerts" on public.alerts;
drop policy if exists "Users can update their own alerts" on public.alerts;
drop policy if exists "Users can delete their own alerts" on public.alerts;
create policy "Users can read their own alerts"
  on public.alerts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own alerts"
  on public.alerts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own alerts"
  on public.alerts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own alerts"
  on public.alerts for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own alert states" on public.alert_states;
drop policy if exists "Users can read their own alert events" on public.alert_events;
create policy "Users can read their own alert states"
  on public.alert_states for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can read their own alert events"
  on public.alert_events for select to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.assets, public.alerts to authenticated;
grant select on public.alert_states, public.alert_events to authenticated;
grant all on public.assets, public.alerts, public.alert_states, public.alert_events to service_role;
