-- Fix123 atomic attendance recording
-- Keeps attendance row and attendance history in one database transaction.

create or replace function public.pire_record_attendance(
  p_lesson_id bigint,
  p_student_id bigint,
  p_status text,
  p_late_minutes integer default 0,
  p_absence_reason text default null,
  p_parent_notified boolean default false,
  p_entered_by text default null,
  p_entered_at timestamptz default null,
  p_attendance_id bigint default null
)
returns table(attendance_id bigint, created boolean, previous_status text, current_status text, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id bigint;
  v_old_status text;
  v_created boolean := false;
  v_updated_at timestamptz;
begin
  if not private.current_user_is_pire_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if p_lesson_id is null or p_lesson_id <= 0
     or p_student_id is null or p_student_id <= 0
     or nullif(btrim(coalesce(p_status,'')),'') is null then
    raise exception 'invalid_attendance_input' using errcode = '22023';
  end if;

  if greatest(coalesce(p_late_minutes,0),0) > 1440 then
    raise exception 'invalid_late_minutes' using errcode = '22023';
  end if;

  if not exists(select 1 from public.pire_lessons l where l.id=p_lesson_id) then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;
  if not exists(select 1 from public.pire_students s where s.id=p_student_id) then
    raise exception 'student_not_found' using errcode = 'P0002';
  end if;

  if p_attendance_id is not null then
    select a.id,a.status into v_id,v_old_status
    from public.pire_attendance a
    where a.id=p_attendance_id
    for update;
    if not found then raise exception 'attendance_not_found' using errcode = 'P0002'; end if;
  else
    select a.id,a.status into v_id,v_old_status
    from public.pire_attendance a
    where a.lesson_id=p_lesson_id and a.student_id=p_student_id
    for update;
  end if;

  if v_id is null then
    insert into public.pire_attendance(
      lesson_id,student_id,status,late_minutes,absence_reason,parent_notified,entered_by,entered_at,updated_at
    ) values (
      p_lesson_id,p_student_id,btrim(p_status),greatest(coalesce(p_late_minutes,0),0),
      nullif(btrim(coalesce(p_absence_reason,'')),''),coalesce(p_parent_notified,false),
      nullif(btrim(coalesce(p_entered_by,'')),''),coalesce(p_entered_at,clock_timestamp()),clock_timestamp()
    ) returning id,public.pire_attendance.updated_at into v_id,v_updated_at;
    v_created := true;
  else
    update public.pire_attendance
    set lesson_id=p_lesson_id,
        student_id=p_student_id,
        status=btrim(p_status),
        late_minutes=greatest(coalesce(p_late_minutes,0),0),
        absence_reason=nullif(btrim(coalesce(p_absence_reason,'')),''),
        parent_notified=coalesce(p_parent_notified,false),
        entered_by=nullif(btrim(coalesce(p_entered_by,'')),''),
        entered_at=coalesce(p_entered_at,entered_at,clock_timestamp()),
        updated_at=clock_timestamp()
    where id=v_id
    returning public.pire_attendance.updated_at into v_updated_at;
  end if;

  if v_created or v_old_status is distinct from btrim(p_status) then
    insert into public.pire_attendance_history(
      attendance_id,lesson_id,student_id,old_status,new_status,package_change,changed_by,changed_at
    ) values (
      v_id,p_lesson_id,p_student_id,v_old_status,btrim(p_status),0,
      nullif(btrim(coalesce(p_entered_by,'')),''),clock_timestamp()
    );
  end if;

  return query select v_id,v_created,v_old_status,btrim(p_status),v_updated_at;
end;
$$;

revoke all on function public.pire_record_attendance(bigint,bigint,text,integer,text,boolean,text,timestamptz,bigint) from public;
revoke all on function public.pire_record_attendance(bigint,bigint,text,integer,text,boolean,text,timestamptz,bigint) from anon;
grant execute on function public.pire_record_attendance(bigint,bigint,text,integer,text,boolean,text,timestamptz,bigint) to authenticated;
