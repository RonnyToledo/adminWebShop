-- Idempotency and audit records for confirmed RouAI Guide operations.
create table if not exists public.rouai_guide_action_requests (
  request_key uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public."Sitios"("UUID") on delete cascade,
  action text not null check (
    action in (
      'create_category',
      'update_category',
      'create_product',
      'update_product',
      'update_store'
    )
  ),
  status text not null check (status in ('pending', 'completed', 'failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rouai_guide_action_requests
  drop constraint if exists rouai_guide_action_requests_action_check;
alter table public.rouai_guide_action_requests
  add constraint rouai_guide_action_requests_action_check
  check (
    action in (
      'create_category',
      'update_category',
      'create_product',
      'update_product',
      'update_store'
    )
  );

create index if not exists rouai_guide_action_requests_owner_store_created_idx
  on public.rouai_guide_action_requests (user_id, store_id, created_at desc);

alter table public.rouai_guide_action_requests enable row level security;

drop policy if exists "Users read their own RouAI Guide actions"
  on public.rouai_guide_action_requests;
create policy "Users read their own RouAI Guide actions"
  on public.rouai_guide_action_requests
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and public.rouai_guide_can_access_store(store_id)
  );

drop policy if exists "Users create their own RouAI Guide actions"
  on public.rouai_guide_action_requests;
create policy "Users create their own RouAI Guide actions"
  on public.rouai_guide_action_requests
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and public.rouai_guide_can_access_store(store_id)
  );

create or replace function public.rouai_guide_finish_action(
  target_request_key uuid,
  target_status text,
  target_result jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null
    or target_status not in ('completed', 'failed')
  then
    return false;
  end if;

  update public.rouai_guide_action_requests
  set status = target_status,
      result = target_result,
      updated_at = now()
  where request_key = target_request_key
    and user_id = current_user_id
    and status = 'pending'
    and public.rouai_guide_can_access_store(store_id);

  return found;
end;
$$;

revoke all on function public.rouai_guide_finish_action(uuid, text, jsonb)
  from public;
grant execute on function public.rouai_guide_finish_action(uuid, text, jsonb)
  to authenticated;

grant select, insert
  on public.rouai_guide_action_requests
  to authenticated;
