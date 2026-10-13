begin;

create or replace function private.sync_pire_ai_student_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.pire_ai_students where id = old.id;
    return old;
  end if;

  insert into public.pire_ai_students(id, status, monthly_fee, payment_day, created_at, updated_at)
  values (new.id, new.status, new.monthly_fee, new.payment_day, new.created_at, new.updated_at)
  on conflict (id) do update
  set status = excluded.status,
      monthly_fee = excluded.monthly_fee,
      payment_day = excluded.payment_day,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.sync_pire_ai_student_snapshot() from public;
revoke all on function private.sync_pire_ai_student_snapshot() from anon;
revoke all on function private.sync_pire_ai_student_snapshot() from authenticated;

drop trigger if exists trg_pire_students_ai_snapshot_sync on public.pire_students;
create trigger trg_pire_students_ai_snapshot_sync
after insert or update of status, monthly_fee, payment_day, updated_at or delete
on public.pire_students
for each row execute function private.sync_pire_ai_student_snapshot();

commit;
