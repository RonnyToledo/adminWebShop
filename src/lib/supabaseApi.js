"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { OrderProducts } from "@/utils/products";
import { fetchGAData } from "@/lib/ga-utils";

async function getServerSupabase() {
  return createServerSupabase();
}

async function getStoreAccess(supabase, userId) {
  const { data: membership, error: memberError } = await supabase
    .from("store_members")
    .select("store_role, store_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) return { membership: null, memberError };

  if (membership) return { membership, memberError: null };

  const { data: legacyStore, error: legacyError } = await supabase
    .from("Sitios")
    .select("UUID")
    .eq("Editor", userId)
    .maybeSingle();

  if (legacyError) return { membership: null, memberError: legacyError };

  return {
    membership: legacyStore
      ? { store_id: legacyStore.UUID, store_role: "owner" }
      : null,
    memberError: null,
  };
}

export async function fetchStoreShellData(userId) {
  const supabase = await getServerSupabase();
  const [{ data: user, error: userError }, access] = await Promise.all([
    supabase.from("user").select("*").eq("id", userId).maybeSingle(),
    getStoreAccess(supabase, userId),
  ]);

  if (userError) return { data: null, error: userError };
  if (access.memberError) return { data: null, error: access.memberError };
  if (!access.membership) {
    return { data: { user, store: null, store_role: null }, error: null };
  }

  const { data: store, error: storeError } = await supabase
    .from("Sitios")
    .select(
      "UUID, sitioweb, name, plan, plan_vence, stocks, marketing, monedas(*)",
    )
    .eq("UUID", access.membership.store_id)
    .single();

  if (storeError) return { data: null, error: storeError };

  return {
    data: {
      user,
      store,
      store_role: access.membership.store_role,
    },
    error: null,
  };
}

export async function fetchProductsData(userId) {
  const supabase = await getServerSupabase();
  const access = await getStoreAccess(supabase, userId);
  if (access.memberError) return { data: null, error: access.memberError };
  if (!access.membership) return { data: { store: null }, error: null };

  const { data: store, error } = await supabase
    .from("Sitios")
    .select(
      "UUID, sitioweb, categorias(*), Products(*, coment(*), product_variants(*, quantity_discounts(*)))",
    )
    .eq("UUID", access.membership.store_id)
    .single();
  if (error) return { data: null, error };

  const categories = [...(store.categorias ?? [])].sort(
    (first, second) => (first.order ?? 0) - (second.order ?? 0),
  );
  const products = OrderProducts(
    [...(store.Products ?? [])].sort(
      (first, second) => (first.order ?? 0) - (second.order ?? 0),
    ),
    categories,
  ).map((product) => ({
    ...product,
    visitas: product.visitas ?? 0,
    caracteristicas: safeJsonParse(product?.caracteristicas, []),
  }));

  return {
    data: {
      store: {
        UUID: store.UUID,
        sitioweb: store.sitioweb,
        categoria: categories,
      },
      products,
      store_role: access.membership.store_role,
    },
    error: null,
  };
}

export async function fetchDiscountData(userId) {
  const shell = await fetchStoreShellData(userId);
  if (shell.error || !shell.data?.store?.UUID) return shell;
  const supabase = await getServerSupabase();
  const { data: code, error } = await supabase
    .from("codeDiscount")
    .select("*")
    .eq("storeID", shell.data.store.UUID);
  if (error) return { data: null, error };
  return { data: { ...shell.data, code: code ?? [] }, error: null };
}

export async function fetchBlogData(userId) {
  const shell = await fetchStoreShellData(userId);
  if (shell.error || !shell.data?.store?.UUID) return shell;
  const supabase = await getServerSupabase();
  const { data: blogs, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("ui_store", shell.data.store.UUID)
    .order("created_at", { ascending: false });
  if (error) return { data: null, error };
  return {
    data: { ...shell.data, store: { ...shell.data.store, blogs: blogs ?? [] } },
    error: null,
  };
}

export async function fetchAnalyticsData(userId) {
  const supabase = await getServerSupabase();
  const access = await getStoreAccess(supabase, userId);
  if (access.memberError) return { data: null, error: access.memberError };
  if (!access.membership) return { data: { store: null }, error: null };
  const { data: store, error } = await supabase
    .from("Sitios")
    .select(
      "UUID, sitioweb, categorias(*), Products(productId, title, creado, visitas)",
    )
    .eq("UUID", access.membership.store_id)
    .single();
  if (error) return { data: null, error };
  const ga = store.sitioweb ? await fetchGAData(store.sitioweb) : null;
  return {
    data: {
      store: {
        UUID: store.UUID,
        sitioweb: store.sitioweb,
        categoria: store.categorias ?? [],
      },
      products: store.Products ?? [],
      ga,
      store_role: access.membership.store_role,
    },
    error: null,
  };
}

async function fetchStoreDomainData(userId, select) {
  const supabase = await getServerSupabase();
  const access = await getStoreAccess(supabase, userId);
  if (access.memberError) return { data: null, error: access.memberError };
  if (!access.membership) return { data: { store: null }, error: null };

  const { data: store, error } = await supabase
    .from("Sitios")
    .select(select)
    .eq("UUID", access.membership.store_id)
    .single();
  if (error) return { data: null, error };

  return {
    data: {
      store: normalizeStoreData(store),
      store_role: access.membership.store_role,
    },
    error: null,
  };
}

function normalizeStoreData(store) {
  if (!store) return store;
  return {
    ...store,
    envios: safeJsonParse(store.envios, []),
  };
}

export async function fetchConfigurationData(userId) {
  const result = await fetchStoreDomainData(
    userId,
    "*, categorias(*), horarios(*), monedas(*), Products(productId, default_moneda, visible)",
  );
  if (result.error || !result.data?.store) return result;
  return {
    data: {
      ...result.data,
      products: result.data.store.Products ?? [],
    },
    error: null,
  };
}

export async function fetchThemeData(userId) {
  return fetchStoreDomainData(userId, "*");
}

export async function fetchSocialData(userId) {
  return fetchStoreDomainData(
    userId,
    "UUID, sitioweb, email, cell, redes, contacto",
  );
}

export async function fetchSalesData(userId) {
  const result = await fetchStoreDomainData(
    userId,
    "UUID, sitioweb, name, Provincia, plan, plan_vence",
  );
  if (result.error || !result.data?.store) return result;

  const supabase = await getServerSupabase();
  const [
    { data: events, error: eventsError },
    { data: code, error: codeError },
    ga,
  ] = await Promise.all([
    supabase
      .from("Events")
      .select("*")
      .eq("uid", result.data.store.UUID)
      .order("created_at", { ascending: false }),
    supabase
      .from("codeDiscount")
      .select("*")
      .eq("storeID", result.data.store.UUID),
    result.data.store.sitioweb
      ? fetchGAData(result.data.store.sitioweb)
      : Promise.resolve(null),
  ]);

  if (eventsError) return { data: null, error: eventsError };
  if (codeError) return { data: null, error: codeError };

  return {
    data: {
      ...result.data,
      ga,
      events: events ?? [],
      code: code ?? [],
    },
    error: null,
  };
}

export async function fetchNewProductData(userId) {
  const result = await fetchStoreDomainData(
    userId,
    "UUID, sitioweb, stocks, categorias(*), monedas(*)",
  );
  if (result.error || !result.data?.store) return result;

  return {
    ...result,
    data: {
      ...result.data,
      store: {
        ...result.data.store,
        categoria: result.data.store.categorias ?? [],
      },
    },
  };
}

export async function fetchDeliveryData(userId) {
  return fetchStoreDomainData(userId, "UUID, sitioweb, name, envios");
}

export async function fetchPremiumData(userId) {
  return fetchStoreDomainData(userId, "UUID, sitioweb");
}

export async function fetchGuideData(userId) {
  return fetchStoreDomainData(userId, "UUID, sitioweb, name");
}

export async function fetchDashboardData(userId) {
  const result = await fetchStoreDomainData(
    userId,
    "*, categorias(*), horarios(*), monedas(*), Products(*, product_variants(*)), Events(*), codeDiscount(*)",
  );
  if (result.error || !result.data?.store) return result;
  return {
    data: {
      ...result.data,
      products: result.data.store.Products ?? [],
      events: result.data.store.Events ?? [],
      code: result.data.store.codeDiscount ?? [],
      ga: result.data.store.sitioweb
        ? await fetchGAData(result.data.store.sitioweb)
        : null,
    },
    error: null,
  };
}

export async function fetchProductSpecificData(userId, productId) {
  const supabase = await getServerSupabase();
  const access = await getStoreAccess(supabase, userId);
  if (access.memberError) return { data: null, error: access.memberError };
  if (!access.membership) return { data: { store: null }, error: null };

  const [
    { data: store, error: storeError },
    { data: product, error: productError },
  ] = await Promise.all([
    supabase
      .from("Sitios")
      .select("UUID, sitioweb, categorias(*), monedas(*), stocks")
      .eq("UUID", access.membership.store_id)
      .single(),
    supabase
      .from("Products")
      .select("*, coment(*), product_variants(*, quantity_discounts(*))")
      .eq("storeId", access.membership.store_id)
      .eq("productId", productId)
      .single(),
  ]);
  if (storeError) return { data: null, error: storeError };
  if (productError) return { data: null, error: productError };
  return {
    data: {
      store: { ...store, categoria: store.categorias ?? [] },
      products: [
        {
          ...product,
          caracteristicas: safeJsonParse(product.caracteristicas, []),
        },
      ],
      store_role: access.membership.store_role,
    },
    error: null,
  };
}

export async function fetchOrderSpecificData(userId, orderId) {
  const result = await fetchStoreDomainData(userId, "UUID, sitioweb, name");
  if (result.error || !result.data?.store) return result;
  const supabase = await getServerSupabase();
  const { data: order, error } = await supabase
    .from("Events")
    .select("*")
    .eq("uid", result.data.store.UUID)
    .eq("UID_Venta", orderId)
    .single();
  if (error) return { data: null, error };
  return { data: { ...result.data, order }, error: null };
}

export async function fetchCategorySpecificData(userId, categoryId) {
  const result = await fetchStoreDomainData(
    userId,
    "UUID, sitioweb, categorias(*)",
  );
  if (result.error || !result.data?.store) return result;
  return {
    data: {
      ...result.data,
      store: {
        ...result.data.store,
        categoria: (result.data.store.categorias ?? []).filter(
          (category) => String(category.id) === String(categoryId),
        ),
      },
    },
    error: null,
  };
}

function safeJsonParse(value, fallback = []) {
  try {
    if (value == null || value === "") return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function fetchCategoryData(userId) {
  const supabase = await getServerSupabase();
  const access = await getStoreAccess(supabase, userId);

  if (access.memberError) return { data: null, error: access.memberError };
  if (!access.membership) {
    return { data: { store: null, store_role: null }, error: null };
  }

  const { data: store, error: storeError } = await supabase
    .from("Sitios")
    .select("UUID, sitioweb, categorias(*), Products(caja)")
    .eq("UUID", access.membership.store_id)
    .single();

  if (storeError) return { data: null, error: storeError };

  const categories = [...(store.categorias ?? [])].sort(
    (first, second) => (first.order ?? 0) - (second.order ?? 0),
  );

  return {
    data: {
      store: { ...store, categoria: categories },
      products: store.Products ?? [],
      store_role: access.membership.store_role,
    },
    error: null,
  };
}

export async function fetchStoreData(userId) {
  const supabase = await getServerSupabase();

  const [
    { data: membership, error: memberError },
    { data: user, error: userError },
  ] = await Promise.all([
    supabase
      .from("store_members")
      .select("store_role, store_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("user").select("*").eq("id", userId).maybeSingle(),
  ]);

  if (memberError) return { data: null, error: memberError };
  if (userError) return { data: null, error: userError };

  if (!membership) {
    const { data: legacyStore, error: legacyError } = await supabase
      .from("Sitios")
      .select(
        `
        *,
        regions(country_code,region_code),
        horarios(*),
        categorias(*),
        Products(*, coment(*), product_variants(*, quantity_discounts(*))),
        Events(*),
        codeDiscount(*),
        monedas(*),
        blogs(*)
      `,
      )
      .eq("Editor", userId)
      .maybeSingle();

    if (legacyError || !legacyStore) {
      return {
        data: { user, store: null, store_role: null },
        error: legacyError,
      };
    }

    return {
      data: {
        user,
        store: legacyStore,
        store_role: "owner",
      },
      error: null,
    };
  }

  const { data: store, error } = await supabase
    .from("Sitios")
    .select(
      `
      *,
        regions(country_code,region_code),
      horarios(*),
      categorias(*),
      Products(*, coment(*), product_variants(*, quantity_discounts(*))),
      Events(*),
      codeDiscount(*),
      monedas(*),
      blogs(*)
    `,
    )
    .eq("UUID", membership.store_id)
    .single();

  if (error || !store) return { data: null, error };

  return {
    data: {
      user,
      store,
      store_role: membership.store_role,
    },
    error: null,
  };
}

export async function fetchStoreAccessData(userId) {
  const supabase = await getServerSupabase();

  const [
    { data: membership, error: memberError },
    { data: user, error: userError },
  ] = await Promise.all([
    supabase
      .from("store_members")
      .select("store_role, store_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("user").select("*").eq("id", userId).maybeSingle(),
  ]);

  if (memberError) return { data: null, error: memberError };
  if (userError) return { data: null, error: userError };

  if (membership) {
    return {
      data: {
        user,
        store_id: membership.store_id,
        store_role: membership.store_role,
      },
      error: null,
    };
  }

  const { data: legacyStore, error: legacyError } = await supabase
    .from("Sitios")
    .select("UUID")
    .eq("Editor", userId)
    .maybeSingle();

  if (legacyError) {
    return {
      data: { user, store_id: null, store_role: null },
      error: legacyError,
    };
  }

  return {
    data: {
      user,
      store_id: legacyStore?.UUID ?? null,
      store_role: legacyStore?.UUID ? "owner" : null,
    },
    error: null,
  };
}
