drop function if exists public.pire_get_safe_catalog();

create table if not exists public.pire_teacher_directory (
  teacher_id bigint primary key references public.pire_teachers(id) on delete cascade,
  full_name text not null,
  status text not null default 'Aktif',
  updated_at timestamptz not null default now()
);

insert into public.pire_teacher_directory(teacher_id, full_name, status, updated_at)
select id, full_name, status, now()
from public.pire_teachers
on conflict (teacher_id) do update
set full_name = excluded.full_name,
    status = excluded.status,
    updated_at = excluded.updated_at;

alter table public.pire_teacher_directory enable row level security;

drop policy if exists pire_teacher_directory_active_select on public.pire_teacher_directory;
create policy pire_teacher_directory_active_select
on public.pire_teacher_directory
for select
to authenticated
using (
  exists (
    select 1 from public.pire_profiles p
    where p.id = auth.uid()
      and coalesce(p.status, 'Aktif') = 'Aktif'
  )
);

revoke all on table public.pire_teacher_directory from anon;
revoke insert, update, delete, truncate, references, trigger on table public.pire_teacher_directory from authenticated;
grant select on table public.pire_teacher_directory to authenticated;

create or replace function private.sync_pire_teacher_directory()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.pire_teacher_directory where teacher_id = old.id;
    return old;
  end if;

  insert into public.pire_teacher_directory(teacher_id, full_name, status, updated_at)
  values (new.id, new.full_name, new.status, now())
  on conflict (teacher_id) do update
  set full_name = excluded.full_name,
      status = excluded.status,
      updated_at = excluded.updated_at;
  return new;
end;
$$;

revoke all on function private.sync_pire_teacher_directory() from public;
revoke all on function private.sync_pire_teacher_directory() from anon;
revoke all on function private.sync_pire_teacher_directory() from authenticated;

drop trigger if exists trg_pire_teacher_directory_sync on public.pire_teachers;
create trigger trg_pire_teacher_directory_sync
after insert or update of full_name, status or delete
on public.pire_teachers
for each row execute function private.sync_pire_teacher_directory();
