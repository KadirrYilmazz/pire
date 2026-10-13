begin;
alter table public.pire_profiles
  drop constraint if exists pire_profiles_linked_student_id_fkey;
alter table public.pire_profiles
  add constraint pire_profiles_linked_student_id_fkey
  foreign key (linked_student_id)
  references public.pire_students(id)
  on update cascade
  on delete set null;
commit;
