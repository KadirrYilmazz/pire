begin;

create or replace function private.current_user_is_pire_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pire_profiles p
    where p.id = (select auth.uid())
      and p.status = 'Aktif'
      and (
        p.role = 'Yönetici'
        or 'Yönetici' = any(coalesce(p.roles, array[]::text[]))
      )
  );
$$;

-- Yayındaki duyurular giriş yapmış kullanıcılara hedef kurallarına göre görünür.
drop policy if exists pire_announcements_authorized_select on public.pire_announcements;
create policy pire_announcements_authorized_select
on public.pire_announcements
for select
to authenticated
using (
  private.current_user_is_pire_admin()
  or (
    status = 'Yayında'
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
    and (
      target_type in ('all','Tümü','tümü')
      or (
        target_type in ('role','Rol','rol')
        and exists (
          select 1 from public.pire_profiles p
          where p.id = (select auth.uid())
            and p.status = 'Aktif'
            and (
              p.role = target_value
              or target_value = any(coalesce(p.roles, array[]::text[]))
            )
        )
      )
      or (
        target_type in ('profile','user','Kullanıcı','kullanıcı')
        and target_value = (select auth.uid())::text
      )
    )
  )
);

commit;
