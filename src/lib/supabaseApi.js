"use server";

import { createServerSupabase } from "@/lib/supabase-server";

async function getServerSupabase() {
  return createServerSupabase();
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
