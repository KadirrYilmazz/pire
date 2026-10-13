create unique index if not exists pire_notification_preferences_profile_id_uidx on public.pire_notification_preferences(profile_id);
create unique index if not exists pire_notification_reads_profile_key_uidx on public.pire_notification_reads(profile_id, notification_key);
