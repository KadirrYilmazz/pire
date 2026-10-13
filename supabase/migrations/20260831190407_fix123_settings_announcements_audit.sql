create table if not exists public.pire_institution_settings (
  id bigint primary key,
  institution_name text not null,
  address text,
  phone text,
  email text,
  working_hours jsonb not null default '{}'::jsonb,
  rooms jsonb not null default '[]'::jsonb,
  default_lesson_duration integer not null default 60,
  package_warning_threshold integer not null default 2,
  payment_due_day integer not null default 1 check (payment_due_day between 1 and 31),
  cancellation_notice_hours integer not null default 24,
  makeup_validity_days integer not null default 30,
  lesson_reminder_hours integer not null default 24,
  second_reminder_minutes integer not null default 120,
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_announcements (
  id bigint primary key,
  title text not null,
  message text not null,
  target_type text not null default 'all',
  target_value text,
  priority text not null default 'normal',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'Yayında',
  read_count integer not null default 0,
  recipient_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_announcement_reads (
  announcement_id bigint not null references public.pire_announcements(id) on delete cascade,
  profile_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (announcement_id, profile_id)
);

create table if not exists public.pire_audit_logs (
  id bigint primary key,
  actor_ref text,
  actor_institution_id text,
  actor_role text,
  action text not null,
  target_type text,
  target_id text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists pire_announcements_status_dates_idx on public.pire_announcements(status,starts_at,ends_at);
create index if not exists pire_announcement_reads_profile_idx on public.pire_announcement_reads(profile_id);
create index if not exists pire_audit_logs_created_idx on public.pire_audit_logs(created_at desc);

drop trigger if exists pire_announcements_touch_updated_at on public.pire_announcements;
create trigger pire_announcements_touch_updated_at before update on public.pire_announcements for each row execute function private.pire_touch_updated_at();

alter table public.pire_institution_settings enable row level security;
alter table public.pire_announcements enable row level security;
alter table public.pire_announcement_reads enable row level security;
alter table public.pire_audit_logs enable row level security;

drop policy if exists pire_settings_authenticated_select on public.pire_institution_settings;
create policy pire_settings_authenticated_select on public.pire_institution_settings for select to authenticated using (true);
drop policy if exists pire_settings_admin_insert on public.pire_institution_settings;
create policy pire_settings_admin_insert on public.pire_institution_settings for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_settings_admin_update on public.pire_institution_settings;
create policy pire_settings_admin_update on public.pire_institution_settings for update to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_settings_admin_delete on public.pire_institution_settings;
create policy pire_settings_admin_delete on public.pire_institution_settings for delete to authenticated using (private.current_user_is_pire_admin());

drop policy if exists pire_announcements_admin_all on public.pire_announcements;
create policy pire_announcements_admin_all on public.pire_announcements for all to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_announcement_reads_own_select on public.pire_announcement_reads;
create policy pire_announcement_reads_own_select on public.pire_announcement_reads for select to authenticated using (profile_id = auth.uid() or private.current_user_is_pire_admin());
drop policy if exists pire_announcement_reads_own_insert on public.pire_announcement_reads;
create policy pire_announcement_reads_own_insert on public.pire_announcement_reads for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists pire_audit_logs_admin_select on public.pire_audit_logs;
create policy pire_audit_logs_admin_select on public.pire_audit_logs for select to authenticated using (private.current_user_is_pire_admin());
