import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Hapus maxAge dan expires agar cookie menjadi session cookie
          // yang otomatis terhapus saat tab/browser ditutup.
          const { maxAge, expires, ...sessionCookieOptions } = options;

          request.cookies.set({ name, value, ...sessionCookieOptions });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...sessionCookieOptions });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // PENTING: pakai getUser(), bukan getSession().
  // getSession() di middleware hanya membaca cookie tanpa verifikasi ke server,
  // jadi bisa "percaya" token yang sudah tidak valid/kadaluarsa.
  // getUser() memvalidasi token langsung ke server Supabase Auth setiap request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");

  // Rute-rute ini harus tetap bisa diakses TANPA sesi, karena justru
  // rute inilah yang bertugas membuat sesi login (proses login Telegram).
  const isAuthFlowRoute =
    pathname.startsWith("/api/auth/telegram") ||
    pathname.startsWith("/auth/callback");

  // belum login dan bukan lagi di halaman login/proses auth -> lempar ke /login
  if (!user && !isLoginPage && !isAuthFlowRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // sudah login tapi buka /login -> lempar ke beranda
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
