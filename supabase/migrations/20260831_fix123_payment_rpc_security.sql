alter function public.pire_record_payment(bigint,numeric,date,text,text,bigint,date,numeric) security invoker;
revoke all on function public.pire_record_payment(bigint,numeric,date,text,text,bigint,date,numeric) from public;
revoke all on function public.pire_record_payment(bigint,numeric,date,text,text,bigint,date,numeric) from anon;
grant execute on function public.pire_record_payment(bigint,numeric,date,text,text,bigint,date,numeric) to authenticated;
