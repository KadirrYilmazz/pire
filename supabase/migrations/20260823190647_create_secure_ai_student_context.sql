
create table if not exists public.pire_ai_students (
  id bigint primary key,
  status text not null default 'Aktif',
  monthly_fee numeric(12,2) not null default 0 check (monthly_fee >= 0),
  payment_day smallint not null default 1 check (payment_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_profile_students (
  profile_id uuid not null references public.pire_profiles(id) on delete cascade,
  student_id bigint not null references public.pire_ai_students(id) on delete cascade,
  relationship text not null default 'Kendi',
  created_at timestamptz not null default now(),
  primary key (profile_id, student_id)
);

create table if not exists public.pire_teacher_students (
  profile_id uuid not null references public.pire_profiles(id) on delete cascade,
  student_id bigint not null references public.pire_ai_students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, student_id)
);

create table if not exists public.pire_ai_lessons (
  id bigint primary key,
  course text not null default '',
  teacher_ref text,
  lesson_date date not null,
  start_time time,
  duration_minutes integer not null default 60 check (duration_minutes between 1 and 1440),
  status text not null default 'Planlandı',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_ai_lesson_students (
  lesson_id bigint not null references public.pire_ai_lessons(id) on delete cascade,
  student_id bigint not null references public.pire_ai_students(id) on delete cascade,
  primary key (lesson_id, student_id)
);

create table if not exists public.pire_ai_payments (
  id bigint primary key,
  student_id bigint not null references public.pire_ai_students(id) on delete cascade,
  billing_month date not null,
  amount_due numeric(12,2) not null default 0 check (amount_due >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  status text not null default 'Bekliyor',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_ai_packages (
  id bigint primary key,
  student_id bigint not null references public.pire_ai_students(id) on delete cascade,
  course text not null default '',
  total_lessons integer not null default 0 check (total_lessons >= 0),
  remaining_lessons integer not null default 0 check (remaining_lessons >= 0),
  makeup_rights integer not null default 0 check (makeup_rights >= 0),
  frozen_lessons integer not null default 0 check (frozen_lessons >= 0),
  status text not null default 'Aktif',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_ai_attendance (
  id bigint primary key,
  lesson_id bigint not null references public.pire_ai_lessons(id) on delete cascade,
  student_id bigint not null references public.pire_ai_students(id) on delete cascade,
  status text not null,
  late_minutes integer not null default 0 check (late_minutes >= 0),
  occurred_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create index if not exists pire_profile_students_student_idx on public.pire_profile_students(student_id);
create index if not exists pire_teacher_students_student_idx on public.pire_teacher_students(student_id);
create index if not exists pire_ai_lesson_students_student_idx on public.pire_ai_lesson_students(student_id);
create index if not exists pire_ai_lessons_date_idx on public.pire_ai_lessons(lesson_date);
create index if not exists pire_ai_payments_student_month_idx on public.pire_ai_payments(student_id, billing_month);
create index if not exists pire_ai_packages_student_idx on public.pire_ai_packages(student_id);
create index if not exists pire_ai_attendance_student_idx on public.pire_ai_attendance(student_id);

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

revoke all on function private.current_user_can_access_pire_student(bigint) from public;
grant execute on function private.current_user_can_access_pire_student(bigint) to authenticated;

alter table public.pire_ai_students enable row level security;
alter table public.pire_profile_students enable row level security;
alter table public.pire_teacher_students enable row level security;
alter table public.pire_ai_lessons enable row level security;
alter table public.pire_ai_lesson_students enable row level security;
alter table public.pire_ai_payments enable row level security;
alter table public.pire_ai_packages enable row level security;
alter table public.pire_ai_attendance enable row level security;

create policy "ai_students_select_authorized" on public.pire_ai_students for select to authenticated
using ((select private.current_user_can_access_pire_student(id)));
create policy "ai_students_admin_write" on public.pire_ai_students for all to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

create policy "profile_students_select_own_or_admin" on public.pire_profile_students for select to authenticated
using (profile_id = (select auth.uid()) or (select private.current_user_is_pire_admin()));
create policy "profile_students_admin_write" on public.pire_profile_students for all to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

create policy "teacher_students_select_own_or_admin" on public.pire_teacher_students for select to authenticated
using (profile_id = (select auth.uid()) or (select private.current_user_is_pire_admin()));
create policy "teacher_students_admin_write" on public.pire_teacher_students for all to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

create policy "ai_lessons_select_authorized" on public.pire_ai_lessons for select to authenticated
using (exists (
  select 1 from public.pire_ai_lesson_students ls
  where ls.lesson_id = id
    and (select private.current_user_can_access_pire_student(ls.student_id))
));
create policy "ai_lessons_admin_write" on public.pire_ai_lessons for all to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

create policy "ai_lesson_students_select_authorized" on public.pire_ai_lesson_students for select to authenticated
using ((select private.current_user_can_access_pire_student(student_id)));
create policy "ai_lesson_students_admin_write" on public.pire_ai_lesson_students for all to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

create policy "ai_payments_select_authorized" on public.pire_ai_payments for select to authenticated
using ((select private.current_user_can_access_pire_student(student_id)));
create policy "ai_payments_admin_write" on public.pire_ai_payments for all to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

create policy "ai_packages_select_authorized" on public.pire_ai_packages for select to authenticated
using ((select private.current_user_can_access_pire_student(student_id)));
create policy "ai_packages_admin_write" on public.pire_ai_packages for all to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

create policy "ai_attendance_select_authorized" on public.pire_ai_attendance for select to authenticated
using ((select private.current_user_can_access_pire_student(student_id)));
create policy "ai_attendance_admin_write" on public.pire_ai_attendance for all to authenticated
using ((select private.current_user_is_pire_admin()))
with check ((select private.current_user_is_pire_admin()));

grant select, insert, update, delete on public.pire_ai_students to authenticated;
grant select, insert, update, delete on public.pire_profile_students to authenticated;
grant select, insert, update, delete on public.pire_teacher_students to authenticated;
grant select, insert, update, delete on public.pire_ai_lessons to authenticated;
grant select, insert, update, delete on public.pire_ai_lesson_students to authenticated;
grant select, insert, update, delete on public.pire_ai_payments to authenticated;
grant select, insert, update, delete on public.pire_ai_packages to authenticated;
grant select, insert, update, delete on public.pire_ai_attendance to authenticated;
