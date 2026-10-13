-- Record schema objects already present in production but absent from migration history.
-- Existing values, grants and policies are preserved.
begin;
alter table public.pire_profiles
  add column if not exists gender text not null default 'Belirtilmedi';
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.pire_profiles'::regclass and conname='pire_profiles_gender_check'
  ) then
    alter table public.pire_profiles add constraint pire_profiles_gender_check
      check (gender in ('Erkek','Kadın','Belirtilmedi'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.pire_profile_students'::regclass and conname='pire_profile_students_relationship_check'
  ) then
    alter table public.pire_profile_students add constraint pire_profile_students_relationship_check
      check (relationship in ('Kendi','Anne','Baba','Vasi','Diğer'));
  end if;
end;
$$;
commit;
