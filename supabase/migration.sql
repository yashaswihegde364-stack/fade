create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key,
  device_id uuid not null,
  task text not null,
  first_step text,
  planned_minutes int not null,
  actual_seconds int not null,
  start_level int not null,
  deepest_zone text not null,
  quiet_seconds int not null default 0,
  drifts int not null default 0,
  checkins_answered int not null default 0,
  checkins_missed int not null default 0,
  curve jsonb not null default '[]',
  drift_points jsonb not null default '[]',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists live_sessions (
  device_id uuid primary key,
  zone text not null,
  updated_at timestamptz not null default now()
);

alter table sessions enable row level security;
alter table live_sessions enable row level security;

create policy "anyone can insert sessions" on sessions
  for insert with check (true);

create policy "anyone can read sessions" on sessions
  for select using (true);

create policy "anyone can upsert live_sessions" on live_sessions
  for insert with check (true);

create policy "anyone can update own live_sessions" on live_sessions
  for update using (true);

create policy "anyone can read live_sessions" on live_sessions
  for select using (true);

create index if not exists sessions_device_id_idx on sessions (device_id);
create index if not exists sessions_created_at_idx on sessions (created_at desc);
create index if not exists live_sessions_updated_at_idx on live_sessions (updated_at desc);
