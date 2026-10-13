create index pire_profiles_created_by_idx on public.pire_profiles (created_by) where created_by is not null;
