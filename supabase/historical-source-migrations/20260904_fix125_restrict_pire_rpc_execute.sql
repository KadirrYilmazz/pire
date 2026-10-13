-- Fix125: reduce the anonymous PostgREST/RPC attack surface.
-- These RPCs already enforce Pİ-RE admin authorization internally where applicable;
-- anonymous callers do not need EXECUTE privilege at the database layer.

revoke execute on function public.pire_replace_lesson_students(bigint,bigint[]) from anon;
revoke execute on function public.pire_sync_teacher_courses(bigint,text[]) from anon;
revoke execute on function public.pire_sync_profile_roles() from anon;
revoke execute on function private.pire_touch_updated_at() from anon;
