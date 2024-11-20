import { supabase } from "@/lib/supa";

export async function fetchStoreData(userId) {
  const { data, error } = await supabase
    .from("user")
    .select(
      "*, Sitios(*, Products (*, agregados(*)), Events (*) , codeDiscount (*))"
    )
    .eq("id", userId)
    .single();
  return { data, error };
}

export async function deleteNotification(id) {
  const { error } = await supabase.from("Notification").delete().eq("id", id);
  if (error) throw error;
}
