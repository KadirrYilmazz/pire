drop policy if exists pire_notification_reads_update on public.pire_notification_reads;
create policy pire_notification_reads_update on public.pire_notification_reads for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant update on table public.pire_notification_reads to authenticated;
