ALTER TABLE public."Sitios"
  ADD COLUMN IF NOT EXISTS accept_orders_when_closed boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.has_store_review(tienda_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."comentTienda" AS c
    JOIN public."Sitios" AS s ON s."UUID" = c."UIStore"
    WHERE s.sitioweb = tienda_slug
      AND c.user_id = auth.uid()
      AND c.star > 0
  )
$$;

REVOKE ALL ON FUNCTION public.has_store_review(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_store_review(text) TO authenticated;
