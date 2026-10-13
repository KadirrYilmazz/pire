drop policy if exists pire_notification_preferences_select on public.pire_notification_preferences;
create policy pire_notification_preferences_select on public.pire_notification_preferences for select to authenticated using (profile_id = auth.uid());
