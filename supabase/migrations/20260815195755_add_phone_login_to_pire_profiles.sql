alter table public.pire_profiles
  add column if not exists phone text;

alter table public.pire_profiles
  alter column email drop not null;

create unique index if not exists pire_profiles_phone_unique
  on public.pire_profiles (phone)
  where phone is not null;

create or replace function private.handle_new_pire_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
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
      id, institution_id, email, phone, full_name, role, status,
      must_change_password, created_at, updated_at
    ) values (
      new.id, 'YON-0001', lower(new.email), new.phone, 'Kadir Yılmaz', 'Yönetici', 'Aktif',
      false, now(), now()
    )
    on conflict (id) do update set
      email = excluded.email,
      phone = coalesce(excluded.phone, public.pire_profiles.phone),
      updated_at = now();
  elsif requested_role in ('Eğitmen','Öğrenci','Veli') and requested_id is not null then
    insert into public.pire_profiles (
      id, institution_id, email, phone, full_name, role, status,
      must_change_password, created_at, updated_at
    ) values (
      new.id, requested_id, nullif(lower(coalesce(new.email, '')), ''), new.phone,
      coalesce(new.raw_app_meta_data ->> 'full_name', ''),
      requested_role, 'Aktif', true, now(), now()
    )
    on conflict (id) do update set
      phone = excluded.phone,
      full_name = excluded.full_name,
      updated_at = now();
  else
    insert into public.pire_profiles (
      id, institution_id, email, phone, full_name, role, status,
      must_change_password, created_at, updated_at
    ) values (
      new.id, 'BKL-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)),
      nullif(lower(coalesce(new.email, '')), ''), new.phone, '', 'Beklemede', 'Beklemede',
      true, now(), now()
    )
    on conflict (id) do update set
      phone = excluded.phone,
      updated_at = now();
  end if;

  return new;
end;
$function$;
