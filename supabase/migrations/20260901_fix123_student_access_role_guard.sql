create or replace function private.current_user_can_access_pire_student(target_student_id bigint)
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
    )
    or exists (
      select 1 from public.pire_teacher_students ts
      join public.pire_profiles p on p.id = ts.profile_id
      where ts.profile_id = (select auth.uid())
        and ts.student_id = target_student_id
        and p.status = 'Aktif'
        and (p.role = 'Eğitmen' or p.roles @> array['Eğitmen']::text[])
    );
$$;
