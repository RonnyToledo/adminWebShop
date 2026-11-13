begin;

create or replace view public.public_stores
with (security_barrier = true)
as
select
  store.id,
  store."UUID",
  store.sitioweb,
  store."urlPoster",
  store.parrrafo,
  store.name,
  store.municipio,
  store.tipo,
  store.active,
  store.region,
  store.banner,
  store.domicilio,
  store.plan,
  store.plan_vence,
  store.verified,
  store.visitas,
  store.color,
  store."colorAutomatic"
from public."Sitios" as store
where store.active is true
  and (store.plan_vence is null or store.plan_vence > now());

grant select on public.public_stores to anon, authenticated;

create or replace view public.public_profiles
with (security_barrier = true)
as
select account.id, account.name, account.image
from public."user" as account;

grant select on public.public_profiles to anon, authenticated;

create or replace view public.public_store_traffic_daily
with (security_barrier = true)
as
select
  traffic.day,
  sum(traffic.day_visits)::bigint as day_visits
from public.store_traffic_daily as traffic
join public."Sitios" as store
  on store."UUID" = traffic.store_uuid
where store.active is true
  and (store.plan_vence is null or store.plan_vence > now())
group by traffic.day;

grant select on public.public_store_traffic_daily to anon, authenticated;

commit;
