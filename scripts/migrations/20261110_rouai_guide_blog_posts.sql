-- Allow RouAI Guide to record confirmed blog draft creation actions.
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
      'update_store',
      'create_blog_post'
    )
  );
