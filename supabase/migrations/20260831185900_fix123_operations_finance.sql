create table if not exists public.pire_payments (
  id bigint primary key,
  student_id bigint not null references public.pire_students(id) on delete cascade,
  billing_month date not null,
  amount_due numeric(12,2) not null default 0 check (amount_due >= 0),
  status text not null default 'Bekliyor',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_payment_transactions (
  id bigint primary key,
  payment_id bigint references public.pire_payments(id) on delete set null,
  student_id bigint not null references public.pire_students(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  payment_date date not null,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.pire_expenses (
  id bigint primary key,
  title text not null,
  category text,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  expense_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_lessons (
  id bigint primary key,
  series_id text,
  course_id bigint references public.pire_courses(id) on delete set null,
  course_name text not null,
  teacher_id bigint references public.pire_teachers(id) on delete set null,
  teacher_name text,
  lesson_type text,
  lesson_date date not null,
  start_time time,
  end_time time,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  room text,
  recurrence text,
  recurrence_end date,
  pricing_type text,
  fee numeric(12,2) not null default 0 check (fee >= 0),
  capacity integer not null default 1 check (capacity > 0),
  status text not null,
  counts_as_held boolean not null default false,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_lesson_students (
  lesson_id bigint not null references public.pire_lessons(id) on delete cascade,
  student_id bigint not null references public.pire_students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);

create table if not exists public.pire_packages (
  id bigint primary key,
  student_id bigint not null references public.pire_students(id) on delete cascade,
  course_id bigint references public.pire_courses(id) on delete set null,
  course_name text not null,
  total_lessons integer not null default 0 check (total_lessons >= 0),
  used_lessons integer not null default 0 check (used_lessons >= 0),
  remaining_lessons integer not null default 0 check (remaining_lessons >= 0),
  makeup_rights integer not null default 0 check (makeup_rights >= 0),
  frozen_lessons integer not null default 0 check (frozen_lessons >= 0),
  start_date date,
  end_date date,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pire_package_adjustments (
  id bigint primary key,
  package_id bigint not null references public.pire_packages(id) on delete cascade,
  lesson_change integer not null default 0,
  makeup_change integer not null default 0,
  frozen_change integer not null default 0,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.pire_attendance (
  id bigint primary key,
  lesson_id bigint not null references public.pire_lessons(id) on delete cascade,
  student_id bigint not null references public.pire_students(id) on delete cascade,
  status text not null,
  late_minutes integer not null default 0 check (late_minutes >= 0),
  absence_reason text,
  parent_notified boolean not null default false,
  entered_by text,
  entered_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create table if not exists public.pire_lesson_progress (
  id bigint primary key,
  lesson_id bigint not null references public.pire_lessons(id) on delete cascade,
  student_id bigint not null references public.pire_students(id) on delete cascade,
  topic text,
  objective text,
  performance text,
  gaps text,
  next_topic text,
  homework text,
  homework_due date,
  private_note text,
  visible_note text,
  math_questions integer not null default 0,
  correct integer not null default 0,
  wrong integer not null default 0,
  blank integer not null default 0,
  music_piece text,
  bpm integer not null default 0,
  technique text,
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create table if not exists public.pire_attendance_history (
  id bigint primary key,
  attendance_id bigint references public.pire_attendance(id) on delete set null,
  lesson_id bigint references public.pire_lessons(id) on delete set null,
  student_id bigint references public.pire_students(id) on delete set null,
  old_status text,
  new_status text,
  package_id bigint references public.pire_packages(id) on delete set null,
  package_change integer not null default 0,
  changed_by text,
  changed_at timestamptz not null default now()
);

create table if not exists public.pire_makeup_rights (
  id bigint primary key,
  student_id bigint not null references public.pire_students(id) on delete cascade,
  source_lesson_id bigint references public.pire_lessons(id) on delete set null,
  makeup_lesson_id bigint references public.pire_lessons(id) on delete set null,
  reason text,
  expires_at date,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pire_lesson_changes (
  id bigint primary key,
  lesson_id bigint references public.pire_lessons(id) on delete set null,
  action text,
  old_date date,
  new_date date,
  old_time text,
  new_time text,
  old_status text,
  new_status text,
  reason text,
  changed_by text,
  changed_at timestamptz not null default now()
);

create table if not exists public.pire_teacher_payouts (
  id bigint primary key,
  teacher_id bigint references public.pire_teachers(id) on delete set null,
  teacher_name text,
  billing_month date,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  payment_date date not null,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists pire_payments_student_month_idx on public.pire_payments(student_id,billing_month);
create index if not exists pire_transactions_student_date_idx on public.pire_payment_transactions(student_id,payment_date);
create index if not exists pire_lessons_date_idx on public.pire_lessons(lesson_date,start_time);
create index if not exists pire_lesson_students_student_idx on public.pire_lesson_students(student_id);
create index if not exists pire_packages_student_status_idx on public.pire_packages(student_id,status);
create index if not exists pire_attendance_student_idx on public.pire_attendance(student_id);
create index if not exists pire_progress_student_idx on public.pire_lesson_progress(student_id);
create index if not exists pire_makeup_student_idx on public.pire_makeup_rights(student_id);
create index if not exists pire_payouts_teacher_month_idx on public.pire_teacher_payouts(teacher_id,billing_month);

drop trigger if exists pire_payments_touch_updated_at on public.pire_payments;
create trigger pire_payments_touch_updated_at before update on public.pire_payments for each row execute function private.pire_touch_updated_at();
drop trigger if exists pire_expenses_touch_updated_at on public.pire_expenses;
create trigger pire_expenses_touch_updated_at before update on public.pire_expenses for each row execute function private.pire_touch_updated_at();
drop trigger if exists pire_lessons_touch_updated_at on public.pire_lessons;
create trigger pire_lessons_touch_updated_at before update on public.pire_lessons for each row execute function private.pire_touch_updated_at();
drop trigger if exists pire_packages_touch_updated_at on public.pire_packages;
create trigger pire_packages_touch_updated_at before update on public.pire_packages for each row execute function private.pire_touch_updated_at();

alter table public.pire_payments enable row level security;
alter table public.pire_payment_transactions enable row level security;
alter table public.pire_expenses enable row level security;
alter table public.pire_lessons enable row level security;
alter table public.pire_lesson_students enable row level security;
alter table public.pire_packages enable row level security;
alter table public.pire_package_adjustments enable row level security;
alter table public.pire_attendance enable row level security;
alter table public.pire_lesson_progress enable row level security;
alter table public.pire_attendance_history enable row level security;
alter table public.pire_makeup_rights enable row level security;
alter table public.pire_lesson_changes enable row level security;
alter table public.pire_teacher_payouts enable row level security;

drop policy if exists pire_payments_authorized_select on public.pire_payments;
create policy pire_payments_authorized_select on public.pire_payments for select to authenticated using (private.current_user_can_access_pire_student(student_id));
drop policy if exists pire_transactions_authorized_select on public.pire_payment_transactions;
create policy pire_transactions_authorized_select on public.pire_payment_transactions for select to authenticated using (private.current_user_can_access_pire_student(student_id));
drop policy if exists pire_packages_authorized_select on public.pire_packages;
create policy pire_packages_authorized_select on public.pire_packages for select to authenticated using (private.current_user_can_access_pire_student(student_id));
drop policy if exists pire_attendance_authorized_select on public.pire_attendance;
create policy pire_attendance_authorized_select on public.pire_attendance for select to authenticated using (private.current_user_can_access_pire_student(student_id));
drop policy if exists pire_progress_authorized_select on public.pire_lesson_progress;
create policy pire_progress_authorized_select on public.pire_lesson_progress for select to authenticated using (private.current_user_can_access_pire_student(student_id));
drop policy if exists pire_makeup_authorized_select on public.pire_makeup_rights;
create policy pire_makeup_authorized_select on public.pire_makeup_rights for select to authenticated using (private.current_user_can_access_pire_student(student_id));
drop policy if exists pire_lesson_students_authorized_select on public.pire_lesson_students;
create policy pire_lesson_students_authorized_select on public.pire_lesson_students for select to authenticated using (private.current_user_can_access_pire_student(student_id));
drop policy if exists pire_lessons_authorized_select on public.pire_lessons;
create policy pire_lessons_authorized_select on public.pire_lessons for select to authenticated using (private.current_user_is_pire_admin() or exists (select 1 from public.pire_lesson_students pls where pls.lesson_id = pire_lessons.id and private.current_user_can_access_pire_student(pls.student_id)));

drop policy if exists pire_expenses_admin_all on public.pire_expenses;
create policy pire_expenses_admin_all on public.pire_expenses for all to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_lesson_changes_admin_all on public.pire_lesson_changes;
create policy pire_lesson_changes_admin_all on public.pire_lesson_changes for all to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_payouts_admin_all on public.pire_teacher_payouts;
create policy pire_payouts_admin_all on public.pire_teacher_payouts for all to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_attendance_history_admin_all on public.pire_attendance_history;
create policy pire_attendance_history_admin_all on public.pire_attendance_history for all to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());

drop policy if exists pire_payments_admin_write on public.pire_payments;
create policy pire_payments_admin_write on public.pire_payments for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_payments_admin_update on public.pire_payments;
create policy pire_payments_admin_update on public.pire_payments for update to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_payments_admin_delete on public.pire_payments;
create policy pire_payments_admin_delete on public.pire_payments for delete to authenticated using (private.current_user_is_pire_admin());
drop policy if exists pire_transactions_admin_write on public.pire_payment_transactions;
create policy pire_transactions_admin_write on public.pire_payment_transactions for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_transactions_admin_update on public.pire_payment_transactions;
create policy pire_transactions_admin_update on public.pire_payment_transactions for update to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_transactions_admin_delete on public.pire_payment_transactions;
create policy pire_transactions_admin_delete on public.pire_payment_transactions for delete to authenticated using (private.current_user_is_pire_admin());
drop policy if exists pire_packages_admin_write on public.pire_packages;
create policy pire_packages_admin_write on public.pire_packages for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_packages_admin_update on public.pire_packages;
create policy pire_packages_admin_update on public.pire_packages for update to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_packages_admin_delete on public.pire_packages;
create policy pire_packages_admin_delete on public.pire_packages for delete to authenticated using (private.current_user_is_pire_admin());
drop policy if exists pire_package_adjustments_admin_all on public.pire_package_adjustments;
create policy pire_package_adjustments_admin_all on public.pire_package_adjustments for all to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_lessons_admin_write on public.pire_lessons;
create policy pire_lessons_admin_write on public.pire_lessons for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_lessons_admin_update on public.pire_lessons;
create policy pire_lessons_admin_update on public.pire_lessons for update to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_lessons_admin_delete on public.pire_lessons;
create policy pire_lessons_admin_delete on public.pire_lessons for delete to authenticated using (private.current_user_is_pire_admin());
drop policy if exists pire_lesson_students_admin_write on public.pire_lesson_students;
create policy pire_lesson_students_admin_write on public.pire_lesson_students for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_lesson_students_admin_delete on public.pire_lesson_students;
create policy pire_lesson_students_admin_delete on public.pire_lesson_students for delete to authenticated using (private.current_user_is_pire_admin());
drop policy if exists pire_attendance_admin_write on public.pire_attendance;
create policy pire_attendance_admin_write on public.pire_attendance for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_attendance_admin_update on public.pire_attendance;
create policy pire_attendance_admin_update on public.pire_attendance for update to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_attendance_admin_delete on public.pire_attendance;
create policy pire_attendance_admin_delete on public.pire_attendance for delete to authenticated using (private.current_user_is_pire_admin());
drop policy if exists pire_progress_admin_write on public.pire_lesson_progress;
create policy pire_progress_admin_write on public.pire_lesson_progress for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_progress_admin_update on public.pire_lesson_progress;
create policy pire_progress_admin_update on public.pire_lesson_progress for update to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_progress_admin_delete on public.pire_lesson_progress;
create policy pire_progress_admin_delete on public.pire_lesson_progress for delete to authenticated using (private.current_user_is_pire_admin());
drop policy if exists pire_makeup_admin_write on public.pire_makeup_rights;
create policy pire_makeup_admin_write on public.pire_makeup_rights for insert to authenticated with check (private.current_user_is_pire_admin());
drop policy if exists pire_makeup_admin_update on public.pire_makeup_rights;
create policy pire_makeup_admin_update on public.pire_makeup_rights for update to authenticated using (private.current_user_is_pire_admin()) with check (private.current_user_is_pire_admin());
drop policy if exists pire_makeup_admin_delete on public.pire_makeup_rights;
create policy pire_makeup_admin_delete on public.pire_makeup_rights for delete to authenticated using (private.current_user_is_pire_admin());
