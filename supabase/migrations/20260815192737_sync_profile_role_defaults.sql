
create or replace function public.pire_sync_profile_roles()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.roles is null
     or cardinality(new.roles) = 0
     or (new.roles = array['Beklemede']::text[] and new.role <> 'Beklemede') then
    new.roles := array[new.role]::text[];
  end if;
  return new;
end;
$$;

drop trigger if exists pire_sync_profile_roles_trigger on public.pire_profiles;
create trigger pire_sync_profile_roles_trigger
before insert on public.pire_profiles
for each row execute function public.pire_sync_profile_roles();
