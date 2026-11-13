-- RouAI Guide conversations are private to one authenticated user and one store.
-- Apply this migration only after confirming the deployed store_members schema.

create or replace function public.rouai_guide_can_access_store(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.store_members as membership
      where membership.user_id = auth.uid()
        and membership.store_id = target_store_id
        and membership.active is true
    )
    or exists (
      select 1
      from public."Sitios" as store
      where store."UUID" = target_store_id
        and store."Editor" = auth.uid()
    );
$$;

revoke all on function public.rouai_guide_can_access_store(uuid) from public;
grant execute on function public.rouai_guide_can_access_store(uuid) to authenticated;

create table if not exists public.rouai_guide_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public."Sitios"("UUID") on delete cascade,
  title text not null default 'Nueva conversación'
    check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rouai_guide_conversations_owner_store_updated_idx
  on public.rouai_guide_conversations (user_id, store_id, updated_at desc);

create table if not exists public.rouai_guide_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.rouai_guide_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 6000),
  created_at timestamptz not null default now()
);

create index if not exists rouai_guide_messages_conversation_created_idx
  on public.rouai_guide_messages (conversation_id, created_at);

alter table public.rouai_guide_conversations enable row level security;
alter table public.rouai_guide_messages enable row level security;

drop policy if exists "Users manage their own RouAI Guide conversations"
  on public.rouai_guide_conversations;
create policy "Users manage their own RouAI Guide conversations"
  on public.rouai_guide_conversations
  for all
  to authenticated
  using (
    user_id = auth.uid()
    and public.rouai_guide_can_access_store(store_id)
  )
  with check (
    user_id = auth.uid()
    and public.rouai_guide_can_access_store(store_id)
  );

drop policy if exists "Users read their own RouAI Guide messages"
  on public.rouai_guide_messages;
create policy "Users read their own RouAI Guide messages"
  on public.rouai_guide_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.rouai_guide_conversations as conversation
      where conversation.id = conversation_id
        and conversation.user_id = auth.uid()
        and public.rouai_guide_can_access_store(conversation.store_id)
    )
  );

drop policy if exists "Users add messages to their own RouAI Guide conversations"
  on public.rouai_guide_messages;
create policy "Users add messages to their own RouAI Guide conversations"
  on public.rouai_guide_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.rouai_guide_conversations as conversation
      where conversation.id = conversation_id
        and conversation.user_id = auth.uid()
        and public.rouai_guide_can_access_store(conversation.store_id)
    )
  );

grant select, insert, update, delete
  on public.rouai_guide_conversations
  to authenticated;
grant select, insert
  on public.rouai_guide_messages
  to authenticated;
