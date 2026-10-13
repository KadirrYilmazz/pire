create table if not exists public.pire_notification_reads (
  profile_id uuid not null references public.pire_profiles(id) on delete cascade,
  notification_key text not null,
  read_at timestamptz not null default now(),
  primary key (profile_id, notification_key)
);
alter table public.pire_notification_reads enable row level security;
drop policy if exists pire_notification_reads_select on public.pire_notification_reads;
create policy pire_notification_reads_select on public.pire_notification_reads for select to authenticated using (profile_id = auth.uid());
drop policy if exists pire_notification_reads_insert on public.pire_notification_reads;
create policy pire_notification_reads_insert on public.pire_notification_reads for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists pire_notification_reads_delete on public.pire_notification_reads;
create policy pire_notification_reads_delete on public.pire_notification_reads for delete to authenticated using (profile_id = auth.uid());
revoke all on table public.pire_notification_reads from anon;
grant select,insert,delete on table public.pire_notification_reads to authenticated;
