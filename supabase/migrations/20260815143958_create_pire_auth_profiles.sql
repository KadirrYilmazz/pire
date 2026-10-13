
create schema if not exists private;

create table public.pire_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_id text not null unique,
  email text not null unique,
  full_name text not null default '',
  role text not null check (role in ('Yönetici','Eğitmen','Öğrenci','Veli','Beklemede')),
  status text not null default 'Beklemede' check (status in ('Aktif','Pasif','Beklemede')),
  must_change_password boolean not null default true,
  linked_student_id bigint,
  linked_teacher_id text,
  created_by uuid references auth.users(id) on delete set null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pire_profiles_role_status_idx on public.pire_profiles (role, status);
create index pire_profiles_linked_student_idx on public.pire_profiles (linked_student_id) where linked_student_id is not null;
create index pire_profiles_linked_teacher_idx on public.pire_profiles (linked_teacher_id) where linked_teacher_id is not null;

alter table public.pire_profiles enable row level security;

create or replace function private.current_user_is_pire_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pire_profiles p
    where p.id = (select auth.uid())
      and p.role = 'Yönetici'
      and p.status = 'Aktif'
  );
$$;

revoke all on function private.current_user_is_pire_admin() from public;
revoke all on function private.current_user_is_pire_admin() from anon;
grant usage on schema private to authenticated;
grant execute on function private.current_user_is_pire_admin() to authenticated;

create policy "profiles_select_own_or_admin"
on public.pire_profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_is_pire_admin())
);

create policy "profiles_admin_insert"
on public.pire_profiles
for insert
to authenticated
with check ((select private.current_user_is_pire_admin()));

create policy "profiles_admin_update"
on public.pire_profiles
for update
to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

create policy "profiles_admin_delete"
on public.pire_profiles
for delete
to authenticated
using ((select private.current_user_is_pire_admin()));

create or replace function private.set_pire_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_pire_profile_updated_at
before update on public.pire_profiles
for each row execute function private.set_pire_profile_updated_at();

create or replace function private.handle_new_pire_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  requested_id text;
  is_bootstrap_admin boolean;
begin
  is_bootstrap_admin := lower(coalesce(new.email, '')) = '__PIRE_BOOTSTRAP_ADMIN_EMAIL__';
  requested_role := coalesce(new.raw_app_meta_data ->> 'pire_role', '');
  requested_id := nullif(new.raw_app_meta_data ->> 'pire_institution_id', '');

  if is_bootstrap_admin then
    insert into public.pire_profiles (
      id, institution_id, email, full_name, role, status,
      must_change_password, created_at, updated_at
    ) values (
      new.id, 'YON-0001', lower(new.email), 'Kadir Yılmaz', 'Yönetici', 'Aktif',
      false, now(), now()
    )
    on conflict (id) do nothing;
  elsif requested_role in ('Eğitmen','Öğrenci','Veli') and requested_id is not null then
    insert into public.pire_profiles (
      id, institution_id, email, full_name, role, status,
      must_change_password, created_at, updated_at
    ) values (
      new.id, requested_id, lower(new.email),
      coalesce(new.raw_app_meta_data ->> 'full_name', ''),
      requested_role, 'Aktif', true, now(), now()
    )
    on conflict (id) do nothing;
  else
    insert into public.pire_profiles (
      id, institution_id, email, full_name, role, status,
      must_change_password, created_at, updated_at
    ) values (
      new.id, 'BKL-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)),
      lower(coalesce(new.email, '')), '', 'Beklemede', 'Beklemede',
      true, now(), now()
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_pire_auth_user() from public;
revoke all on function private.handle_new_pire_auth_user() from anon;
revoke all on function private.handle_new_pire_auth_user() from authenticated;

create trigger on_pire_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_pire_auth_user();

grant select on public.pire_profiles to authenticated;
grant insert, update, delete on public.pire_profiles to authenticated;
revoke all on public.pire_profiles from anon;
