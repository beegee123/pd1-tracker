-- pd1-tracker-react: topic statuses, exam scores, theme
-- Table shape after the PD1 Hub migration: one row per signed-in user,
-- readable and writable only by its owner.
-- On an existing project, run pd1-hub/supabase/pd1hub_migration.sql instead;
-- this file is for reference and for setting up a fresh project. Safe to re-run.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  id         int  not null default 1,  -- legacy, from before PD1 Hub
  statuses   jsonb   default '{}'::jsonb,
  scores     jsonb   default '{"exam1": "", "exam2": ""}'::jsonb,
  dark_mode  boolean default true
);

alter table public.progress enable row level security;

drop policy if exists "owner select" on public.progress;
drop policy if exists "owner insert" on public.progress;
drop policy if exists "owner update" on public.progress;
drop policy if exists "owner delete" on public.progress;

create policy "owner select" on public.progress for select to authenticated using (user_id = auth.uid());
create policy "owner insert" on public.progress for insert to authenticated with check (user_id = auth.uid());
create policy "owner update" on public.progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner delete" on public.progress for delete to authenticated using (user_id = auth.uid());
