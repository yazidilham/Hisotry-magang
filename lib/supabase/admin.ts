import { createClient } from "@supabase/supabase-js";

// PERINGATAN: client ini pakai service_role key (akses penuh, bypass RLS).
// Jangan pernah import file ini dari komponen client ("use client")
// atau kirim instance-nya ke browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
