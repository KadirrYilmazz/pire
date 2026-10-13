-- Additive migration: apply before publishing the Fix142 API/client.
-- No existing student, lesson or package records are changed.
begin;

create table public.pire_student_registrations (
  created_by uuid not null default auth.uid(),
  request_id uuid not null,
  request_hash text not null,
  student_id bigint not null references public.pire_students(id) on delete cascade,
  lesson_id bigint references public.pire_lessons(id) on delete set null,
  package_id bigint references public.pire_packages(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (created_by,request_id)
);
create index pire_student_registrations_student_idx on public.pire_student_registrations(student_id);
create index pire_student_registrations_lesson_idx on public.pire_student_registrations(lesson_id);
create index pire_student_registrations_package_idx on public.pire_student_registrations(package_id);
alter table public.pire_student_registrations enable row level security;
revoke all on public.pire_student_registrations from public,anon,authenticated;
grant select,insert on public.pire_student_registrations to authenticated;
create policy pire_student_registrations_admin_select
on public.pire_student_registrations for select to authenticated
using ((select private.current_user_is_pire_admin()) and created_by=(select auth.uid()));
create policy pire_student_registrations_admin_insert
on public.pire_student_registrations for insert to authenticated
with check ((select private.current_user_is_pire_admin()) and created_by=(select auth.uid()));

create function public.pire_register_student(p_request_id uuid,p_student jsonb,p_plan jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.pire_student_registrations%rowtype;
  v_student public.pire_students%rowtype;
  v_course public.pire_courses%rowtype;
  v_teacher public.pire_teachers%rowtype;
  v_lesson_id bigint;
  v_package_id bigint;
  v_hash text;
  v_create_lesson boolean;
  v_create_package boolean;
  v_start time;
  v_end time;
  v_total integer;
begin
  if auth.uid() is null or not private.current_user_is_pire_admin() then
    raise exception 'admin_required' using errcode='42501';
  end if;
  if p_request_id is null or jsonb_typeof(p_student) is distinct from 'object'
    or jsonb_typeof(p_plan) is distinct from 'object' then
    raise exception 'invalid_registration' using errcode='22023';
  end if;

  -- Serialize retries for the same user/operation; no global student lock.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text||p_request_id::text,0));
  v_hash:=pg_catalog.md5(p_student::text||'|'||p_plan::text);
  select * into v_request from public.pire_student_registrations
  where created_by=auth.uid() and request_id=p_request_id;
  if found then
    if v_request.request_hash<>v_hash then
      raise exception 'registration_request_conflict' using errcode='22023';
    end if;
    select * into strict v_student from public.pire_students where id=v_request.student_id;
    return jsonb_build_object('student',to_jsonb(v_student),'lesson_id',v_request.lesson_id,'package_id',v_request.package_id,'replayed',true);
  end if;

  if nullif(btrim(p_student->>'full_name'),'') is null
    or jsonb_typeof(p_plan->'createLesson') is distinct from 'boolean'
    or jsonb_typeof(p_plan->'createPackage') is distinct from 'boolean' then
    raise exception 'invalid_registration' using errcode='22023';
  end if;
  v_create_lesson:=(p_plan->>'createLesson')::boolean;
  v_create_package:=(p_plan->>'createPackage')::boolean;
  select * into v_course from public.pire_courses
  where lower(btrim(name))=lower(btrim(p_plan->>'course')) and status='Aktif'
  order by id limit 1;
  if not found then raise exception 'registration_course_not_found' using errcode='22023'; end if;

  if v_create_lesson then
    select * into v_teacher from public.pire_teachers
    where lower(btrim(full_name))=lower(btrim(p_plan->>'teacher')) and status='Aktif'
    order by id limit 1;
    if not found then raise exception 'registration_teacher_not_found' using errcode='22023'; end if;
    v_start:=(p_plan->>'startTime')::time;
    v_end:=(p_plan->>'endTime')::time;
    if v_start is null or v_end is null or v_end<=v_start
      or nullif(btrim(p_plan->>'room'),'') is null or (p_plan->>'lessonDate')::date is null then
      raise exception 'invalid_registration_lesson' using errcode='22023';
    end if;
  end if;
  if v_create_package then
    v_total:=(p_plan->>'totalLessons')::integer;
    if v_total is null or v_total<1 or v_total>100000
      or (p_plan->>'packageStart')::date is null or (p_plan->>'packageEnd')::date is null
      or (p_plan->>'packageEnd')::date<(p_plan->>'packageStart')::date then
      raise exception 'invalid_registration_package' using errcode='22023';
    end if;
  end if;

  insert into public.pire_students (
    full_name,birth_date,blood_group,phone,address,national_id,heard_from,registration_date,
    guardian_name,guardian_relation,guardian_phone,guardian_phone_2,guardian_national_id,
    emergency_contact,monthly_fee,payment_day,status,notes
  ) values (
    btrim(p_student->>'full_name'),(p_student->>'birth_date')::date,p_student->>'blood_group',
    p_student->>'phone',p_student->>'address',p_student->>'national_id',p_student->>'heard_from',
    coalesce((p_student->>'registration_date')::date,current_date),p_student->>'guardian_name',
    p_student->>'guardian_relation',p_student->>'guardian_phone',p_student->>'guardian_phone_2',
    p_student->>'guardian_national_id',p_student->>'emergency_contact',
    coalesce((p_student->>'monthly_fee')::numeric,0),coalesce((p_student->>'payment_day')::smallint,1),
    coalesce(p_student->>'status','Aktif'),p_student->>'notes'
  ) returning * into v_student;

  if v_create_lesson then
    insert into public.pire_lessons (
      course_id,course_name,teacher_id,teacher_name,lesson_type,lesson_date,start_time,end_time,
      duration_minutes,room,recurrence,pricing_type,status
    ) values (
      v_course.id,v_course.name,v_teacher.id,v_teacher.full_name,'Birebir ders',
      (p_plan->>'lessonDate')::date,v_start,v_end,
      (extract(epoch from (v_end-v_start))/60)::integer,p_plan->>'room',
      coalesce(p_plan->>'recurrence','Tek seferlik'),
      case when v_create_package then 'Ders paketi' else 'Ders başına' end,'Planlandı'
    ) returning id into v_lesson_id;
    insert into public.pire_lesson_students(lesson_id,student_id) values (v_lesson_id,v_student.id);
  end if;
  if v_create_package then
    insert into public.pire_packages (
      student_id,course_id,course_name,total_lessons,used_lessons,remaining_lessons,
      makeup_rights,frozen_lessons,start_date,end_date,status
    ) values (
      v_student.id,v_course.id,v_course.name,v_total,0,v_total,0,0,
      (p_plan->>'packageStart')::date,(p_plan->>'packageEnd')::date,'Aktif'
    ) returning id into v_package_id;
  end if;
  insert into public.pire_student_registrations(created_by,request_id,request_hash,student_id,lesson_id,package_id)
  values (auth.uid(),p_request_id,v_hash,v_student.id,v_lesson_id,v_package_id);
  return jsonb_build_object('student',to_jsonb(v_student),'lesson_id',v_lesson_id,'package_id',v_package_id,'replayed',false);
end;
$$;
revoke all on function public.pire_register_student(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.pire_register_student(uuid,jsonb,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
