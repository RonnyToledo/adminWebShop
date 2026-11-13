begin;

revoke select on public.store_traffic_daily from public, anon;
grant select on public.store_traffic_daily to authenticated;

drop policy if exists "Enable read access for all users"
  on public.store_traffic_daily;
drop policy if exists "Platform administrators read traffic metrics"
  on public.store_traffic_daily;

alter table public.store_traffic_daily enable row level security;

create policy "Platform administrators read traffic metrics"
  on public.store_traffic_daily
  for select
  to authenticated
  using (
    exists (
      select 1
      from public."user" as account
      where account.id = (select auth.uid())
        and account.role = 'admin'
    )
  );

commit;
