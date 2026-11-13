begin;

do $$
declare
  invalid_plan_count bigint;
begin
  select count(*)
    into invalid_plan_count
  from public."Sitios" as store
  left join public.plan_config as plan
    on plan.id = store.plan
  where plan.id is null;

  if invalid_plan_count > 0 then
    raise exception
      'Cannot link Sitios.plan to plan_config: % store(s) use an unconfigured plan',
      invalid_plan_count;
  end if;

  alter table public."Sitios"
    drop constraint if exists sitios_plan_check;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public."Sitios"'::regclass
      and conname = 'sitios_plan_config_fkey'
  ) then
    alter table public."Sitios"
      add constraint sitios_plan_config_fkey
      foreign key (plan)
      references public.plan_config (id)
      on update cascade
      on delete restrict;
  end if;
end;
$$;

commit;
