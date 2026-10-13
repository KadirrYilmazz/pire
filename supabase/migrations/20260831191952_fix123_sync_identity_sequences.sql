select setval('public.pire_students_id_seq', coalesce((select max(id) from public.pire_students),1), true);
select setval('public.pire_teachers_id_seq', coalesce((select max(id) from public.pire_teachers),1), true);
select setval('public.pire_courses_id_seq', coalesce((select max(id) from public.pire_courses),1), true);
