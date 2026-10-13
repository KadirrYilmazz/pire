revoke all on function private.current_user_can_access_pire_student_finance(bigint) from public;
revoke all on function private.current_user_can_access_pire_student_finance(bigint) from anon;
grant execute on function private.current_user_can_access_pire_student_finance(bigint) to authenticated;
