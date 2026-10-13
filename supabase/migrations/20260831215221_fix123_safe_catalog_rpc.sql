create or replace function public.pire_get_safe_catalog()
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_active boolean;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Oturum doğrulanamadı' using errcode = '42501';
  end if;

  select exists(
    select 1
    from public.pire_profiles p
    where p.id = auth.uid()
      and coalesce(p.status, 'Aktif') = 'Aktif'
  ) into v_active;

  if not v_active then
    raise exception 'Aktif profil bulunamadı' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'teachers', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'type', 'teacher',
          'name', t.full_name,
          'courses', coalesce((
            select jsonb_agg(c.name order by c.name)
            from public.pire_teacher_courses tc
            join public.pire_courses c on c.id = tc.course_id
            where tc.teacher_id = t.id and c.status = 'Aktif'
          ), '[]'::jsonb),
          'status', t.status
        ) order by t.full_name
      )
      from public.pire_teachers t
      where t.status = 'Aktif'
    ), '[]'::jsonb),
    'courses', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', c.id, 'type', 'course', 'name', c.name, 'status', c.status)
        order by c.name
      )
      from public.pire_courses c
      where c.status = 'Aktif'
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.pire_get_safe_catalog() from public;
revoke all on function public.pire_get_safe_catalog() from anon;
grant execute on function public.pire_get_safe_catalog() to authenticated;
