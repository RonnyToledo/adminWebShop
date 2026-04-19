"use server";
import { createServerSupabase } from "@/lib/supabase-server";

async function getServerSupabase() {
  return createServerSupabase();
}

export async function fetchStoreData(userId) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("user")
    .select(
      "*, Sitios(*, categorias(*), Products (*, coment(*), product_variants(*,quantity_discounts(*))), Events (*), codeDiscount (*),monedas(*),blogs(*))",
    )
    .eq("id", userId)
    .single();

  return { data, error };
}

export async function deleteNotification(id) {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("Notification").delete().eq("id", id);
  if (error) throw error;
}
