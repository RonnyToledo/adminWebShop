-- Structured assistant tool proposals are stored with the assistant message.
alter table public.rouai_guide_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;
