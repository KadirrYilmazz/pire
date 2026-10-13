
alter table public.pire_profiles
  add column if not exists roles text[];

update public.pire_profiles
set roles = array[role]
where roles is null or cardinality(roles) = 0;

alter table public.pire_profiles
  alter column roles set default array['Beklemede']::text[],
  alter column roles set not null;

alter table public.pire_profiles
  drop constraint if exists pire_profiles_roles_valid;

alter table public.pire_profiles
  add constraint pire_profiles_roles_valid
  check (
    cardinality(roles) > 0
    and roles <@ array['Yönetici','Eğitmen','Öğrenci','Veli','Beklemede']::text[]
  );

update public.pire_profiles
set roles = array['Yönetici','Eğitmen']::text[],
    linked_teacher_id = '1'
where email = '__PIRE_BOOTSTRAP_ADMIN_EMAIL__';
