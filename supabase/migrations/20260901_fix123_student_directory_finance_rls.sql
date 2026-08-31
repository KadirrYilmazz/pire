create table if not exists public.pire_student_directory (
  student_id bigint primary key references public.pire_students(id) on delete cascade,
  full_name text not null,
  birth_date date,
  status text not null default 'Aktif',
  updated_at timestamptz not null default now()
);

insert into public.pire_student_directory(student_id, full_name, birth_date, status, updated_at)
select id, full_name, birth_date, status, now()
from public.pire_students
on conflict (student_id) do update
set full_name = excluded.full_name,
    birth_date = excluded.birth_date,
    status = excluded.status,
    updated_at = excluded.updated_at;

alter table public.pire_student_directory enable row level security;

drop policy if exists pire_student_directory_authorized_select on public.pire_student_directory;
create policy pire_student_directory_authorized_select
on public.pire_student_directory
for select
to authenticated
using (private.current_user_can_access_pire_student(student_id));

revoke all on table public.pire_student_directory from anon;
revoke insert, update, delete, truncate, references, trigger on table public.pire_student_directory from authenticated;
grant select on table public.pire_student_directory to authenticated;

create or replace function private.sync_pire_student_directory()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.pire_student_directory where student_id = old.id;
    return old;
  end if;
  insert into public.pire_student_directory(student_id, full_name, birth_date, status, updated_at)
  values (new.id, new.full_name, new.birth_date, new.status, now())
  on conflict (student_id) do update
  set full_name = excluded.full_name,
      birth_date = excluded.birth_date,
      status = excluded.status,
      updated_at = excluded.updated_at;
  return new;
end;
$$;

revoke all on function private.sync_pire_student_directory() from public;
revoke all on function private.sync_pire_student_directory() from anon;
revoke all on function private.sync_pire_student_directory() from authenticated;

drop trigger if exists trg_pire_student_directory_sync on public.pire_students;
create trigger trg_pire_student_directory_sync
after insert or update of full_name, birth_date, status or delete
on public.pire_students
for each row execute function private.sync_pire_student_directory();

drop policy if exists pire_students_select_authorized on public.pire_students;
drop policy if exists pire_students_admin_select on public.pire_students;
create policy pire_students_admin_select
on public.pire_students
for select
to authenticated
using (private.current_user_is_pire_admin());

create or replace function private.current_user_can_access_pire_student_finance(target_student_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.current_user_is_pire_admin())
    or exists (
      select 1 from public.pire_profiles p
      where p.id = (select auth.uid())
        and p.status = 'Aktif'
        and p.linked_student_id = target_student_id
        and (p.role in ('Öğrenci','Veli') or p.roles && array['Öğrenci','Veli']::text[])
    )
    or exists (
      select 1 from public.pire_profile_students ps
      join public.pire_profiles p on p.id = ps.profile_id
      where ps.profile_id = (select auth.uid())
        and ps.student_id = target_student_id
        and p.status = 'Aktif'
        and (p.role in ('Öğrenci','Veli') or p.roles && array['Öğrenci','Veli']::text[])
    );
$$;

revoke all on function private.current_user_can_access_pire_student_finance(bigint) from public;
revoke all on function private.current_user_can_access_pire_student_finance(bigint) from anon;
revoke all on function private.current_user_can_access_pire_student_finance(bigint) from authenticated;

drop policy if exists pire_payments_authorized_select on public.pire_payments;
drop policy if exists pire_payments_finance_select on public.pire_payments;
create policy pire_payments_finance_select
on public.pire_payments
for select
to authenticated
using (private.current_user_can_access_pire_student_finance(student_id));

drop policy if exists pire_transactions_authorized_select on public.pire_payment_transactions;
drop policy if exists pire_transactions_finance_select on public.pire_payment_transactions;
create policy pire_transactions_finance_select
on public.pire_payment_transactions
for select
to authenticated
using (private.current_user_can_access_pire_student_finance(student_id));
