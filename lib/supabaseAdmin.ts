import { createClient } from "@supabase/supabase-js";

// Client "admin" ini hanya boleh dipakai di server (API routes), dan HANYA
// setelah sesi staff yang login berhasil diverifikasi lewat supabaseServerClient().
// SUPABASE_SERVICE_ROLE_KEY tidak boleh pernah dikirim ke browser.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Env SUPABASE belum diisi. Cek .env.local (lihat .env.local.example)."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
