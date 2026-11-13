begin;

do $$
declare
  function_definition text;
  corrected_definition text;
begin
  select pg_get_functiondef(
    'public.search_product_offers(text,text,text,text,text,text,boolean,boolean,text,real,text,integer,integer)'::regprocedure
  )
  into function_definition;

  if position('s.vence' in function_definition) > 0 then
    corrected_definition := regexp_replace(
      function_definition,
      's\.plan_vence\s*,\s*s\.vence\s*,',
      's.plan_vence,',
      'g'
    );

    if corrected_definition = function_definition
      or position('s.vence' in corrected_definition) > 0 then
      raise exception
        'Unexpected search_product_offers expiration expression';
    end if;

    execute corrected_definition;
  end if;
end;
$$;

commit;
