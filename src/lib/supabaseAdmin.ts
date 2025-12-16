// src/lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !serviceKey) {
  console.warn("[supabaseAdmin] Missing envs. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE");
}

export const supabaseAdmin = createClient(url!, serviceKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
