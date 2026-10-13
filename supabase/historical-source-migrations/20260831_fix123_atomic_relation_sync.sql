-- Fix123 atomic relation sync helpers
-- Applied to production Supabase on 2026-08-31.

create or replace function public.pire_sync_teacher_courses(p_teacher_id bigint, p_course_names text[])
returns table(teacher_id bigint, course_id bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text;
  v_course_id bigint;
begin
  if not private.current_user_is_pire_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.pire_teachers t where t.id = p_teacher_id) then
    raise exception 'teacher_not_found' using errcode = 'P0002';
  end if;

  delete from public.pire_teacher_courses tc where tc.teacher_id = p_teacher_id;

  foreach v_name in array coalesce(p_course_names, array[]::text[]) loop
    v_name := btrim(v_name);
    if v_name = '' then continue; end if;

    select c.id into v_course_id
    from public.pire_courses c
    where lower(btrim(c.name)) = lower(v_name)
    order by c.id
    limit 1;

    if v_course_id is null then
      insert into public.pire_courses(name, status)
      values (v_name, 'Aktif')
      returning id into v_course_id;
    end if;

    insert into public.pire_teacher_courses(teacher_id, course_id)
    values (p_teacher_id, v_course_id)
    on conflict do nothing;

    teacher_id := p_teacher_id;
    course_id := v_course_id;
    return next;
    v_course_id := null;
  end loop;
end;
$$;

revoke all on function public.pire_sync_teacher_courses(bigint, text[]) from public;
grant execute on function public.pire_sync_teacher_courses(bigint, text[]) to authenticated;

create or replace function public.pire_replace_lesson_students(p_lesson_id bigint, p_student_ids bigint[])
returns table(lesson_id bigint, student_id bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_student_id bigint;
begin
  if not private.current_user_is_pire_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.pire_lessons l where l.id = p_lesson_id) then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_student_ids, array[]::bigint[])) s(id)
    left join public.pire_students st on st.id = s.id
    where st.id is null
  ) then
    raise exception 'student_not_found' using errcode = '23503';
  end if;

  delete from public.pire_lesson_students ls where ls.lesson_id = p_lesson_id;

  foreach v_student_id in array coalesce(p_student_ids, array[]::bigint[]) loop
    insert into public.pire_lesson_students(lesson_id, student_id)
    values (p_lesson_id, v_student_id)
    on conflict do nothing;

    lesson_id := p_lesson_id;
    student_id := v_student_id;
    return next;
  end loop;
end;
$$;

revoke all on function public.pire_replace_lesson_students(bigint, bigint[]) from public;
grant execute on function public.pire_replace_lesson_students(bigint, bigint[]) to authenticated;
