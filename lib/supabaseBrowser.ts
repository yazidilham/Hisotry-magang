import { createBrowserClient } from "@supabase/ssr";

// Dipakai di komponen client (mis. halaman login) untuk sign in / sign out.
export function supabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
