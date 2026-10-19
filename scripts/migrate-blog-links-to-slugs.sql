begin;

alter table public.blogs
  alter column former type text using former::text,
  alter column next type text using next::text;

update public.blogs as source
set former = linked.slug
from public.blogs as linked
where source.ui_store = linked.ui_store
  and source.former = linked.id::text;

update public.blogs as source
set next = linked.slug
from public.blogs as linked
where source.ui_store = linked.ui_store
  and source.next = linked.id::text;

commit;
