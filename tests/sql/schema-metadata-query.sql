select jsonb_build_object(
'constraints',(select coalesce(jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'name',c.conname,'type',c.contype,'definition',pg_get_constraintdef(c.oid)) order by c.conrelid::regclass::text,c.conname),'[]'::jsonb) from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public'),
'policies',(select coalesce(jsonb_agg(to_jsonb(p) order by p.tablename,p.policyname),'[]'::jsonb) from pg_policies p where p.schemaname='public'),
'triggers',(select coalesce(jsonb_agg(jsonb_build_object('table',t.tgrelid::regclass::text,'name',t.tgname,'definition',pg_get_triggerdef(t.oid)) order by t.tgrelid::regclass::text,t.tgname),'[]'::jsonb) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal),
'indexes',(select coalesce(jsonb_agg(to_jsonb(i) order by i.tablename,i.indexname),'[]'::jsonb) from pg_indexes i where i.schemaname='public')
) as schema_metadata;
