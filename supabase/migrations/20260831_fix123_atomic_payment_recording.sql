create or replace function public.pire_record_payment(
  p_student_id bigint,
  p_amount numeric,
  p_payment_date date default current_date,
  p_method text default null,
  p_notes text default null,
  p_payment_id bigint default null,
  p_billing_month date default null,
  p_amount_due numeric default null
)
returns table(transaction_id bigint, payment_id bigint, payment_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment_id bigint := p_payment_id;
  v_due numeric := 0;
  v_paid numeric := 0;
  v_status text := null;
  v_transaction_id bigint;
begin
  if not private.current_user_is_pire_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_student_id is null or p_student_id <= 0 or p_amount is null or p_amount <= 0 then
    raise exception 'invalid_payment_input' using errcode = '22023';
  end if;
  if not exists(select 1 from public.pire_students s where s.id = p_student_id) then
    raise exception 'student_not_found' using errcode = 'P0002';
  end if;

  if v_payment_id is not null then
    select amount_due, status into v_due, v_status
    from public.pire_payments
    where id = v_payment_id and student_id = p_student_id
    for update;
    if not found then raise exception 'payment_not_found' using errcode = 'P0002'; end if;
  elsif p_billing_month is not null then
    select id, amount_due, status into v_payment_id, v_due, v_status
    from public.pire_payments
    where student_id = p_student_id and billing_month = date_trunc('month',p_billing_month)::date
    order by id desc limit 1
    for update;
    if not found then
      insert into public.pire_payments(student_id,billing_month,amount_due,status,paid_at)
      values(p_student_id,date_trunc('month',p_billing_month)::date,greatest(coalesce(p_amount_due,p_amount),0),'Bekliyor',null)
      returning id, amount_due, status into v_payment_id, v_due, v_status;
    end if;
  end if;

  insert into public.pire_payment_transactions(payment_id,student_id,amount,payment_date,method,notes)
  values(v_payment_id,p_student_id,round(p_amount::numeric,2),coalesce(p_payment_date,current_date),nullif(btrim(p_method),''),nullif(btrim(p_notes),''))
  returning id into v_transaction_id;

  if v_payment_id is not null then
    select coalesce(sum(amount),0) into v_paid from public.pire_payment_transactions where payment_id = v_payment_id;
    if v_paid >= v_due and v_due > 0 then
      update public.pire_payments set status='Ödendi', paid_at=coalesce(paid_at,clock_timestamp()), updated_at=clock_timestamp() where id=v_payment_id;
      v_status := 'Ödendi';
    else
      update public.pire_payments set updated_at=clock_timestamp() where id=v_payment_id;
    end if;
  end if;

  return query select v_transaction_id, v_payment_id, v_status;
end;
$$;

revoke all on function public.pire_record_payment(bigint,numeric,date,text,text,bigint,date,numeric) from public;
grant execute on function public.pire_record_payment(bigint,numeric,date,text,text,bigint,date,numeric) to authenticated;
