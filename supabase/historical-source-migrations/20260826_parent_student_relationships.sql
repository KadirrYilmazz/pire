alter table public.pire_profile_students
  drop constraint if exists pire_profile_students_relationship_check;

alter table public.pire_profile_students
  add constraint pire_profile_students_relationship_check
  check (relationship in ('Kendi','Anne','Baba','Vasi','Diğer'));

alter table public.pire_profiles
  drop constraint if exists pire_profiles_linked_student_id_fkey;

alter table public.pire_profiles
  add constraint pire_profiles_linked_student_id_fkey
  foreign key (linked_student_id)
  references public.pire_ai_students(id)
  on update cascade
  on delete set null
  not valid;

alter table public.pire_profiles
  validate constraint pire_profiles_linked_student_id_fkey;

insert into public.pire_profile_students(profile_id,student_id,relationship)
select id,linked_student_id,case when role='Öğrenci' then 'Kendi' else 'Diğer' end
from public.pire_profiles
where linked_student_id is not null and role in ('Öğrenci','Veli')
on conflict (profile_id,student_id)
do update set relationship=excluded.relationship;
