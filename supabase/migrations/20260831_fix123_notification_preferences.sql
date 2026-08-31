create table if not exists public.pire_notification_preferences (
  profile_id uuid primary key references public.pire_profiles(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.pire_notification_preferences enable row level security;
drop policy if exists pire_notification_preferences_select on public.pire_notification_preferences;
create policy pire_notification_preferences_select on public.pire_notification_preferences for select to authenticated using (profile_id = auth.uid() or private.current_user_is_pire_admin());
drop policy if exists pire_notification_preferences_insert on public.pire_notification_preferences;
create policy pire_notification_preferences_insert on public.pire_notification_preferences for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists pire_notification_preferences_update on public.pire_notification_preferences;
create policy pire_notification_preferences_update on public.pire_notification_preferences for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
revoke all on table public.pire_notification_preferences from anon;
grant select,insert,update on table public.pire_notification_preferences to authenticated;
