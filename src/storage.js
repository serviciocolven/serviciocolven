import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mqxehhulzuaqciwbkkcx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xeGVoaHVsenVhcWNpd2Jra2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjE1NjksImV4cCI6MjA5OTI5NzU2OX0.QpxbJzhDaMBMeo7e9rlMTc4LInqE3DytvSlYxpUzaPE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Adaptador con la misma forma que window.storage (get/set/delete/list),
// pero respaldado por una base de datos real en Supabase (tabla kv_store).
export const storage = {
  async get(key) {
    const { data, error } = await supabase
      .from("kv_store")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { key, value: data.value };
  },

  async set(key, value) {
    const { error } = await supabase
      .from("kv_store")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) {
      console.error("Error guardando en Supabase:", error);
      return null;
    }
    return { key, value };
  },

  async delete(key) {
    const { error } = await supabase.from("kv_store").delete().eq("key", key);
    if (error) return null;
    return { key, deleted: true };
  },

  async list(prefix) {
    let q = supabase.from("kv_store").select("key");
    if (prefix) q = q.like("key", `${prefix}%`);
    const { data, error } = await q;
    if (error) return null;
    return { keys: (data || []).map((d) => d.key) };
  },
};
