import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Dipakai di dalam Route Handler (app/**/route.ts) untuk membaca/menulis
// cookie sesi lewat next/headers.
export function createRouteClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Buang maxAge & expires supaya jadi session cookie:
          // otomatis terhapus saat browser benar-benar ditutup,
          // staff wajib login ulang di kunjungan berikutnya.
          const { maxAge, expires, ...sessionCookieOptions } = options;
          cookieStore.set({ name, value, ...sessionCookieOptions });
        },
        remove(name: string, options: CookieOptions) {
          const { maxAge, expires, ...sessionCookieOptions } = options;
          cookieStore.set({ name, value: "", ...sessionCookieOptions });
        },
      },
    }
  );
}